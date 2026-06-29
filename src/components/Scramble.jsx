import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../lib/store.js';

const POOL = '#%&@$AZRXKW0147<>/';

/* Decode-style text: characters resolve left-to-right out of telemetry noise.
   `go` arms it (usually an inView flag); `duration` is ms, time-based so the
   decode lands on schedule at any frame rate. Reduced-motion renders final. */
export default function Scramble({ text, go = true, duration = 900 }) {
  const [out, setOut] = useState(prefersReducedMotion ? text : '');

  useEffect(() => {
    if (prefersReducedMotion) { setOut(text); return; }
    if (!go) return;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const reveal = Math.floor(p * text.length);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        s += i < reveal ? text[i]
          : text[i] === ' ' ? ' '
          : POOL[(Math.random() * POOL.length) | 0];
      }
      setOut(p >= 1 ? text : s);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [go, text, duration]);

  // reserve space pre-decode so layout never jumps
  return <span style={{ whiteSpace: 'pre' }}>{out || ' '}</span>;
}
