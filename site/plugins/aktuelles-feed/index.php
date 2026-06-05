<?php

// Aktuelles feed: one combined, drag-orderable list of ALL Aktuelles
// entries across the Rubriken (Beiträge, Veranstaltungen, …).
//
// - siteMethod `aktuellesFeed()` is the single source of truth for the
//   feed: entries with "In Aktuelles zeigen" on, ordered by the manual
//   `feedOrder` value (falling back to date desc for entries not yet
//   placed). Used by both the homepage template and the Panel section.
// - the custom section `aktuellesfeed` renders that list draggable.
// - the API route persists a new order by writing `feedOrder` (1..N) onto
//   each entry. Entries live across five parents, so a normal per-parent
//   sort number can't express this global order — hence a dedicated field.

Kirby::plugin('nkb/aktuelles-feed', [
    'siteMethods' => [
        'aktuellesFeed' => function () {
            $pool = $this->find('aktuelles');

            if (!$pool) {
                return new Kirby\Cms\Pages([]);
            }

            $entries = $pool->children()->children()->listed()
                ->filter(fn ($p) => $p->inAktuelles()->or('true')->toBool())
                ->values();

            usort($entries, function ($a, $b) {
                $oa = $a->feedOrder()->isNotEmpty() ? (int) $a->feedOrder()->value() : PHP_INT_MAX;
                $ob = $b->feedOrder()->isNotEmpty() ? (int) $b->feedOrder()->value() : PHP_INT_MAX;
                if ($oa !== $ob) {
                    return $oa <=> $ob;
                }
                // not-yet-ordered entries fall back to date, newest first
                $da = $a->date()->isNotEmpty() ? (int) $a->date()->toDate('Ymd') : 0;
                $db = $b->date()->isNotEmpty() ? (int) $b->date()->toDate('Ymd') : 0;
                return $db <=> $da;
            });

            return new Kirby\Cms\Pages($entries);
        },
    ],

    'sections' => [
        'aktuellesfeed' => [
            'props' => [
                'headline' => function (string $headline = 'Aktuelles-Feed') {
                    return $headline;
                },
                'help' => function (?string $help = null) {
                    return $help;
                },
            ],
            'computed' => [
                'entries' => function () {
                    $labels = [
                        'beitrag'         => 'Beitrag',
                        'veranstaltung'   => 'Veranstaltung',
                        'call-for-papers' => 'Call for Papers',
                        'publikation'     => 'Publikation',
                        'notiz'           => 'Notiz',
                    ];

                    $data = [];

                    foreach ($this->model()->kirby()->site()->aktuellesFeed() as $p) {
                        $template = $p->intendedTemplate()->name();
                        $data[] = [
                            'id'       => $p->id(),
                            'title'    => $p->title()->value(),
                            'category' => $labels[$template] ?? $template,
                            'date'     => $p->date()->isNotEmpty() ? $p->date()->toDate('d.m.Y') : null,
                            'link'     => $p->panel()->url(true),
                        ];
                    }

                    return $data;
                },
            ],
        ],
    ],

    'api' => [
        'routes' => [
            [
                'pattern' => 'aktuelles-feed/sort',
                'method'  => 'PATCH',
                'action'  => function () {
                    $ids = $this->requestBody('ids') ?? [];
                    $i   = 1;

                    foreach ($ids as $id) {
                        if ($page = $this->kirby()->page($id)) {
                            $page->update(['feedOrder' => $i]);
                        }
                        $i++;
                    }

                    return ['status' => 'ok', 'count' => count($ids)];
                },
            ],
        ],
    ],
]);
