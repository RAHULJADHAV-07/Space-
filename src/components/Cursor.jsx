import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/store.js';

/* Difference-blend ring that eases toward the pointer + instant dot.
   Grows ("hot") over interactive elements. */
export default function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion || window.matchMedia('(hover:none)').matches) return;
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my, raf;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) { dot.current.style.left = `${mx}px`; dot.current.style.top = `${my}px`; }
    };
    const follow = () => {
      cx += (mx - cx) * 0.16; cy += (my - cy) * 0.16;
      if (ring.current) { ring.current.style.left = `${cx}px`; ring.current.style.top = `${cy}px`; }
      raf = requestAnimationFrame(follow);
    };
    follow();
    addEventListener('mousemove', onMove);

    const hot = () => ring.current?.classList.add('hot');
    const cool = () => ring.current?.classList.remove('hot');
    const targets = document.querySelectorAll('a,button,.module,[data-cursor]');
    targets.forEach((el) => { el.addEventListener('mouseenter', hot); el.addEventListener('mouseleave', cool); });

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('mousemove', onMove);
      targets.forEach((el) => { el.removeEventListener('mouseenter', hot); el.removeEventListener('mouseleave', cool); });
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={ring} aria-hidden="true" />
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
