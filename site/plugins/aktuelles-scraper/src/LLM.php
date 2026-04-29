<?php

namespace AktuellesScraper;

use Kirby\Http\Remote;

class LLM
{
    private string $provider;
    private string $apiKey;
    private string $model;

    public function __construct(string $provider, string $apiKey, ?string $model = null)
    {
        $this->provider = $provider;
        $this->apiKey   = $apiKey;
        $this->model    = $model ?? match ($provider) {
            'anthropic' => 'claude-haiku-4-5',
            default     => 'gpt-4o-mini',
        };
    }

    /**
     * Cheap relevance-only rating. Returns the relevance score (1–5) or null on failure.
     */
    public function rate(array $candidate): ?int
    {
        $user   = $this->candidatePayload($candidate);
        $result = $this->call($this->ratePrompt(), $user, 64);
        if (!is_array($result)) {
            return null;
        }
        $score = (int) ($result['relevance'] ?? 0);
        return $score > 0 ? $score : null;
    }

    /**
     * Full classification: relevance + type + German title + description + date.
     * Use only on candidates that already passed `rate()`.
     */
    public function classify(array $candidate): ?array
    {
        $user = $this->candidatePayload($candidate);
        return $this->call($this->classifyPrompt(), $user, 1024);
    }

    private function candidatePayload(array $candidate): string
    {
        return json_encode([
            'title'   => $candidate['title']   ?? '',
            'snippet' => $candidate['snippet'] ?? '',
            'url'     => $candidate['url']     ?? '',
            'source'  => $candidate['source']  ?? '',
            'query'   => $candidate['query']   ?? '',
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

    private function ratePrompt(): string
    {
        return <<<TXT
Du bist Redaktions-Assistent für ein deutschsprachiges Netzwerk
kritischer Bildungsforschung. Bewerte ausschließlich die Relevanz
des folgenden Webfunds.

Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine
Code-Fences, keine Erklärungen) nach diesem Schema:

{ "relevance": 1-5 }

Bewertungsmaßstab:
5 = direkt einschlägig (kritische Bildungsforschung / kritische Pädagogik)
4 = klar verwandt (Bildungssoziologie, Bildungstheorie mit kritischem Bezug)
3 = thematisch interessant aber nicht im Kern
2 = randständig
1 = irrelevant, Werbung, Spam, Boulevard
TXT;
    }

    private function classifyPrompt(): string
    {
        return <<<TXT
Du bist Redaktions-Assistent für ein deutschsprachiges Netzwerk
kritischer Bildungsforschung. Klassifiziere den folgenden Webfund.

Antworte AUSSCHLIESSLICH mit gültigem JSON (kein Markdown, keine
Code-Fences, keine Erklärungen) nach diesem Schema:

{
  "relevance": 1-5,
  "type": "publication" | "cfp" | "podcast" | "event" | "news",
  "title_de": "Bereinigter, prägnanter deutscher Titel (max. 120 Zeichen)",
  "description_de": "2–3 sachliche Sätze auf Deutsch, ohne Marketing-Floskeln",
  "date_iso": "YYYY-MM-DD oder null",
  "date_label": "z. B. 'Einreichung bis' oder 'Veranstaltung am' oder null"
}

Bewertungsmaßstab für relevance:
5 = direkt einschlägig (kritische Bildungsforschung / kritische Pädagogik)
4 = klar verwandt (Bildungssoziologie, Bildungstheorie mit kritischem Bezug)
3 = thematisch interessant aber nicht im Kern
2 = randständig
1 = irrelevant, Werbung, Spam, Boulevard

Wenn keine sinnvollen Werte ableitbar sind: "type":"news", date_iso: null,
date_label: null.
TXT;
    }

    private function call(string $system, string $user, int $maxTokens): ?array
    {
        return $this->provider === 'anthropic'
            ? $this->callAnthropic($system, $user, $maxTokens)
            : $this->callOpenAI($system, $user, $maxTokens);
    }

    private function callOpenAI(string $system, string $user, int $maxTokens): ?array
    {
        $body = [
            'model'           => $this->model,
            'messages'        => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user',   'content' => $user],
            ],
            'response_format' => ['type' => 'json_object'],
            'temperature'     => 0.2,
            'max_tokens'      => $maxTokens,
        ];

        $res = Remote::request('https://api.openai.com/v1/chat/completions', [
            'method'  => 'POST',
            'data'    => json_encode($body, JSON_UNESCAPED_UNICODE),
            'headers' => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
            'timeout' => 60,
        ]);

        if ($res->code() !== 200) {
            throw new \RuntimeException('OpenAI ' . $res->code() . ': ' . substr((string) $res->content(), 0, 300));
        }

        $data    = json_decode((string) $res->content(), true);
        $content = $data['choices'][0]['message']['content'] ?? null;
        if ($content === null) {
            return null;
        }
        return json_decode($content, true) ?: null;
    }

    private function callAnthropic(string $system, string $user, int $maxTokens): ?array
    {
        $body = [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'system'     => $system,
            'messages'   => [
                ['role' => 'user', 'content' => $user],
            ],
        ];

        $res = Remote::request('https://api.anthropic.com/v1/messages', [
            'method'  => 'POST',
            'data'    => json_encode($body, JSON_UNESCAPED_UNICODE),
            'headers' => [
                'Content-Type: application/json',
                'x-api-key: ' . $this->apiKey,
                'anthropic-version: 2023-06-01',
            ],
            'timeout' => 60,
        ]);

        if ($res->code() !== 200) {
            throw new \RuntimeException('Anthropic ' . $res->code() . ': ' . substr((string) $res->content(), 0, 300));
        }

        $data = json_decode((string) $res->content(), true);
        $text = $data['content'][0]['text'] ?? null;
        if ($text === null) {
            return null;
        }
        $text = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($text));
        return json_decode($text, true) ?: null;
    }
}
