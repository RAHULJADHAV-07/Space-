/* Lightweight mutable store shared between the R3F scene and DOM listeners.
   Intentionally NOT React state — updated 60fps without re-rendering. */
export const motion = {
  scrollY: 0,    // raw scroll px (target)
  progress: 0,   // 0..1 through the page
  velocity: 0,   // px/frame
  px: 0, py: 0,  // pointer, -1..1 (target)
};

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
