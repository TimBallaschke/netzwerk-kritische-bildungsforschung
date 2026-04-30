<?php

namespace AktuellesScraper;

use Kirby\Http\Remote;

class OpenAlex
{
    private string $endpoint = 'https://api.openalex.org/works';
    private ?string $mailto;

    public function __construct(?string $mailto = null)
    {
        $this->mailto = $mailto;
    }

    public function search(string $query, array $opts = []): array
    {
        $perPage = $opts['max'] ?? 5;

        if (!empty($opts['fromDate'])) {
            $filter = 'from_publication_date:' . $opts['fromDate'];
        } else {
            $sinceYear = $opts['sinceYear'] ?? (int) date('Y') - 1;
            $thisYear  = (int) date('Y');
            $filter    = 'publication_year:' . $sinceYear . '|' . $thisYear;
        }

        $params = [
            'search'   => $query,
            'filter'   => $filter,
            'per_page' => $perPage,
            'sort'     => 'publication_date:desc',
        ];
        if ($this->mailto) {
            $params['mailto'] = $this->mailto;
        }

        $url = $this->endpoint . '?' . http_build_query($params);

        $res = Remote::request($url, [
            'method'  => 'GET',
            'headers' => ['Accept: application/json'],
            'timeout' => 30,
        ]);

        if ($res->code() !== 200) {
            throw new \RuntimeException('OpenAlex ' . $res->code() . ': ' . substr((string) $res->content(), 0, 300));
        }

        $data    = json_decode((string) $res->content(), true);
        $results = $data['results'] ?? [];
        $out     = [];

        foreach ($results as $r) {
            $url = $r['primary_location']['landing_page_url']
                ?? $r['doi']
                ?? $r['id']
                ?? null;
            if (!$url) {
                continue;
            }
            $out[] = [
                'url'     => $url,
                'title'   => $r['title'] ?? '',
                'snippet' => $this->reconstructAbstract($r['abstract_inverted_index'] ?? null),
                'source'  => parse_url($url, PHP_URL_HOST) ?: 'openalex.org',
                'query'   => $query,
                'origin'  => 'openalex',
                'date'    => $r['publication_date'] ?? null,
            ];
        }

        return $out;
    }

    private function reconstructAbstract(?array $index): string
    {
        if (!$index) {
            return '';
        }
        $words = [];
        foreach ($index as $word => $positions) {
            foreach ($positions as $pos) {
                $words[$pos] = $word;
            }
        }
        ksort($words);
        return implode(' ', $words);
    }
}
