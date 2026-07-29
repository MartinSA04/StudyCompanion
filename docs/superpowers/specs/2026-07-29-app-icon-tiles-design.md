# App icon tiles — design

_2026-07-29. Ships as **v4.1.0** (no schema change; new generated asset)._

## Problem

Every course ships the same near-black home-screen tile with a thin accent
keyline. On an iPhone it reads as a placeholder, the keyline presses into the
tile's edges, and six installed guides are indistinguishable at 60 px. Five
concrete defects, four of them mechanical rather than taste:

1. **No safe area.** `faviconSvg` draws the mark as a rounded rect at
   `x=4 … 60` of a 64 viewBox — a 6.25% margin. iOS then applies its own
   squircle mask, whose corners cut inside that margin, so the keyline runs into
   the edge and the tile reads over-zoomed. Apple's grid expects artwork inside
   roughly the central 80%.
2. **The maskable icon is broken.** `icon-maskable-512.png` reuses the same
   artwork. A maskable icon must keep content inside a circle of 80% diameter;
   the keyline's corners sit at 62% radius against a 40% limit, so Android
   clips them off.
3. **The ground is the wrong black.** `GROUND = "#0b0e14"` is a _cool_
   blue-black inherited from martinsundal.no. DESIGN.md's rule is that every
   neutral is a warm Flexoki tone and nothing is pure black; the brand ink is
   `#100f0f`. The cold cast is most of why the tile reads as a black box.
4. **The accent is spent on the least visible pixels.** All six courses get the
   same dark tile differing only in a 5 px keyline tint. At 60 px the one brand
   variable the framework has is a hairline.
5. **`og:image` is transparent.** It points at `icon-512.png`, so link previews
   composite the mark on whatever ground the client picks.

**Root cause of 1–2:** `rasterizeIcons` resizes a _single_ SVG for four targets
whose framing requirements contradict each other, so one geometry is
necessarily wrong somewhere.

### Why there is no dark-variant escape hatch

Considered and rejected as unavailable: iOS 18+ dark/tinted app icon variants
are a native-app asset-catalog feature. For a Home Screen web app there is no
manifest field, no `media` attribute on `apple-touch-icon`, and no SVG media
query iOS honours; the gap is still undocumented on iOS 26 (Apple Developer
Forums threads 761615 and 787919, zero Apple replies). The only workaround —
injecting an `apple-touch-icon` link with JS — freezes the icon at whatever
theme was active at install time and needs a reinstall to change. Not
shippable in a framework six repos depend on.

One tile therefore has to work everywhere. _Tinted_ appearance **does** apply to
PWA icons: iOS flattens the icon to luminance and multiplies a tint over it, so
the tile needs luminance separation between ground and mark to survive. This is
what rules out keeping a dark ground with a mid-luminance accent mark — it
becomes a smudge.

## 1 · One mark, two variants

`src/lib/favicon.ts` becomes the geometry source.

**Framing.** The mark's bbox in the 64 viewBox is `x 15–51, y 18–47`, centre
`(33, 32.5)`. Centre it on `(32, 32)` and scale so the mark is **56% of the tile
width**. Its half-diagonal is then 23.1 against the maskable safe circle's 25.6
limit — one geometry satisfies both Apple's 80% grid and Android's mask, with
headroom. This is also the fix for the over-zoomed read: ~22% clear space each
side instead of 6.25%.

**`tileSvg(accent, variant)`** replaces `faviconSvg(accent)`:

- `"bleed"` — accent rect edge to edge, **no baked radius**; iOS and Android
  supply the mask. Used by `apple-touch-icon.png` and `icon-maskable-512.png`.
- `"rounded"` — accent rect inset `2/64` with `rx 12`, transparent margin. Used
  by the tab favicon and `icon-192/512.png`, since manifest `any` icons are
  shown _unmasked_ and must own their radius.

**Mark colour** is `contrastText(accent)` from `src/lib/color.ts` — the
framework's existing on-accent ink function, already used for filled chips and
the skip link. It returns `#ffffff` for all six current accents and flips to
`#100f0f` on its own if a course ever picks a pale one. No new colour logic.

**`GROUND` is deleted.** No literal near-black is left in the icon path, so the
DESIGN.md warm-neutral violation is removed rather than re-tinted.

`maskIconSvg()` is deleted with it — see §4.

## 2 · Per-target rasterization

`src/lib/rasterizeIcons.ts`:

- `IconTarget` gains `variant: "bleed" | "rounded"`. The SVG is built per target
  instead of resizing one shared string.
- `opaque` collapses into the variant — a bleed tile has no alpha to flatten.
  `flatten({ background: accent })` stays on bleed targets as insurance so a PNG
  can never ship an alpha channel iOS might misread.
- `COURSE_ICONS` and `HUB_ICONS` gain the variant per entry. The hub is
  unaffected beyond inheriting the new tile.

| File                       | Consumer           | Variant             |
| -------------------------- | ------------------ | ------------------- |
| `apple-touch-icon.png` 180 | iOS home screen    | `bleed`             |
| `icon-maskable-512.png`    | Android / PWA mask | `bleed`             |
| `icon-192.png` `icon-512`  | Manifest `any`     | `rounded`           |
| favicon (inline SVG)       | Browser tab, 16 px | `rounded`           |
| `og-image.png` 1200×630    | Open Graph         | own aspect — see §3 |

The square targets all render from a 64×64 viewBox and differ only by variant.
The OG card is not one of the two variants: it is a 1200×630 canvas, so it needs
its own `ogCardSvg(accent)` rather than a resized tile.

## 3 · Open Graph card

`og-image.png` at **1200×630** — accent ground, mark centred at **20% of the
card width** (240 px), opaque — wired to `og:image` / `twitter:image` in both
`CourseLayout.astro` and `hub/pages/index.astro`, with the accompanying
`og:image:width`/`height` corrected and `twitter:card` raised from `summary` to
**`summary_large_image`** (a 1200×630 image in a `summary` card gets
centre-cropped to a square, which would defeat the point).

**Relationship to ROADMAP.** This partially lands the existing
"Auto-generated OG share image" item (`minor`, **L**): it delivers the accent
ground, the mark and the correct aspect, but **not** the per-page `code` +
page-title text, and not via `satori`. The remaining text/per-page work stays on
ROADMAP with its scope narrowed to that.

**Why no text now.** Rendering text through `sharp` means librsvg + fontconfig,
so glyph metrics depend on which fonts happen to be installed on the build
machine — non-deterministic between this devcontainer and a consumer's GitHub
Actions runner. Text needs the `satori` path the ROADMAP item already
describes; a mark-only card is the deterministic 80%.

`icon-512.png` stays `rounded`/transparent, since it is a manifest `any` icon
and no longer doubles as the share image.

## 4 · Adjacent cleanup

`<link rel="mask-icon">` (`CourseLayout.astro:361`) and the
`safari-pinned-tab.svg` emission (`src/index.ts:90`) are removed. Safari has
ignored `mask-icon` since Safari 15, and dropping it also removes a
warn-and-skip `try`/`catch` block from `generateAppIcons` — the only branch in
that function that failed soft while everything around it hard-fails.

The header brand mark (`CourseLayout.astro:591`) **keeps its frame**. It has the
room the icon doesn't, so the framed `[>_]` stays the full lockup and the icon
is the compressed mark. No visual-snapshot churn.

`faviconDataUri(accentDark)` → `faviconDataUri(accent)` in
`CourseLayout.astro:336`, so the tab icon and the home-screen icon are the same
artwork rather than two different tints.

## Testing

`test/favicon.test.ts` — the "near-black ground" and "accent appears 3×"
assertions are wrong by construction once the mark is knocked out of an accent
field; both are replaced. Two new assertions are the regression guards for the
defects that shipped:

- the `bleed` variant's ground covers `0,0 → 64,64` exactly;
- the mark's half-diagonal stays inside the maskable safe radius (25.6 of 64) —
  the assertion that would have caught defect 2.

Plus: `contrastText` drives the mark colour (a dark accent yields a white mark,
a pale one yields `#100f0f`), and the `rounded` variant keeps a transparent
margin.

Verification is `pnpm build` on the demo course followed by reading the emitted
`apple-touch-icon.png` and `og-image.png`, not by inspecting the source — the
whole class of bug here is source that looks right and rasterizes wrong.

Visual snapshots are unaffected (the header mark is unchanged, and favicons
don't appear in page screenshots).

## Release

`v4.1.0` — **minor**, not patch: no schema change, but `og-image.png` is a new
generated asset with new head tags, and it partially lands a ROADMAP item
already scoped `minor`. The icon rework alone would be a patch.

Per CLAUDE.md: bump `package.json`, tag, then point `course-template/` and all
five non-frozen consumers at the new tag. **optics stays FROZEN** at v1.4.0.
Every consumer's icons change visibly, so this wants a CHANGELOG entry
describing the new tile rather than a bare "fix icons".
