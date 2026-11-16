# cmdk-index

A command palette that indexes itself. Press Cmd+K (or Ctrl+K), type, jump.

Zero dependencies, zero config, ~90 lines of vanilla JS. The page's own
links ARE the index - there is no JSON manifest to build, ship, or keep
in sync, because links can't drift from a thing that reads them at open
time.

Extracted from production: the homepage launcher on a 1,000-page site,
shipped as one worker-injected block (read the build story:
*a command palette that indexes itself*, Nov 2026).

## Quick start

```html
<link rel="stylesheet" href="src/cmdk.css">
<script src="src/cmdk.js"></script>
```

That's it. Open the page, press Cmd+K, and every same-origin link on the
page is navigable. Optional pins for destinations no link expresses:

```html
<script src="src/cmdk.js" data-cmdk-pins='[["stats dashboard","/stats.php"]]'></script>
```

A working demo lives in [examples/index.html](examples/index.html) -
open it, press Cmd+K, type "anchor".

## The problem it solves

Most palettes make you maintain a second list of your site's pages. The
list goes stale the first time someone renames a page and forgets the
manifest. cmdk-index refuses to know anything the DOM doesn't already
know: at open time it crawls the page's own anchors, filters to
same-origin short titles, dedupes by target, and renders matches with
keyboard navigation and safe highlighting.

## Features

- Self-indexing: same-origin links crawled at open time, deduped by target
- Pins via `data-cmdk-pins` for non-link destinations
- Full keyboard model: Cmd/Ctrl+K, arrows, Enter, Escape, click-outside
- Safe highlighting - escape first, then bold the match; no injection path
- Builds its own overlay if the page has none; restyle everything via classes
- Zero dependencies, no build step, works from `file://`

## When not to use it

- Big sites needing ranked/fuzzy search across *content*, not navigation -
  use a real search index
- Palettes that need actions (not just navigation) - the go() here is
  `location.href`; extending it is straightforward but out of scope

## License

MIT
