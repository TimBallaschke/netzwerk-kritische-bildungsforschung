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
        @set_time_limit(240);

        Status::set('Initialisiere …', null, null, 'init');

        $dryRun       = (bool) ($opts['dryRun'] ?? false);
        $themen       = $this->lines('themen');
        $formate      = $this->lines('formate');
        $quellen      = $this->lines('quellen');
        $rssFeeds     = $this->lines('rssFeeds');
        $maxResults   = (int) ($this->page->maxResults()->value() ?: 10);
        $minRelevance = (int) ($this->page->minRelevance()->value() ?: 3);

        $enabled = $this->page->content()->get('sourcesEnabled')->split();
        if (empty($enabled)) {
            $enabled = ['tavily', 'openalex', 'rss'];
        }

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

        if (in_array('tavily', $enabled, true) && !$tavilyKey) {
            return ['ok' => false, 'error' => 'TAVILY_API_KEY fehlt in .env'];
        }
        if (!$llmKey) {
            return ['ok' => false, 'error' => strtoupper($provider) . '_API_KEY fehlt in .env'];
        }

        $existing = [];
        foreach ($this->page->childrenAndDrafts() as $child) {
            $u = $child->content()->get('url')->value();
            if ($u) {
                $existing[$u] = true;
            }
        }

        $byOrigin = [
            'tavily'   => [],
            'openalex' => [],
            'rss'      => [],
        ];
        $sourceStats  = ['tavily' => 0, 'openalex' => 0, 'rss' => 0];
        $sourceErrors = ['tavily' => [], 'openalex' => [], 'rss' => []];

        // --- Tavily ---
        if (in_array('tavily', $enabled, true) && $tavilyKey) {
            $tavily  = new Tavily($tavilyKey);
            $queries = [];
            foreach ($themen as $thema) {
                foreach ($formate as $format) {
                    $q = trim($thema . ' ' . $format);
                    if ($q !== '') {
                        $queries[] = $q;
                    }
                }
            }
            $queries    = array_slice($queries, 0, 12);
            $totalQ     = count($queries);
            $idxQ       = 0;
            foreach ($queries as $q) {
                $idxQ++;
                Status::set('Tavily-Suche: „' . $q . '"', $idxQ, $totalQ, 'tavily');
                try {
                    $results = $tavily->search($q, [
                        'max'            => 3,
                        'includeDomains' => $quellen ?: null,
                    ]);
                } catch (\Throwable $e) {
                    $sourceErrors['tavily'][] = $e->getMessage();
                    continue;
                }
                foreach ($results as $r) {
                    $url = $r['url'] ?? null;
                    if (!$url) {
                        continue;
                    }
                    $byOrigin['tavily'][$url] = [
                        'url'     => $url,
                        'title'   => $r['title']   ?? '',
                        'snippet' => $r['content'] ?? '',
                        'source'  => parse_url($url, PHP_URL_HOST) ?: '',
                        'query'   => $q,
                        'origin'  => 'tavily',
                    ];
                }
            }
            $sourceStats['tavily'] = count($byOrigin['tavily']);
        }

        // --- OpenAlex ---
        if (in_array('openalex', $enabled, true)) {
            $openAlex   = new OpenAlex(Env::get('OPENALEX_MAILTO'));
            $alexThemen = array_slice($themen, 0, 8);
            $totalA     = count($alexThemen);
            $idxA       = 0;
            foreach ($alexThemen as $thema) {
                $idxA++;
                Status::set('OpenAlex: „' . $thema . '"', $idxA, $totalA, 'openalex');
                try {
                    $results = $openAlex->search($thema, ['max' => 5]);
                } catch (\Throwable $e) {
                    $sourceErrors['openalex'][] = $e->getMessage();
                    continue;
                }
                foreach ($results as $r) {
                    $url = $r['url'] ?? null;
                    if (!$url) {
                        continue;
                    }
                    if (!isset($byOrigin['openalex'][$url])) {
                        $byOrigin['openalex'][$url] = $r;
                    }
                }
            }
            $sourceStats['openalex'] = count($byOrigin['openalex']);
        }

        // --- RSS ---
        if (in_array('rss', $enabled, true) && !empty($rssFeeds)) {
            $rss     = new Rss();
            $totalR  = count($rssFeeds);
            $idxR    = 0;
            foreach ($rssFeeds as $feedUrl) {
                $idxR++;
                $host = parse_url($feedUrl, PHP_URL_HOST) ?: $feedUrl;
                Status::set('RSS: ' . $host, $idxR, $totalR, 'rss');
                try {
                    $items = $rss->fetch($feedUrl, ['max' => 8]);
                } catch (\Throwable $e) {
                    $sourceErrors['rss'][] = $feedUrl . ': ' . $e->getMessage();
                    continue;
                }
                foreach ($items as $it) {
                    $url = $it['url'] ?? null;
                    if (!$url) {
                        continue;
                    }
                    if (!isset($byOrigin['rss'][$url])) {
                        $byOrigin['rss'][$url] = $it;
                    }
                }
            }
            $sourceStats['rss'] = count($byOrigin['rss']);
        }

        // --- Merge: prioritize structured sources, dedupe across all ---
        $candidates = [];
        $seen       = $existing;
        foreach (['rss', 'openalex', 'tavily'] as $origin) {
            foreach ($byOrigin[$origin] as $url => $item) {
                if (isset($seen[$url])) {
                    continue;
                }
                $seen[$url] = true;
                $candidates[] = $item;
            }
        }

        // Cap before LLM to keep runtime bounded
        $cap        = max($maxResults * 3, 25);
        $candidates = array_slice($candidates, 0, $cap);

        // --- LLM classification ---
        $llm     = new LLM($provider, $llmKey);
        $items   = [];
        $totalC  = count($candidates);
        $idxC    = 0;
        foreach ($candidates as $c) {
            $idxC++;
            Status::set('KI bewertet Kandidaten', $idxC, $totalC, 'llm');
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
            $rated['origin'] = $c['origin'] ?? 'tavily';
            $items[] = $rated;
        }

        usort($items, fn($a, $b) => (int) ($b['relevance'] ?? 0) <=> (int) ($a['relevance'] ?? 0));
        $items = array_slice($items, 0, $maxResults);

        // --- Write drafts ---
        $writer  = new Writer();
        $created = 0;
        if (!$dryRun) {
            $totalI = count($items);
            $idxI   = 0;
            foreach ($items as $item) {
                $idxI++;
                Status::set('Entwürfe werden gespeichert', $idxI, $totalI, 'write');
                if ($writer->createDraft($this->page, $item)) {
                    $created++;
                }
            }
            $this->page->update([
                'lastScrapedAt'     => date('Y-m-d H:i:s'),
                'lastScrapedResult' => sprintf(
                    '%d Entwürfe · %d Kandidaten geprüft (Tavily: %d, OpenAlex: %d, RSS: %d)',
                    $created,
                    count($candidates),
                    $sourceStats['tavily'],
                    $sourceStats['openalex'],
                    $sourceStats['rss']
                ),
            ]);
        }

        return [
            'ok'         => true,
            'sources'    => $sourceStats,
            'errors'     => $sourceErrors,
            'enabled'    => $enabled,
            'candidates' => count($candidates),
            'kept'       => count($items),
            'created'    => $created,
            'dryRun'     => $dryRun,
            'items'      => array_map(fn($i) => [
                'title'     => $i['title_de']  ?? '',
                'type'      => $i['type']      ?? '',
                'relevance' => (int) ($i['relevance'] ?? 0),
                'url'       => $i['url']       ?? '',
                'origin'    => $i['origin']    ?? '',
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
