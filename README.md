# AVITA Technology — React

The single-file `avita-technology-v3.html` rebuilt as a React + Vite app with a far
richer motion layer. The original is preserved as `avita-technology-v3.original.html`.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production bundle in dist/
npm run preview  # serve the built bundle
```

## Stack

- **React 18 + Vite** — component architecture and fast dev server.
- **@react-three/fiber + drei** — the WebGL background: real NASA Blue Marble
  Earth (day + normal maps in `public/textures/`), India oriented onto the visible
  crest of the dome with a glowing border and a pulsing Mumbai beacon, atmosphere
  shader, parallax stars, shooting-star comets. The Mumbai callout is a drei
  `<Html>` pinned to the globe.
- **Framer Motion** — masked headline reveal, staggered section entrances, magnetic
  nav/buttons, animated counters, scroll-linked hero parallax and the flight "fuel"
  gauge. Services is a pinned "solar system tour": 8 services mapped to 8
  CSS-rendered planets (Mercury → Neptune); scroll flies you planet to planet
  while the section stays pinned.
- **Lenis** — buttery smooth scrolling; its scroll/velocity feeds a shared store
  (`src/lib/store.js`) that both the 3D scene and DOM widgets (marquee, HUD) read.

## Layout

```
src/
  App.jsx              composition + preloader gating
  lib/
    earth.js           Earth build: Blue Marble maps, India outline + beacon, orientation
    astronaut.js       procedural back-view astronaut (currently unused, kept for reuse)
    stars.js           starfields + comet system
    store.js           shared scroll/pointer state (non-React, 60fps)
  hooks/
    useSmoothScroll.js Lenis boot + store feed + anchor routing
  components/
    Scene.jsx          R3F canvas + useFrame animation loop
    SceneBoundary.jsx  WebGL failure fallback (keeps the site alive)
    Preloader, Cursor, ProgressBar, HUD, Nav, OrbContact,
    Hero, Marquee, Services, Flight, Stats, CTA, Footer, Reveal, Magnetic
```

## Notes

- Everything degrades for `prefers-reduced-motion` (no preloader, no custom cursor,
  static reveals, demand-rendered scene).
- If WebGL is unavailable, `SceneBoundary` swaps in a static gradient backdrop.
# Space-
