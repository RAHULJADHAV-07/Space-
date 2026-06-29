import { useEffect } from 'react';
import Lenis from 'lenis';
import { motion, prefersReducedMotion } from '../lib/store.js';

/* Boots Lenis smooth scrolling, feeds the shared motion store
   (scrollY / velocity / progress) and the pointer, and routes
   in-page anchor clicks through Lenis. */
export default function useSmoothScroll() {
  useEffect(() => {
    // pointer feed (works regardless of reduced motion; scene clamps it)
    const onPointer = (e) => {
      motion.px = (e.clientX / window.innerWidth - 0.5) * 2;
      motion.py = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onPointer, { passive: true });

    if (prefersReducedMotion) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        motion.scrollY = window.scrollY;
        motion.progress = max > 0 ? window.scrollY / max : 0;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => {
        window.removeEventListener('mousemove', onPointer);
        window.removeEventListener('scroll', onScroll);
      };
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      lerp: 0.1,
    });

    lenis.on('scroll', ({ scroll, velocity, progress }) => {
      motion.scrollY = scroll;
      motion.velocity = velocity;
      motion.progress = progress;
    });

    let raf;
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    // anchor links → smooth scroll
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -20 });
    };
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onPointer);
      lenis.destroy();
    };
  }, []);
}
