<?php

namespace AktuellesScraper;

use Kirby\Http\Remote;

class Rss
{
    public function fetch(string $feedUrl, array $opts = []): array
    {
        $max = $opts['max'] ?? 8;

        $res = Remote::request($feedUrl, [
            'method'  => 'GET',
            'headers' => [
                'Accept: application/rss+xml, application/atom+xml, application/xml, text/xml',
                'User-Agent: NetzwerkKritischeBildungsforschung/1.0 (+kirby-aktuelles-scraper)',
            ],
            'timeout' => 30,
        ]);

        if ($res->code() !== 200) {
            throw new \RuntimeException('RSS ' . $res->code() . ' for ' . $feedUrl);
        }

        $body = (string) $res->content();
        if ($body === '') {
            return [];
        }

        $prev = libxml_use_internal_errors(true);
        $xml  = simplexml_load_string($body);
        libxml_use_internal_errors($prev);

        if ($xml === false) {
            return [];
        }

        $items = [];
        $host  = parse_url($feedUrl, PHP_URL_HOST) ?: 'rss';

        if (isset($xml->channel->item)) {
            foreach ($xml->channel->item as $i) {
                $items[] = [
                    'url'     => trim((string) $i->link),
                    'title'   => trim((string) $i->title),
                    'snippet' => $this->cleanSnippet((string) $i->description),
                    'source'  => $host,
                    'query'   => '',
                    'origin'  => 'rss:' . $host,
                ];
                if (count($items) >= $max) {
                    break;
                }
            }
        } elseif (isset($xml->entry)) {
            foreach ($xml->entry as $e) {
                $link = '';
                if (isset($e->link['href'])) {
                    $link = (string) $e->link['href'];
                } elseif (isset($e->link)) {
                    $link = (string) $e->link;
                }
                $summary = (string) ($e->summary ?? $e->content ?? '');
                $items[] = [
                    'url'     => trim($link),
                    'title'   => trim((string) $e->title),
                    'snippet' => $this->cleanSnippet($summary),
                    'source'  => $host,
                    'query'   => '',
                    'origin'  => 'rss:' . $host,
                ];
                if (count($items) >= $max) {
                    break;
                }
            }
        }

        return array_values(array_filter($items, fn($it) => $it['url'] !== '' && $it['title'] !== ''));
    }

    private function cleanSnippet(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/u', ' ', $text);
        return trim(mb_substr($text, 0, 600));
    }
}
