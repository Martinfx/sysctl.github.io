# sysctl — project site

A static, dependency-free site presenting my FreeBSD work: SoC board bring-up,
kernel and driver patches, and ports maintenance.

**Live:** https://martinfx.github.io/sysctl.github.io/

## What's on it

| Section | Content |
| --- | --- |
| Hero | Positioning + an animated FreeBSD boot log on the BPI-R2 Pro console |
| Projects | SoCBSD, FreeBSD Ports, and the per-board `freebsd-src` branches |
| Boards | Every board on the bench, each card linking to the branch carrying its support |
| Upstream | The path a patch takes, plus links across the FreeBSD ecosystem |
| How it works | The SoCBSD rules — own the hardware, verify, clean provenance |
| Collaborate | How to open an arena and send a PR |

## Stack

Plain HTML, CSS and JavaScript — no build step, no framework, no bundler.
Open `index.html` and it works.

```
index.html              all page content lives here
assets/css/style.css    design tokens + every component
assets/js/main.js       theme, nav, filters, boot animation, live GitHub data
assets/img/favicon.svg  tab icon
assets/img/og.png       social preview card (1200×630)
```

Features: dark/light theme (respects the OS setting, remembers your choice),
scroll reveals, board filtering by SoC vendor, a scrollspy nav, and live star
counts / branch dates pulled from the GitHub API with a one-hour `localStorage`
cache. Everything degrades gracefully — if the API is unreachable or JS is off,
the page still reads correctly.

Accessibility: skip link, focus-visible outlines, `prefers-reduced-motion`
honoured (animations off, boot log rendered in full), semantic landmarks.

## Editing content

Everything is in `index.html` — no data files to hunt through.

**Add a board:** copy an existing `<a class="board">` block in `#boards-grid` and
change the name, SoC line, description, `href` and `data-branch`.

```html
<a class="board" data-vendor="mediatek"
   data-branch="Martinfx/freebsd-src:my-branch-name"
   href="https://github.com/Martinfx/freebsd-src/tree/my-branch-name"
   target="_blank" rel="noopener" data-reveal>
  <div class="board__head">
    <h3 class="board__name">Board name</h3>
    <span class="status status--work">bring-up</span>
  </div>
  <p class="board__soc">SoC · arch</p>
  <p class="board__desc">One line about the board.</p>
  <div class="board__foot">
    <code class="board__branch">my-branch-name</code>
    <span class="board__when" data-branch-when></span>
  </div>
</a>
```

- `data-vendor` drives the filter chips (`mediatek`, `rockchip`, `broadcom`,
  `arena` — space-separated, a board can carry several). Adding a new vendor
  means adding a matching `<button class="chip" data-filter="...">`.
- `data-branch` is `owner/repo:branch`; the script fills in the last-commit date.
- Status badges: `status--work` (amber), `status--arena` (blue), `status--ok` (green).

**Add a project:** copy an `<article class="card">` block. Set `data-repo` to
`owner/repo` and the star count, language and last-push date fill themselves in.

**Change the colours:** the palette is the token block at the top of
`assets/css/style.css` — `:root` for dark, `:root[data-theme="light"]` for light.
`--accent` is the one that sets the tone.

**Regenerate the social card:** edit the values in the `og.png` block, or replace
`assets/img/og.png` with any 1200×630 image.

## Publishing

The repo is `Martinfx/sysctl.github.io`, so Pages serves it from a subpath:
`https://martinfx.github.io/sysctl.github.io/`. All asset paths are relative, so
that works as-is.

To get it on `https://martinfx.github.io/` instead, the repo has to be renamed to
`Martinfx.github.io` — GitHub only treats `<user>.github.io` as a user site.

Two ways to turn it on, under **Settings → Pages**:

- **Deploy from a branch** — pick `main` / `/ (root)`. `.nojekyll` is committed so
  the files are served as-is.
- **GitHub Actions** — `.github/workflows/pages.yml` handles it on every push to
  `main`.

## Local preview

```sh
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then open http://localhost:8000/.

## Licence

Content and design © Martin Fx. Reuse the code, not the personal copy.
