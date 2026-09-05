<img src="http://getkirby.com/assets/images/github/plainkit.jpg" width="300">

**Kirby: the CMS that adapts to any project, loved by developers and editors alike.**
The Plainkit is a minimal Kirby setup with the basics you need to start a project from scratch. It is the ideal choice if you are already familiar with Kirby and want to start step-by-step.

You can learn more about Kirby at [getkirby.com](https://getkirby.com).

### Try Kirby for free

You can try Kirby and the Plainkit on your local machine or on a test server as long as you need to make sure it is the right tool for your next project. … and when you’re convinced, [buy your license](https://getkirby.com/buy).

### Get going

Read our guide on [how to get started with Kirby](https://getkirby.com/docs/guide/quickstart).

You can [download the latest version](https://github.com/getkirby/plainkit/archive/main.zip) of the Plainkit.
If you are familiar with Git, you can clone Kirby's Plainkit repository from Github.

    git clone https://github.com/getkirby/plainkit.git

## What's Kirby?

-   **[getkirby.com](https://getkirby.com)** – Get to know the CMS.
-   **[Try it](https://getkirby.com/try)** – Take a test ride with our online demo. Or download one of our kits to get started.
-   **[Documentation](https://getkirby.com/docs/guide)** – Read the official guide, reference and cookbook recipes.
-   **[Issues](https://github.com/getkirby/kirby/issues)** – Report bugs and other problems.
-   **[Feedback](https://feedback.getkirby.com)** – You have an idea for Kirby? Share it.
-   **[Forum](https://forum.getkirby.com)** – Whenever you get stuck, don't hesitate to reach out for questions and support.
-   **[Discord](https://chat.getkirby.com)** – Hang out and meet the community.
-   **[Mastodon](https://mastodon.social/@getkirby)** – Spread the word.
-   **[Bluesky](https://bsky.app/profile/getkirby.com)** – Spread the word.

---

© 2009 Bastian Allgeier
[getkirby.com](https://getkirby.com) · [License agreement](https://getkirby.com/license)

## Local development

The site runs on PHP via Herd or `composer start`. Compile the SCSS after style changes:

```sh
npm ci
npm run build:css
```

Commit the generated `assets/style/style.css` and its source map with the SCSS.
Run `npm test` for the page startup, HTML shell, and carousel regressions (PHP and Node.js required).
Debug output is disabled in the shared configuration.

### Shared content lists

Use `snippet('content-list', ['title' => $title, 'items' => $items, 'variant' => $variant])`
for all content lists. The variants are `posts` (article overlay with a fallback URL),
`events` (inline disclosure), `downloads` (seminar plans with optional PDF links), and
`feed` (the filterable Aktuelles list, using its parent section's shared overlay).
The feed omits `title` and uses `label` as its accessible section name.
The section and row markup live in `site/snippets/content-list.php` and `content-list-item.php`;
shared heading, spacing, and variant styles live in `assets/style/scss/_content-list.scss`.
Subtitles below a title use the same `--list-subline-gap`, including after wrapped titles.
Empty collections render no section. Pass an explicit `id` when placing the same variant twice on a page.
