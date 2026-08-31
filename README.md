# sysctl — project site

A static, dependency-free site presenting my FreeBSD work: SoC board bring-up,
kernel and driver patches, and ports maintenance.

**Live:** https://sysctl.cz/

## What's on it

| Section | Content |
| --- | --- |
| Hero | Positioning + an animated FreeBSD boot log on the BPI-R2 Pro console |
| About | Profile, what I work on, skills, direct contact |
| Projects | SoCBSD, FreeBSD Ports, and the per-board `freebsd-src` branches |
| Boards | The four boards in bring-up plus the open SoCBSD arenas, each card linking to its branch |
| Upstream | The path a patch takes, plus links across the FreeBSD ecosystem |
| How it works | The SoCBSD rules — own the hardware, verify, clean provenance |
| FAQ | Long-tail questions, marked up as `FAQPage` for rich results |
| Collaborate | How to open an arena and send a PR, plus e-mail and Discord |

## Stack

Plain HTML, CSS and JavaScript — no build step, no framework, no bundler.
Open `index.html` and it works.

```
index.html              all page content lives here
404.html                custom not-found page (GitHub Pages serves it site-wide)
assets/css/style.css    design tokens + every component
assets/js/main.js       theme, nav, filters, boot animation, live GitHub data
assets/img/favicon.svg  tab icon
assets/img/og.png       social preview card (1200×630)
CNAME                   the custom domain — load-bearing under branch publishing
site.webmanifest        PWA manifest
sitemap.xml             one URL, with lastmod and an image entry
robots.txt              crawl rules + sitemap pointer
humans.txt              who built it
```

`404.html` uses root-relative asset paths (`/assets/...`) because GitHub Pages serves
it at any depth; `index.html` uses relative paths. Don't "fix" that inconsistency —
it's what makes the 404 render correctly on a nested URL.

Features: dark/light theme (respects the OS setting, remembers your choice),
scroll reveals, board filtering by SoC vendor, a scrollspy nav, and live star
counts / branch dates pulled from the GitHub API with a one-hour `localStorage`
cache. Everything degrades gracefully — if the API is unreachable or JS is off,
the page still reads correctly.

Accessibility: skip link, focus-visible outlines, `prefers-reduced-motion`
honoured (animations off, boot log rendered in full), semantic landmarks.

## SEO

Everything here is legitimate technical SEO — no cloaking, no keyword stuffing,
no schema that claims more than the page shows.

- **Meta**: title (45 chars), description (165), canonical, `robots` /
  `googlebot` with `max-image-preview:large`, hreflang self-reference plus
  `x-default`, full Open Graph set with image dimensions and alt text, Twitter
  summary-large-image card, `fediverse:creator`.
- **Structured data**: a single JSON-LD `@graph` with `WebSite`, `ProfilePage`,
  `ImageObject`, `Person` (skills, contact point, `sameAs`), `Organization`
  (SoCBSD), `BreadcrumbList`, two `ItemList`s (projects and boards, as
  `SoftwareSourceCode`), and `FAQPage`.
- **`rel="me"`** on the GitHub and Mastodon links. The Mastodon one is what
  earns the verified green link on the profile — add `https://sysctl.cz/` to the
  Mastodon profile metadata to complete the handshake.
- **Content**: the FAQ answers real long-tail queries ("does FreeBSD run on the
  Banana Pi BPI-R64?"). If you edit an answer, edit the matching `FAQPage` entry
  in the JSON-LD too — Google drops FAQ rich results when the schema and the
  visible text disagree.
- **Crawl/UX signals**: single `h1`, no heading-level jumps, every external link
  carries `rel="noopener"`, no horizontal overflow, `aria-labelledby` on each
  section, and a real 404 page so missing URLs don't become soft 404s.

After going live, submit `https://sysctl.cz/sitemap.xml` in Google Search Console
and Bing Webmaster Tools — nothing on this page substitutes for that.

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

The site is served at **https://sysctl.cz/** via a custom domain. Because a custom
domain moves a project site to the domain root, no `/sysctl.github.io/` path prefix
applies and every asset path in the page is relative, so nothing needs rewriting.

DNS at the registrar (WEDOS), for the apex:

| Name | Type | Value |
| --- | --- | --- |
| *(empty)* | A | `185.199.108.153` |
| *(empty)* | A | `185.199.109.153` |
| *(empty)* | A | `185.199.110.153` |
| *(empty)* | A | `185.199.111.153` |
| `www` | CNAME | `martinfx.github.io.` |

The `www` CNAME points at the **user** Pages host, not at this repo — the repo name
never appears in DNS. WEDOS stages record edits: after saving each one you must press
**Aplikovat změny** above the records table, or nothing goes live.

Under **Settings → Pages**, the publishing source is **Deploy from a branch**
(`main` / `/ (root)`). `.nojekyll` is committed so files are served as-is, and the
`CNAME` file holds the domain — with branch publishing that file is load-bearing,
so don't delete it.

## Local preview

```sh
python3 -m http.server 8000
# or
npx http-server -p 8000
```

Then open http://localhost:8000/.

## Licence

Content and design © Martin Fx. Reuse the code, not the personal copy.
