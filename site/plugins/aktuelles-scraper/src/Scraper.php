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
        @set_time_limit(0);

        Status::set('Initialisiere …', null, null, 'init');

        $dryRun       = (bool) ($opts['dryRun'] ?? false);
        $themen       = $this->lines('themen');
        $formate      = $this->lines('formate');
        $quellen      = $this->lines('quellen');
        $minRelevance = (int) ($this->page->minRelevance()->value() ?: 3);
        $maxResults   = (int) ($this->page->maxResults()->value() ?: 10);
        $maxAgeMonths = (int) ($this->page->maxAgeMonths()->value() ?: 2);
        $cutoffTs     = strtotime('-' . $maxAgeMonths . ' months') ?: null;
        $cutoffDate   = $cutoffTs ? date('Y-m-d', $cutoffTs) : null;

        $enabled = $this->page->content()->get('sourcesEnabled')->split();
        if (empty($enabled)) {
            $enabled = ['tavily', 'openalex'];
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
        ];
        $sourceStats  = ['tavily' => 0, 'openalex' => 0];
        $sourceErrors = ['tavily' => [], 'openalex' => []];

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
                        'date'    => $r['published_date'] ?? null,
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
                    $results = $openAlex->search($thema, [
                        'max'      => 5,
                        'fromDate' => $cutoffDate,
                    ]);
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

        // --- Merge: round-robin between sources, dedupe across all ---
        $candidates = [];
        $seen       = $existing;
        $lists      = [
            'tavily'   => array_values($byOrigin['tavily']),
            'openalex' => array_values($byOrigin['openalex']),
        ];
        $cursors    = ['tavily' => 0, 'openalex' => 0];
        while (true) {
            $advanced = false;
            foreach (['tavily', 'openalex'] as $origin) {
                $idx = $cursors[$origin];
                if (!isset($lists[$origin][$idx])) {
                    continue;
                }
                $cursors[$origin]++;
                $advanced = true;
                $item = $lists[$origin][$idx];
                $url  = $item['url'] ?? null;
                if (!$url || isset($seen[$url])) {
                    continue;
                }
                $seen[$url] = true;
                $candidates[] = $item;
            }
            if (!$advanced) {
                break;
            }
        }

        // --- LLM rating (cheap) → full classification (only on survivors) → inline draft ---
        $llm     = new LLM($provider, $llmKey);
        $writer  = new Writer();
        $items   = [];
        $created = 0;
        $totalC  = count($candidates);
        $idxC    = 0;
        foreach ($candidates as $c) {
            $idxC++;
            Status::set(
                'KI bewertet Kandidaten',
                $idxC,
                $totalC,
                'rate',
                $this->itemsForStatus($items)
            );

            try {
                $score = $llm->rate($c);
            } catch (\Throwable $e) {
                continue;
            }
            if ($score === null || $score < $minRelevance) {
                continue;
            }

            Status::set(
                'Erstelle Zusammenfassung',
                $idxC,
                $totalC,
                'classify',
                $this->itemsForStatus($items)
            );

            try {
                $rated = $llm->classify($c);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$rated || (int) ($rated['relevance'] ?? 0) < $minRelevance) {
                continue;
            }

            $detectedDate = $rated['date_iso'] ?? $c['date'] ?? null;
            if ($cutoffTs && $detectedDate) {
                $entryTs = strtotime($detectedDate);
                if ($entryTs && $entryTs < $cutoffTs) {
                    continue;
                }
            }

            $rated['url']    = $c['url'];
            $rated['source'] = $c['source'];
            $rated['origin'] = $c['origin'] ?? 'tavily';
            $items[] = $rated;

            if (!$dryRun) {
                if ($writer->createDraft($this->page, $rated)) {
                    $created++;
                }
            }

            Status::set(
                'KI bewertet Kandidaten',
                $idxC,
                $totalC,
                'rate',
                $this->itemsForStatus($items)
            );

            if (count($items) >= $maxResults) {
                break;
            }
        }

        if (!$dryRun) {
            $page = $this->page;
            kirby()->impersonate('kirby', function () use ($page, $created, $candidates, $sourceStats) {
                $page->update([
                    'lastScrapedAt'     => date('Y-m-d H:i:s'),
                    'lastScrapedResult' => sprintf(
                        '%d Entwürfe · %d Kandidaten geprüft (Tavily: %d, OpenAlex: %d)',
                        $created,
                        count($candidates),
                        $sourceStats['tavily'],
                        $sourceStats['openalex']
                    ),
                ]);
            });
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
            'items'      => $this->itemsForStatus($items),
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

    private function itemsForStatus(array $items): array
    {
        return array_map(fn($i) => [
            'title'     => $i['title_de']  ?? '',
            'type'      => $i['type']      ?? '',
            'relevance' => (int) ($i['relevance'] ?? 0),
            'url'       => $i['url']       ?? '',
            'origin'    => $i['origin']    ?? '',
        ], $items);
    }
}
