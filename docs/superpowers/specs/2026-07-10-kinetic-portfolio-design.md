# Kinetic Dark Editorial Portfolio — Design Spec

**Date:** 2026-07-10
**Type:** Frontend animation showcase portfolio (demo content)

## Goal
Award-site-grade portfolio for a frontend dev who excels at animation: GSAP, smooth
scroll, kinetic type / text reveals, parallax, magnetic interactions. Demo content
(fictional "Kaan Voss — Motion & Interaction Engineer"); real details swapped in later.

## Stack
- Vite + React 18 + TypeScript
- GSAP 3 core + `@gsap/react` (`useGSAP` hook) + ScrollTrigger
- Lenis (smooth inertia scroll)
- Custom char/word splitter helper (free — no paid SplitText plugin)
- Plain CSS Modules (no Tailwind) for editorial control
- No git commits (project has no git per user convention)

## Visual language
- Palette: bg `#0a0a0a`, text `#ece9e2`, accent = **chrome/silver gradient**
  (`linear-gradient(180deg,#f5f5f5,#8a8a8a 40%,#e8e8e8 55%,#5a5a5a)` clipped to text)
- Type: oversized display grotesk (e.g. system "Inter"/"Space Grotesk" via fontsource
  or Google Fonts link), body in same family lighter weight
- Film grain overlay, scroll-progress bar, custom cursor

## Sections (each = one component in `src/sections/`)
1. **Intro overlay** — full-screen load animation, counter 0→100, wipes up
2. **Hero** — char-by-char reveal of huge name, mask wipe, cursor-follow highlight
3. **Marquee** — infinite ticker, speed reacts to scroll velocity
4. **About** — line/word reveal on scroll-scrub, pinned block
5. **Work** — 4 project cards: parallax image depth, magnetic hover tilt, clip-path reveal
6. **Capabilities** — horizontal-scroll pinned panel + staggered number counters
7. **Contact** — big kinetic outro line + magnetic email button, footer

## Reusable hooks (`src/hooks/`)
- `useSplitReveal(ref, opts)` — splits text to spans, staggered reveal via ScrollTrigger
- `useMagnetic(ref, strength)` — pointer-follow magnetic pull on element
- `useParallax(ref, speed)` — scroll-linked Y translate (scrub, ease none)
- `useLenis()` — init Lenis, drive `ScrollTrigger.update` from Lenis raf

## Utilities (`src/lib/`)
- `splitText.ts` — pure function: wrap each char/word in `<span>`, return node list
- `gsap.ts` — central `gsap.registerPlugin(ScrollTrigger)`, register `useGSAP`

## Cross-cutting rules
- Guard everything behind `prefers-reduced-motion`: skip transforms, show final state
- Mobile: no blur filters (GPU frame drops per GSAP guidance); reduce parallax depth
- Wait `document.fonts.ready` before splitting text (correct char positions)
- Cleanup: `useGSAP` scope auto-reverts; revert splits on unmount
- `scrub` animations use `ease:"none"` (scrollbar is the easing)

## File tree
```
kinetic-portfolio/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    App.tsx
    styles/  global.css, tokens.css
    lib/     gsap.ts, splitText.ts
    hooks/   useLenis.ts, useSplitReveal.ts, useMagnetic.ts, useParallax.ts
    components/  Cursor.tsx, Grain.tsx, ScrollProgress.tsx, IntroOverlay.tsx
    sections/    Hero.tsx, Marquee.tsx, About.tsx, Work.tsx, Capabilities.tsx, Contact.tsx
    data/    projects.ts, capabilities.ts
```

## Success criteria
- `npm install && npm run dev` runs clean, no console errors
- All 7 sections render with their signature animation firing
- Smooth scroll active, custom cursor + grain + progress bar present
- Reduced-motion + mobile fallbacks work
- Placeholder content clearly marked for easy swap
