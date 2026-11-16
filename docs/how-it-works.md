# How it works

## The trick: the page's own links ARE the index

Most command palettes ship a search index: a JSON manifest someone has to
generate, deploy, and keep in sync with the pages it describes. This one
inverts it. At open time it walks every `a[href]` already in the DOM and
keeps the ones that are:

- **same-origin** - `new URL(h, location.href)` resolves relative hrefs,
  and anything leaving the origin is dropped (no leaking to third parties,
  no junk entries)
- **short enough to be a title** - text content, whitespace-collapsed,
  70 chars max (drops "click here", nav icon soup, and paragraph-length
  mismatches)
- **unique by target** - first link to a target wins; duplicates are skipped

The result: on a page with 40 links, the palette has a 40-entry index that
is correct *by construction*. Links can never drift from the index because
they ARE the index.

## Pins for what links can't express

Some destinations aren't links: an API dashboard, a raw stats page you
retired from the nav. Pass them via `data-cmdk-pins` on the script tag:

```html
<script src="cmdk.js" data-cmdk-pins='[["stats dashboard","/stats.php"]]'></script>
```

Pins dedupe against the crawled index, so a pin can never double-list a
page the crawl already found.

## Rendering and motion

- Type-ahead is a case-insensitive substring match over title + path,
  capped at 12 results - on any real page the index is small enough that
  no fuzzy-matching library earns its bytes.
- The active row is highlighted with the query's match wrapped in `<b>`;
  highlight positions are computed on the raw string and applied after
  HTML-escaping, so no query can inject markup.
- Keyboard model is the standard one: Cmd/Ctrl+K toggles, arrows move,
  Enter goes, Escape closes, click-outside closes. `scrollIntoView`
  keeps the selection visible in long result lists.
- Every user-provided string crosses `esc()` exactly once on the way
  into `innerHTML`. (Production lesson: highlight-before-escape is an
  XSS-shaped footgun; escape-first, then splice the `<b>` tags in
  escaped-coordinate space.)

## Production hardening notes

Shipped on a 1,000-page site's homepage inside a worker-injected block,
where it had to survive conditions a normal script never sees:

- **No build step, no dependency audit** - it ships as one paste-safe
  block; the whole widget is ~90 lines.
- **Never reach into the page's other scripts.** The production version
  lives alongside a closed IIFE that owns the site's helpers; this file
  is fully self-contained - own DOM, own listeners, own state - so it
  can be injected last and break nothing.
- **IntersectionObserver is for widgets, not palettes.** Unlike the
  site's lazy-loaded LED wall, the palette binds its keydown on load:
  a command palette that appears only after you scroll to it is a
  palette nobody finds.

## Why 12 results?

Twelve items fit the panel without scrolling on a laptop viewport, and
substring match over a crawled index rarely surfaces useful results past
the first handful anyway. The cap is the UI, not a performance limit.
