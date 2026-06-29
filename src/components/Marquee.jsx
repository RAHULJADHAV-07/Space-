import { useEffect, useRef } from 'react';
import { motion } from '../lib/store.js';

const ITEMS = ['WEBSITES', 'MOBILE APPS', 'SOFTWARE SOLUTIONS', 'DATA ANALYSIS', 'DATA CLEANING', 'DEVOPS'];

export default function Marquee() {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    let x = 0, raf;
    let half = track.scrollWidth / 2;
    const onResize = () => { half = track.scrollWidth / 2; };
    window.addEventListener('resize', onResize);

    const tick = () => {
      // base drift + scroll-velocity boost; sign follows scroll direction
      const boost = Math.min(Math.abs(motion.velocity) * 0.6, 60);
      const dir = motion.velocity >= 0 ? -1 : 1;  // scroll down → drift left
      x += dir * (0.6 + boost);
      if (x <= -half) x += half;
      if (x >= 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track" ref={trackRef}>
        {row.map((label, i) => (
          <span key={i}><i>✦</i>{label}</span>
        ))}
      </div>
    </div>
  );
}
