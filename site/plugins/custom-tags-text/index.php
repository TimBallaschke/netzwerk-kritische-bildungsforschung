<?php

Kirby::plugin('custom/tags', [
    'tags' => [
        'i' => [
            'html' => function($tag) {
                return '<em>' . $tag->value . '</em>';
            }
        ]
    ]
]);
