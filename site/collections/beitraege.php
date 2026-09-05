<?php

return function () {
    $source = page('aktuelles');

    return $source
        ? $source->index()->listed()->filterBy('intendedTemplate', 'beitrag')->sortBy('date', 'desc')
        : new Kirby\Cms\Pages();
};
