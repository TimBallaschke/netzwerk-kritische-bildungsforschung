<?php

namespace AktuellesScraper;

use Kirby\Cms\Page;

class Scraper
{
    private Page $page;

    public function __construct(Page $page)
    {
        $this->page = $page;
    }

    public function run(array $opts = []): array
    {
        @set_time_limit(180);

        $dryRun       = (bool) ($opts['dryRun'] ?? false);
        $themen       = $this->lines('themen');
        $formate      = $this->lines('formate');
        $quellen      = $this->lines('quellen');
        $maxResults   = (int) ($this->page->maxResults()->value() ?: 10);
        $minRelevance = (int) ($this->page->minRelevance()->value() ?: 3);

        if (empty($themen)) {
            return ['ok' => false, 'error' => 'Keine Themen-Keywords konfiguriert.'];
        }
        if (empty($formate)) {
            $formate = [''];
        }

        $tavilyKey = Env::get('TAVILY_API_KEY');
        $provider  = Env::get('LLM_PROVIDER', 'openai') ?? 'openai';
        $llmKey    = $provider === 'anthropic'
            ? Env::get('ANTHROPIC_API_KEY')
            : Env::get('OPENAI_API_KEY');

        if (!$tavilyKey) {
            return ['ok' => false, 'error' => 'TAVILY_API_KEY fehlt in .env'];
        }
        if (!$llmKey) {
            return ['ok' => false, 'error' => strtoupper($provider) . '_API_KEY fehlt in .env'];
        }

        $tavily = new Tavily($tavilyKey);
        $llm    = new LLM($provider, $llmKey);
        $writer = new Writer();

        $queries = [];
        foreach ($themen as $thema) {
            foreach ($formate as $format) {
                $q = trim($thema . ' ' . $format);
                if ($q !== '') {
                    $queries[] = $q;
                }
            }
        }
        $queries = array_slice($queries, 0, 12);

        $existing = [];
        foreach ($this->page->childrenAndDrafts() as $child) {
            $u = $child->content()->get('url')->value();
            if ($u) {
                $existing[$u] = true;
            }
        }

        $candidates = [];
        $seenUrls   = $existing;
        foreach ($queries as $q) {
            try {
                $results = $tavily->search($q, [
                    'max'            => 3,
                    'includeDomains' => $quellen ?: null,
                ]);
            } catch (\Throwable $e) {
                continue;
            }
            foreach ($results as $r) {
                $url = $r['url'] ?? null;
                if (!$url || isset($seenUrls[$url])) {
                    continue;
                }
                $seenUrls[$url] = true;
                $candidates[] = [
                    'url'     => $url,
                    'title'   => $r['title']   ?? '',
                    'snippet' => $r['content'] ?? '',
                    'source'  => parse_url($url, PHP_URL_HOST) ?: '',
                    'query'   => $q,
                ];
            }
        }

        $candidates = array_slice($candidates, 0, 20);

        $items = [];
        foreach ($candidates as $c) {
            try {
                $rated = $llm->classify($c);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$rated || (int) ($rated['relevance'] ?? 0) < $minRelevance) {
                continue;
            }
            $rated['url']    = $c['url'];
            $rated['source'] = $c['source'];
            $items[] = $rated;
        }

        usort($items, fn($a, $b) => (int) ($b['relevance'] ?? 0) <=> (int) ($a['relevance'] ?? 0));
        $items = array_slice($items, 0, $maxResults);

        $created = 0;
        if (!$dryRun) {
            foreach ($items as $item) {
                if ($writer->createDraft($this->page, $item)) {
                    $created++;
                }
            }
            $page = $this->page;
            kirby()->impersonate('kirby', function () use ($page, $created, $candidates) {
                $page->update([
                    'lastScrapedAt'     => date('Y-m-d H:i:s'),
                    'lastScrapedResult' => sprintf(
                        '%d Entwürfe angelegt (%d Kandidaten geprüft)',
                        $created,
                        count($candidates)
                    ),
                ]);
            });
        }

        return [
            'ok'         => true,
            'queries'    => count($queries),
            'candidates' => count($candidates),
            'kept'       => count($items),
            'created'    => $created,
            'dryRun'     => $dryRun,
            'items'      => array_map(fn($i) => [
                'title'     => $i['title_de']  ?? '',
                'type'      => $i['type']      ?? '',
                'relevance' => (int) ($i['relevance'] ?? 0),
                'url'       => $i['url']       ?? '',
            ], $items),
        ];
    }

    private function lines(string $field): array
    {
        $value = $this->page->content()->get($field)->value();
        if (!$value) {
            return [];
        }
        $lines = preg_split('/\r?\n/', $value);
        return array_values(array_filter(array_map('trim', $lines)));
    }
}
