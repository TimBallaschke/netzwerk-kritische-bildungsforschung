<?php

load([
    'AktuellesScraper\\Env'     => __DIR__ . '/src/Env.php',
    'AktuellesScraper\\Tavily'  => __DIR__ . '/src/Tavily.php',
    'AktuellesScraper\\LLM'     => __DIR__ . '/src/LLM.php',
    'AktuellesScraper\\Writer'  => __DIR__ . '/src/Writer.php',
    'AktuellesScraper\\Scraper' => __DIR__ . '/src/Scraper.php',
]);

\AktuellesScraper\Env::load(kirby()->root('index') . '/.env');

Kirby::plugin('art-of-x/aktuelles-scraper', [
    'sections' => [
        'aktuelles-scraper' => [
            'props' => [
                'headline' => fn(string $headline = 'Web-Suche') => $headline,
            ],
            'computed' => [
                'lastRun' => function () {
                    $v = $this->model()->content()->get('lastScrapedAt')->value();
                    if (!$v) {
                        return null;
                    }
                    $ts = strtotime($v);
                    return $ts ? date('d.m.Y · H:i', $ts) : $v;
                },
                'lastResult' => function () {
                    return $this->model()->content()->get('lastScrapedResult')->value();
                },
            ],
        ],
    ],
    'api' => [
        'routes' => [
            [
                'pattern' => 'aktuelles-scraper/run',
                'method'  => 'POST',
                'action'  => function () {
                    $page = kirby()->page('aktuelles');
                    if (!$page) {
                        return ['ok' => false, 'error' => 'Aktuelles-Seite nicht gefunden.'];
                    }
                    $body   = kirby()->request()->body()->toArray();
                    $dryRun = (bool) ($body['dryRun'] ?? false);
                    try {
                        $scraper = new \AktuellesScraper\Scraper($page);
                        return $scraper->run(['dryRun' => $dryRun]);
                    } catch (\Throwable $e) {
                        return ['ok' => false, 'error' => $e->getMessage()];
                    }
                },
            ],
        ],
    ],
]);
