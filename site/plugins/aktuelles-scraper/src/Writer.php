<?php

namespace AktuellesScraper;

use Kirby\Cms\App;
use Kirby\Cms\Page;
use Kirby\Toolkit\Str;

class Writer
{
    public function createDraft(Page $parent, array $item): ?Page
    {
        $kirby = App::instance();

        return $kirby->impersonate('kirby', function () use ($parent, $item) {
            $url   = $item['url'] ?? '';
            $title = $item['title_de'] ?? 'Eintrag';
            $slug  = Str::slug($title);
            if ($slug === '') {
                $slug = 'eintrag';
            }
            $slug = $slug . '-' . substr(md5($url . $title), 0, 6);

            if ($parent->find($slug)) {
                return null;
            }

            return $parent->createChild([
                'slug'     => $slug,
                'template' => 'aktuelles-item',
                'draft'    => true,
                'content'  => [
                    'title'        => $title,
                    'description'  => $item['description_de'] ?? '',
                    'url'          => $url,
                    'date'         => $item['date_iso']    ?? '',
                    'dateLabel'    => $item['date_label']  ?? '',
                    'itemType'     => $item['type']        ?? 'news',
                    'source'       => $item['source']      ?? '',
                    'relevance'    => (int) ($item['relevance'] ?? 0),
                    'discoveredAt' => date('Y-m-d H:i:s'),
                ],
            ]);
        });
    }
}
