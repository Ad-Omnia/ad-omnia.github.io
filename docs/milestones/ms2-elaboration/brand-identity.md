---
title: Brand identity guidelines
date: 2026-10-10
order: 6
description: Brand book, brand video and identity rules
downloads:
  - label: Brand book (PDF)
    href: brand/Ad-Omnia_Brand-Book.pdf
---

# Brand identity guidelines

## Brand video

<figure class="ad-video">
  <div class="ad-video-frame">
    <button type="button" class="ad-video-play" data-youtube="Q_YQUXswK0s" aria-label="Play A Thousand No's">
      <img src="../../../assets/videos/a-thousand-nos.jpg" alt="" loading="lazy">
      <span class="ad-video-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>
    </button>
  </div>
  <figcaption>
    <span class="ad-video-title">A Thousand No's</span>
    <span class="ad-video-meta">Brand video · 0:24</span>
  </figcaption>
</figure>

## Brand book

<div class="ad-deck" tabindex="0" data-pdf="../../../brand/Ad-Omnia_Brand-Book.pdf" aria-label="Brand book pages">
  <div class="ad-deck-stage">
    <canvas></canvas>
    <a class="ad-deck-fallback" href="../../../brand/Ad-Omnia_Brand-Book.pdf" target="_blank" rel="noopener">Open the brand book (PDF)</a>
  </div>
  <div class="ad-deck-bar">
    <div class="ad-deck-progress"></div>
    <div class="ad-deck-controls">
      <button type="button" class="ad-deck-prev" aria-label="Previous page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
      <span class="ad-deck-count"></span>
      <button type="button" class="ad-deck-next" aria-label="Next page"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
      <button type="button" class="ad-deck-full" aria-label="Full screen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg></button>
    </div>
  </div>
</div>

## Overview

**Ad Omnia in perpetuum.** Ad Omnia is a dual-use platform for Portugal that unifies platforms: it brings scattered public data feeds and systems (cartography, civil protection records, health indicators, wildfire and flight data) into one shared operational picture for public safety, large events and crisis response, with AI that recommends while people decide.

That is what the mark means. Each source is a ray of light; the lens gathers them into one picture. The brand idea is a single line: **light takes colour where it meets the lens.**

The brand is light-first. Slides, documents, posters and profiles all sit on `paper`. Product UI rules have some exceptions, such as the use of a white background.

## Content fundamentals

- Write plainly and calmly. Operators read under pressure: short sentences, concrete nouns, no jargon the field doesn't use.
- Sentence case everywhere, including buttons, titles and menu items. Uppercase only through the `label` style.
- Buttons and recommendations start with a verb and name the result: "Dispatch units", "Send 2 fire engines from Gouveia", "Acknowledge alert".
- Say what and where: "Forest fire, Serra da Estrela". Internal codes (`INC-0418`) go in mono metadata, never in titles.
- Times are 24-hour (`14:02`), coordinates in decimal degrees set in `data` (`40.4211 N, 7.7042 W`), metric units with a space (`25 km/h`).
- No emoji, no exclamation marks. AI output is always described as a recommendation, never as a decision or a fact.
- Slides follow the template's voice: one idea per slide, short noun-phrase titles ("How the logo is built", "Brand Identity").

## The logo: Lens A

A single ray of light enters a circular lens at the bottom left, strikes the top and reflects down at the physically correct angle (angle in equals angle out, off the tangent). A second ray bends inside the lens to form the crossbar and stops at its peak. The ring opens only where light touches it, with the same gap on both sides, and colour appears only at those openings: teal at the entry, blue at the reflection, violet at the end. The two ends of one opening never share a colour.

Variants (see the Logos assets):

| Asset                                        | Use                                                                                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `logo-light-hd.png`                          | Default on `paper` at any size above 120px. White lines with a thin warm-grey edge and soft shadow, colour at the openings.             |
| `logo-on-light-small.png`                    | Small sizes (48 to 120px): the slide corner logo, document headers. Its edge is heavier on purpose so it reads small; never enlarge it. |
| `logo-on-light.png`                          | The template's original medium version. Prefer `logo-light-hd.png` for anything large.                                                  |
| `logo-mono-black.png`, `logo-mono-white.png` | One colour, openings kept: print, favicons, anything under 48px.                                                                        |
| `logo-on-colour.png`                         | White lines, colour openings, no outline. Only on the brand colour washes and coloured fields.                                          |
| `logo-hero.png`                              | Plain white logo over strong colour washes. Opening and closing slides.                                                                 |
| `avatar-colour.png`, `avatar-mono.png`       | Square avatars for GitHub/GitLab organisations and social profiles.                                                                     |
| `logo-intro-white.mp4`                       | The 5-second intro animation, for the start and end of talks and loading screens.                                                       |

Rules:

- Keep clear space of at least a quarter of the lens width on every side.
- Colour logo at least 48px wide. Below that (favicons, small icons) use the monochrome logo, which keeps its openings at any size.
- Light grounds are the default. On dark grounds use the colour logo or the white one-colour logo.
- Print in one colour with the black monochrome logo on light grounds, white monochrome on dark.
- Never set text over the logo.
- On slides the logo sits in the bottom-right corner, the same distance from the bottom edge and the right edge (43px box offset at 1920x1080, which puts the lines 56px from both edges).
- The warm-grey edge only separates white lines from paper. Keep it thin; never thicken it, darken it or use the small version's heavier edge at large sizes.
- Never recolour the lines, never fill the ring, never stretch, rotate, outline differently or add effects.
- A static logo is the last frame of the animation, not a separate drawing.

## Colour

**Paper first.** `paper` (#F4F2EC) is the ground of every slide and screen; `surface` (white) lifts cards and panels off it. While white is used in the UI, for the brand and presentationss, never replace paper with pure white or a beige.

**The three lights** (`light-teal`, `light-blue`, `light-violet`) are the identity. In the logo their order is fixed: teal at the entry, blue at the reflection, violet at the end. In the interface and in charts they can appear in any order. They appear only:

- at ring openings and lens contact points,
- in large soft washes that sweep in from slide edges (`hero-wash.png`),
- as data series and ordered sequences (`data-1`, `data-2`, `data-3`, `Steps`).

They are never body text, button fills, backgrounds of UI panels or status colours. A full blue-violet gradient fill reads as generic SaaS, not as light meeting a lens.

**Text-safe versions.** The template's deep accents (`teal-deep`, `blue-deep`, `violet-deep`) work for large marks and charts. For small text and icons use the `-ink` versions: `teal-ink`, `blue-ink`, `violet-ink`. `teal-deep` (3.0:1) and `blue-deep` (4.2:1) fail AA for small text on paper; that is why the inks exist.

**Contrast.** `ink` (16:1) and `ink-muted` (5.7:1) carry all text on `paper` and `surface`. `line` is decorative and deliberately light.

**Status colours** (red, amber, green for operational severity) will be defined with the product UI. They will be a separate palette: the three lights never signal severity.

## Typography

Geist for everything people read, JetBrains Mono for everything people compare. Both load from Google Fonts.

- `display` for covers and hero titles, `heading-1` for document titles, `heading-2` for sections, `heading-3` for cards and sub-sections.
- `body` for reading text, `label` for overlines (uppercase, tracked), `caption` for captions and sources.
- `data` (mono, tabular figures) for coordinates, IDs, timings and figures in tables.
- Never set paragraphs in mono, never set coordinates in sans.

Slide scale, from the template (16:9, sizes in points): title 48, section number 96 with section title 44, slide title 36, body 18 (two columns 22), figure caption 16, statement 28, footer and source 11. The template file still uses Calibri; move it to Geist when it is next edited.

## Rays and lenses

The decorative system is light physics, applied strictly:

- A ray only reflects off or bends inside a lens. It never curves outside a lens and never refracts through empty space.
- Rays never start or end on screen. They enter and leave only through the left or right edge, at one third or two thirds of the height, and travel between levels (upper to lower, or lower to upper).
- Rings open only where a ray touches them; colour fills only those openings and fades into the white line. The two ends of one opening never share a colour. Only the numbered step circles are fully coloured.
- Lines are `ray` white at `stroke-ray`, with the warm-grey `ray-outline` and `shadow-ray`, so they survive projectors and light screens.
- Colour washes come in from slide edges and are not tied to ring positions.
- Rays never run behind data, charts or tables; keep them to margins, title, section and statement slides.

## Slides

Use the template (overview in the Slides assets). Every content layout comes in an "upper to lower" and a "lower to upper" route version; pick whichever keeps the ray away from your text. The corner layouts (one lens cut by the top-right or bottom-left corner, one coloured opening) are for slides with longer text. Opening and closing use the animated logo layout or the hero logo over washes.

## Product UI principles

- **Icon first.** When an icon alone is clear, use only the icon: "Clear" is a trash button, "Close" is an X, "Refresh" is a rotate arrow. Every icon-only button has a tooltip and an accessible label. Keep text labels where the action is important or ambiguous: main navigation, primary actions, anything destructive that needs confirming.
- **Round, like the lens.** Controls use `radius-md` (20px), cards, panels and images `radius-lg` (24px).
- **No coloured edge bars.** Never mark a card, row, alert or selected item with a coloured stripe on its left (or any) edge. Show selection and state with a full border, a selection tint or an icon.
- **No boxes around icons.** Icons stand on their own: no tinted squares, circles or frames behind them. An icon button shows a soft background only on hover or press.
- **No unnecessary colour backgrounds.** Information boxes, notes and hints sit on the page with an icon and text, not inside a tinted fill. Colour fills are reserved for state that needs attention.
- **No emoji.** Status and meaning come from Lucide icons, shapes and words.
- **Liquid without delaying.** Animations are smooth and fast, they should help guide the eye without slowing the operator.

## Motion

The logo animation is part of the identity and its order is fixed: the lens draws one lap and closes leaving the entry opening; the ray enters and reflects off the top, forming the A; the crossbar bends in last; colour fades in only where light meets the lens. Timing in the 5-second intro: circle 1.9s, pause 0.4s, the A 0.9s, pause 0.3s, crossbar 0.55s, hold 0.75s. No easing tricks at the reflection point: light does not slow down.

Slide transitions stay simple: fades or none. The animated logo layouts are the only place where the mark moves.

## Iconography

The brand sources define no icon set. Use [Lucide](https://lucide.dev) for every icon: outline icons at 1.75px stroke in `ink` or `ink-muted`, whose thin round-capped lines match the ray strokes. Icons stand alone, never in decorative boxes or circles. Never emoji, anywhere: not in UI, slides, documents, commit messages or social posts.

## Imagery

Photos only where they add information. Team photos are cropped into circles, as lenses (the template's team layout uses five same-size thin lenses, each with two coloured openings). No stock imagery, no illustrations of people.

## Tokens

### Colour

| Token          | Hex       | Use                                                                                                                                                         |
| -------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paper`        | `#F4F2EC` | Page and slide background. The warm off-white is the brand's ground; never swap it for pure white or beige.                                                 |
| `surface`      | `#FFFFFF` | Cards and boxes that sit on paper, like the template's step cards.                                                                                          |
| `ink`          | `#161616` | Primary text and icons on paper, surface and surface-sunken (16:1 on paper).                                                                                |
| `ink-muted`    | `#5C5F66` | Secondary text: subtitles, captions, table metadata, helper text. On paper, surface and surface-sunken (5.7:1 on paper).                                    |
| `line`         | `#C2BBAD` | Hairlines and dividers on slides and documents.                                                                                                             |
| `ray`          | `#FFFFFF` | Fill of decorative light rays and lens rings (the template's white lines). Always drawn with ray-outline and shadow-ray on light grounds.                   |
| `ray-outline`  | `#C2BBAD` | Thin warm-grey outline around rays and the logo on light backgrounds, so white strokes survive projectors.                                                  |
| `light-teal`   | `#2EC4AA` | Brand light colour 1, the entry point of the beam. Colour only where light meets a lens: ring openings, washes, data sequences step 1. Never used for text. |
| `light-blue`   | `#3D8BFF` | Brand light colour 2, the reflection point. Openings, washes, data sequences step 2, selection highlight fill.                                              |
| `light-violet` | `#A03CFF` | Brand light colour 3, the end of the path. Openings, washes, data sequences step 3.                                                                         |
| `teal-deep`    | `#0E9E86` | Template's deep teal for large marks: step-circle outlines, numbers 24px+, chart lines. 3.0:1 on paper, so not for body text; use teal-ink.                 |
| `blue-deep`    | `#2B6FE0` | Template's deep blue for large marks and chart bars (as in the template's bar chart). 4.2:1 on paper: large text only; use blue-ink for small text.         |
| `violet-deep`  | `#8B35E0` | Template's deep violet for large marks and the third step circle. Also passes for small text (5.1:1 on paper).                                              |
| `teal-ink`     | `#087A68` | Small text and icons in teal (4.7:1 on paper). Derived from teal-deep, darkened to pass AA.                                                                 |
| `blue-ink`     | `#2563D0` | Links, selected tab labels, small text and icons in blue (5.0:1 on paper). Derived from blue-deep.                                                          |
| `violet-ink`   | `#8B35E0` | Small text and icons in violet (5.1:1 on paper).                                                                                                            |

### Typefaces

| Family | Stack                                              |
| ------ | -------------------------------------------------- |
| sans   | `"Geist", ui-sans-serif, system-ui, sans-serif`    |
| mono   | `"JetBrains Mono", ui-monospace, Menlo, monospace` |

### Type styles

| Style       | Family | Size / line | Weight | Tracking | Use                                                                   |
| ----------- | ------ | ----------- | ------ | -------- | --------------------------------------------------------------------- |
| `display`   | sans   | 48px / 52px | 600    | -0.02em  | Covers and hero titles.                                               |
| `heading-1` | sans   | 32px / 38px | 600    | -0.015em | Document and page titles.                                             |
| `heading-2` | sans   | 24px / 30px | 600    | -0.01em  | Section titles.                                                       |
| `heading-3` | sans   | 18px / 24px | 600    | 0        | Card and sub-section titles.                                          |
| `body`      | sans   | 15px / 22px | 400    | 0        | Reading text.                                                         |
| `label`     | sans   | 12px / 16px | 500    | 0.04em   | Overlines and small labels, uppercase.                                |
| `caption`   | sans   | 12px / 16px | 400    | 0        | Captions and sources.                                                 |
| `data`      | mono   | 13px / 18px | 400    | 0        | Numbers people compare: coordinates, IDs, timings, figures in tables. |

### Spacing

| Token     | Value  | Use              |
| --------- | ------ | ---------------- |
| `space-2` | `8px`  | Small gaps.      |
| `space-4` | `16px` | Card padding.    |
| `space-6` | `32px` | Section spacing. |
| `space-8` | `64px` | Slide margins.   |

### Radius

| Token         | Value    | Use                                                             |
| ------------- | -------- | --------------------------------------------------------------- |
| `radius-sm`   | `8px`    | Small elements: badges, checkboxes, tooltips.                   |
| `radius-md`   | `20px`   | Controls: buttons, icon buttons, inputs, selects, tabs.         |
| `radius-lg`   | `24px`   | Cards, panels, dialogs, images and the template's step cards.   |
| `radius-full` | `9999px` | Lens shapes: step circles, round team photos, toggles, avatars. |

### Shadow

| Token         | Value                                                          | Use                                                                    |
| ------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `shadow-card` | `0 1px 2px rgba(22,22,22,0.06), 0 1px 1px rgba(22,22,22,0.04)` | Cards and panels on paper.                                             |
| `shadow-ray`  | `0 2px 6px rgba(60,52,40,0.22)`                                | Soft drop shadow under white rays and the white logo on light grounds. |

### Stroke

| Token        | Value | Use                                            |
| ------------ | ----- | ---------------------------------------------- |
| `stroke-ray` | `3px` | Decorative rays and lens rings at screen size. |

### Slides

- Canvas 1920x1080, margins 128px, paper background.
- Corner logo: `logo-on-light-small.png`, 96x99px box at right 43px, bottom 43px (lines 56px from both edges). Not on the cover or closing slide, which carry the hero logo.
- Titles Geist 600 at 72px (section titles 96px, statements 120px), body 26 to 32px in `ink-muted`.
