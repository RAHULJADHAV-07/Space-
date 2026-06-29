import { useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Reveal from './Reveal.jsx';
import { motion as motionStore, prefersReducedMotion } from '../lib/store.js';

const EASE = [0.22, 1, 0.36, 1];

const STAGES = [
  { t: 'T-MINUS 04', h: 'Discover', p: 'Goals, users, constraints — a short sprint that ends in a scoped plan, a budget, and a launch date you can hold us to.' },
  { t: 'T-MINUS 03', h: 'Design', p: 'Wireframes, prototypes, and a visual system tested with real users before any production code is written.' },
  { t: 'T-MINUS 02', h: 'Build', p: 'Two-week sprints with demos every Friday — working software early and often, no six-month silence.' },
  { t: 'T-MINUS 01', h: 'Launch', p: 'Performance audits, security checks, and a pipeline rehearsed until liftoff is boring. Boring launches are good launches.' },
  { t: 'IN ORBIT', h: 'Operate', p: 'Monitoring, maintenance, analytics, iteration — we stay on comms while your product keeps improving.' },
];

/* Flat, full-width rows like the reference; only opacity is per-row
   (rows dissolve as they recede toward the vanishing point). */
function Row({ s, i }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const opacity = useTransform(scrollYProgress, [0, 0.68, 1], [1, 1, 0.1]);

  const isOrbit = s.t === 'IN ORBIT';
  // Whole row scales as one unit AND each row is a wider centered band than the
  // last — narrow at the top, widest at Operate — so the stack reads as a
  // triangle (see reference), with the + holding the centre axis.
  const scale = 1 + i * 0.18;
  const width = `${60 + i * 9}%`;
  const vars = { '--fp-s': scale, '--fp-w': width };

  return (
    <motion.div ref={ref} className="fp-row"
      style={prefersReducedMotion ? vars : { opacity, ...vars }}>
      <div className="fp-main">
        <h3 className="fp-title">{s.h}</h3>
        <div className="fp-mid" aria-hidden="true">+</div>
        <div className="fp-right">
          <small>{isOrbit ? 'STATUS' : 'T-MINUS'}</small>
          <span className="fp-num">{isOrbit ? '∞' : s.t.split(' ')[1]}</span>
        </div>
      </div>
      <p className="fp-desc">{s.p}</p>
      <motion.div
        className="fp-line"
        initial={prefersReducedMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.1 + i * 0.05 }}
      />
    </motion.div>
  );
}

export default function Flight() {
  const secRef = useRef(null);
  const stageRef = useRef(null);
  const planeRef = useRef(null);

  /* The whole list is ONE plane tilted in 3D. Each frame the vanishing point
     (perspective-origin + transform-origin) tracks a "camera line" near the
     bottom of the viewport: rows on that line are full size, rows above it
     recede into the distance — so every row grows as it descends toward you.
     Also drives the scroll-velocity skew on the big type. */
  useEffect(() => {
    if (prefersReducedMotion) return;
    let raf, sk = 0, planeTop = 0;

    const measure = () => {
      let t = 0, n = planeRef.current;
      while (n) { t += n.offsetTop; n = n.offsetParent; }
      planeTop = t; // layout position — unaffected by the transform itself
    };
    measure();
    window.addEventListener('resize', measure);

    const tick = () => {
      const stage = stageRef.current, plane = planeRef.current;
      if (stage && plane) {
        const camY = window.scrollY + window.innerHeight * 0.92 - planeTop;
        stage.style.perspectiveOrigin = `50% ${camY}px`;
        plane.style.transformOrigin = `50% ${camY}px`;

        const target = Math.max(-5, Math.min(5, motionStore.velocity * 0.16));
        sk += (target - sk) * 0.12;
        secRef.current?.style.setProperty('--vskew', sk.toFixed(3));
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', measure); };
  }, []);

  return (
    <section id="flight" ref={secRef}>
      <div className="sec-head fp-head">
        <Reveal as="p" variant="up" className="eyebrow fp-eyebrow"><span>Flight plan</span></Reveal>
        <Reveal as="h2" variant="up" delay={0.08} className="fp-heading">
          <span className="fp-h-top">From countdown</span>
          <span className="fp-h-bot">to <span className="solar">stable orbit</span></span>
        </Reveal>
      </div>
      <div className="fp-stage" ref={stageRef}>
        <div className="fp-plane" ref={planeRef}>
          {STAGES.map((s, i) => <Row key={s.h} s={s} i={i} />)}
        </div>
      </div>
    </section>
  );
}
