<?php

namespace AktuellesScraper;

class Status
{
    public static function path(): string
    {
        $dir = kirby()->root('cache') . '/aktuelles-scraper';
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }
        return $dir . '/status.json';
    }

    public static function set(
        string $message,
        ?int $current = null,
        ?int $total = null,
        ?string $phase = null,
        ?array $items = null
    ): void {
        $data = [
            'running' => true,
            'phase'   => $phase,
            'message' => $message,
            'current' => $current,
            'total'   => $total,
            'items'   => $items ?? [],
            'ts'      => time(),
        ];
        @file_put_contents(self::path(), json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    public static function done(string $message = 'Fertig'): void
    {
        $data = [
            'running' => false,
            'message' => $message,
            'ts'      => time(),
        ];
        @file_put_contents(self::path(), json_encode($data, JSON_UNESCAPED_UNICODE));
    }

    public static function read(): array
    {
        $path = self::path();
        if (!is_file($path)) {
            return ['running' => false];
        }
        $raw = @file_get_contents($path);
        if (!$raw) {
            return ['running' => false];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : ['running' => false];
    }
}
