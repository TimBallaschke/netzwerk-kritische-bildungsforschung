<?php

namespace AktuellesScraper;

use Kirby\Http\Remote;

class Tavily
{
    private string $apiKey;
    private string $endpoint = 'https://api.tavily.com/search';

    public function __construct(string $apiKey)
    {
        $this->apiKey = $apiKey;
    }

    public function search(string $query, array $opts = []): array
    {
        $body = [
            'api_key'        => $this->apiKey,
            'query'          => $query,
            'search_depth'   => $opts['depth'] ?? 'basic',
            'max_results'    => $opts['max'] ?? 5,
            'include_answer' => false,
        ];

        if (!empty($opts['includeDomains'])) {
            $body['include_domains'] = $opts['includeDomains'];
        }

        $res = Remote::request($this->endpoint, [
            'method'  => 'POST',
            'data'    => json_encode($body, JSON_UNESCAPED_UNICODE),
            'headers' => ['Content-Type: application/json'],
            'timeout' => 30,
        ]);

        if ($res->code() !== 200) {
            throw new \RuntimeException('Tavily ' . $res->code() . ': ' . substr((string) $res->content(), 0, 300));
        }

        $data = json_decode((string) $res->content(), true);
        return $data['results'] ?? [];
    }
}
