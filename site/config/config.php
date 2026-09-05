<?php

return [
    'debug'  => true,

    'panel' => [
        'css' => 'assets/style/panel.css',
        'viewButtons' => [
            'page' => ['status'],
            'site' => false,
        ],
    ],

    'hooks' => [
            'kirbytext:before' => function (?string $text) {
                if ($text === null) {
                    return '';
                }
                return str_replace('*', '\*', $text);
            }
        ],

    
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
