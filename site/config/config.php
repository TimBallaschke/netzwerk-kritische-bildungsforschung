<?php

return [
    // Custom Panel stylesheet — tightens spacing around section
    // headlines and divider lines (see assets/style/panel.css).
    'panel' => [
        'css' => 'assets/style/panel.css',
    ],

    // Isolated styling previews — render a snippet on its own at
    // /preview/<name>, without touching the real pages, nav or content.
    // Restricted to local environments (localhost / Herd *.test), so it
    // is never reachable on the production domain.
    'routes' => [
        [
            'pattern' => 'preview/aktuelles',
            'action'  => function () {
                $host    = kirby()->request()->url()->host();
                $isLocal = $host === 'localhost'
                    || $host === '127.0.0.1'
                    || str_ends_with((string)$host, '.test');

                if ($isLocal !== true) {
                    return false; // -> 404 outside local development
                }

                return snippet('preview', [
                    'title' => 'Aktuelles',
                    'inner' => snippet('aktuelles-list', [], true),
                ], true);
            },
        ],
    ],
];
