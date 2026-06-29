import { useEffect, useRef } from 'react';
import { motion as motionStore } from '../lib/store.js';

/* Bottom-left flight telemetry, driven by the shared scroll store. */
export default function HUD() {
  const alt = useRef(null);
  const vel = useRef(null);

  useEffect(() => {
    let raf;
    const tick = () => {
      if (alt.current) alt.current.textContent = `${(motionStore.scrollY / 10).toFixed(1)} km`;
      if (vel.current) vel.current.textContent = `${Math.abs(motionStore.velocity).toFixed(1)} m/s`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hud" aria-hidden="true">
      <div>ALT&nbsp;&nbsp;<b ref={alt}>0 km</b></div>
      <div>VEL&nbsp;&nbsp;<b ref={vel}>0.0 m/s</b></div>
      <div>SYS&nbsp;&nbsp;<b style={{ color: 'var(--solar)' }}>NOMINAL</b></div>
    </div>
  );
}
