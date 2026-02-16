# SEO + Images + TOC Design — Sabka Blog

**Date:** 2026-02-16
**Status:** Approved

## Problem

Blog articles are text-only with no images, no Table of Contents, basic styling (Geist font, zinc palette). Need to match quality level of YouNeverSleep reference (TOC sidebar, custom meme illustrations, green accent, Inter font).

## Decisions

- **Image generation:** Gemini Imagen 3 (free via Google AI Studio API, key already exists)
- **Accent color:** Green (#22c55e)
- **Font:** Inter
- **Text on images:** Imagen draws Russian text directly (accept occasional artifacts for meme style)
- **Approach:** Full automation — pipeline generates images, no manual intervention

## Architecture

### Pipeline Changes

```
writer → editors (4x) → IMAGE GENERATOR (new) → publisher
```

**Writer** — updated prompt to insert `![MEME: description](placeholder)` markers (4-6 per article). First image = cover. Strict H2/H3 hierarchy.

**Image Generator** (`lib/pipeline/image-generator.ts`) — new stage:
1. Parse `![MEME: ...]` placeholders from markdown
2. For each: generate English prompt for Imagen 3 → call API → get image bytes
3. Upload to Supabase Storage (`blog-images/{slug}/img-{n}.webp`)
4. Replace placeholder with real URL, keep Russian alt text

**Publisher** — updated to set `cover_image` from first generated image, used for og:image.

### Frontend Changes

**Font:** Inter (replace Geist in `app/layout.tsx`)

**Color:** Green accent via CSS custom properties in `globals.css`

**Article page** (`app/blog/[slug]/page.tsx`):
- Two-column layout: sticky TOC sidebar (left) + content (right)
- Mobile: collapsible TOC above content
- Reading time in header

**TOC Component** (`components/table-of-contents.tsx`):
- Client component with `"use client"`
- Parses H2/H3 from content HTML
- Intersection Observer for active heading highlight (green)
- Smooth scroll on click

### SEO Additions

- Heading hierarchy enforcement in writer prompt (H1 → H2 → H3, no skips)
- Image alt text in Russian
- width/height on images for CLS
- loading="lazy" below fold
- og:image from cover_image
- Reading time display
- article:section, article:tag in OG meta

### Storage

- Supabase Storage bucket: `blog-images` (public)
- Path pattern: `blog-images/{slug}/img-{n}.webp`
- Format: WebP, 1200px width

## Files Changed

| File | Change |
|------|--------|
| `app/layout.tsx` | Geist → Inter font |
| `app/globals.css` | Green accent CSS vars, prose customization |
| `components/table-of-contents.tsx` | New: sticky TOC with Intersection Observer |
| `app/blog/[slug]/page.tsx` | Two-column layout, TOC, reading time, og:image |
| `app/blog/layout.tsx` | Green accent button |
| `lib/pipeline/image-generator.ts` | New: Imagen 3 generation + Supabase upload |
| `lib/pipeline/writer.ts` | Updated prompt with image placeholders + heading rules |
| `lib/pipeline/publisher.ts` | Set cover_image, og:image support |
| `lib/pipeline/editors.ts` | Preserve image placeholders instruction |
| `app/api/cron/generate/route.ts` | Add image generation step |
| `scripts/run-pipeline.ts` | Add image generation step |
