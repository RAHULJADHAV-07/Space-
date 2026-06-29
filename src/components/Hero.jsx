import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { motion as motionStore, prefersReducedMotion } from '../lib/store.js';

const LINE1 = [
  { text: 'WE BUILD', cls: '' },
  { text: 'SOFTWARE', cls: 'solar' },
  { text: 'THAT', cls: '' },
];
const LINE2 = [{ text: 'LEAVES ORBIT', cls: 'outline' }];

const SUB = 'Websites · Mobile Apps · Software Solutions · Data Analysis · Data Cleaning · DevOps — engineered from India, deployed to the world.';

/* Space Shuttle stack (user-provided cutout), nose pointing right */
const Rocket = () => (
  <img src={`${import.meta.env.BASE_URL}textures/shuttle.png`} alt="" draggable="false" />
);

const Ring = () => (
  <svg viewBox="0 0 200 200" fill="none">
    <circle cx="100" cy="100" r="96" stroke="rgba(255,255,255,.18)" strokeWidth=".5" strokeDasharray="1 5" />
    <circle cx="100" cy="100" r="82" stroke="rgba(255,255,255,.12)" strokeWidth=".5" strokeDasharray="14 8" />
    <circle cx="100" cy="100" r="66" stroke="rgba(255,255,255,.2)" strokeWidth=".4" strokeDasharray="2 3" />
  </svg>
);

/* Terminal-style decode: random glyphs settle into the real text, left to right. */
function ScrambleText({ text, start, className }) {
  const ref = useRef(null);
  const GLYPHS = '█▓▒░<>/\\|=+*·—';
  useEffect(() => {
    if (!start || !ref.current) return;
    if (prefersReducedMotion) { ref.current.textContent = text; return; }
    let frame = 0, raf;
    const total = 40;
    const tick = () => {
      frame++;
      const settled = Math.floor((frame / total) * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        if (i < settled || text[i] === ' ' || text[i] === '·') out += text[i];
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      ref.current.textContent = out;
      if (frame < total) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [start, text]);
  return <p ref={ref} className={className}>{' '}</p>;
}

/* Split a segment list into word masks → per-char spans.
   Outer .char carries the entrance rise; inner .char-in is driven by the
   cursor-proximity loop so the two transforms never fight. */
function KineticLine({ segments, baseDelay, registerChar }) {
  let charIdx = 0;
  return segments.map((seg, si) => (
    <span key={si} className="seg">
      {seg.text.split(' ').map((word, wi) => (
        <span key={wi} className={`w ${seg.cls}`}>
          {word.split('').map((ch, ci) => {
            const d = baseDelay + (charIdx++) * 0.026;
            return (
              <span key={ci} className="char" style={{ '--d': `${d}s` }}>
                <span className="char-in" ref={registerChar}>{ch}</span>
              </span>
            );
          })}
        </span>
      )).reduce((acc, el, i) => (i ? [...acc, ' ', el] : [el]), [])}
      {si < segments.length - 1 ? ' ' : null}
    </span>
  ));
}

export default function Hero({ ready }) {
  const ref = useRef(null);
  const skewRef = useRef(null);
  const chars = useRef([]);
  const [settled, setSettled] = useState(false); // entrance finished → proximity takes over

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  // the two lines decouple on scroll: line 1 climbs away, line 2 swells and blurs out
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const scale2 = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const blur2 = useTransform(scrollYProgress, (v) => `blur(${v * 9}px)`);

  const registerChar = (el) => { if (el && !chars.current.includes(el)) chars.current.push(el); };

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setSettled(true), 2300);
    return () => clearTimeout(t);
  }, [ready]);

  /* one rAF loop drives: scroll-velocity skew + cursor-proximity liquid type */
  useEffect(() => {
    if (prefersReducedMotion || window.matchMedia('(hover:none)').matches) return;

    let raf, skew = 0, mx = -9999, my = -9999;
    let cache = null;
    const onMove = (e) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMove, { passive: true });

    const buildCache = () => {
      cache = chars.current.map((el) => {
        const r = el.getBoundingClientRect();
        return { el, x: r.left + r.width / 2, yPage: r.top + window.scrollY + r.height / 2, f: 0 };
      });
    };
    const onResize = () => { cache = null; };
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);

    const tick = () => {
      // velocity skew — the headline leans with scroll speed
      const target = Math.max(-3, Math.min(3, motionStore.velocity * 0.06));
      skew += (target - skew) * 0.12;
      if (skewRef.current) skewRef.current.style.transform = `skewY(${skew.toFixed(3)}deg)`;

      // liquid proximity lift (only after the entrance has finished)
      if (settled) {
        if (!cache) buildCache();
        const sy = window.scrollY;
        for (const c of cache) {
          const dx = mx - c.x, dy = my - (c.yPage - sy);
          const f = Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120));
          if (Math.abs(f - c.f) > 0.004) {
            c.f = f;
            c.el.style.transform = f > 0.01
              ? `translateY(${(-13 * f).toFixed(2)}px) scaleY(${(1 + 0.12 * f).toFixed(3)})`
              : '';
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, [settled]);

  return (
    <header className="hero" id="top" ref={ref}>
      {ready && !prefersReducedMotion && (
        <motion.div
          className="liftoff-flash"
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.7, ease: [0.22, 1, 0.36, 1] }}
        />
      )}

      <motion.div className="hero-copy" style={prefersReducedMotion ? undefined : { y, opacity }}>
        <div className="hero-float">
          <div className="hero-skew" ref={skewRef}>
            <ScrambleText
              className="eyebrow"
              start={ready}
              text="IT AGENCY · MISSION CONTROL FOR DIGITAL PRODUCTS"
            />

            {prefersReducedMotion ? (
              <h1>
                WE BUILD <span className="solar-flat">SOFTWARE</span> THAT<br />
                <span className="outline-flat">LEAVES ORBIT</span>
              </h1>
            ) : (
              <h1 className={ready ? 'go' : ''}>
                <span className="rocket" aria-hidden="true"><Rocket /></span>
                <motion.span className="line" style={{ y: y1 }}>
                  <KineticLine segments={LINE1} baseDelay={0.1} registerChar={registerChar} />
                </motion.span>
                <motion.span className="line" style={{ y: y2, scale: scale2, filter: blur2 }}>
                  <KineticLine segments={LINE2} baseDelay={0.62} registerChar={registerChar} />
                </motion.span>
              </h1>
            )}

            <p className="hero-sub">
              {SUB.split(' ').map((w, i) => (
                <motion.span
                  key={i}
                  style={{ display: 'inline-block' }}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
                  animate={ready ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 1.05 + i * 0.022 }}
                >
                  {w}&nbsp;
                </motion.span>
              ))}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="ring r"
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.85 }}
        animate={ready ? { opacity: 0.5, scale: 1 } : {}}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 1.4 }}
      >
        <Ring />
      </motion.div>

      <motion.div
        className="scroll-hint"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 1.8 }}
      >
        Scroll to descend
      </motion.div>
    </header>
  );
}
