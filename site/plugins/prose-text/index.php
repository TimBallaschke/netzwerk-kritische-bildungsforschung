<?php

use Kirby\Content\Field;

Kirby::plugin('site/prose-text', [
    'fieldMethods' => [
        'prose' => function (Field $field): Field {
            $rendered = $field->kirbytext();
            // Textarea newlines render as <br>. In prose, a manual break
            // includes one empty line; existing break runs are not doubled.
            $rendered->value = preg_replace('~(?:<br\s*/?>\s*)+~i', "<br><br>\n", $rendered->value());
            return $rendered;
        },
    ],
]);
