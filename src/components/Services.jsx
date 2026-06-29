import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import Reveal from './Reveal.jsx';
import { prefersReducedMotion } from '../lib/store.js';

const EASE = [0.22, 1, 0.36, 1];

/* 8 services × 8 planets, Mercury → Neptune */
const SERVICES = [
  {
    planet: 'Mercury', code: 'MOD-01', title: 'Web Development',
    desc: 'High-performance marketing sites, e-commerce, and web platforms. Built fast, found on search, and engineered to convert visitors into customers.',
    chips: ['Marketing sites', 'E-commerce', 'SEO / Core Web Vitals'],
    size: 290, accent: '#cfc8bc', img: 'mercury.webp', glow: 'rgba(190,180,165,.28)',
  },
  {
    planet: 'Venus', code: 'MOD-02', title: 'Mobile App Development',
    desc: 'Native and cross-platform apps for iOS and Android. Smooth interfaces, offline-ready architecture, and release pipelines that ship updates weekly.',
    chips: ['iOS & Android', 'Cross-platform', 'Offline-first'],
    size: 350, accent: '#ffd9a0', img: 'venus.webp', glow: 'rgba(255,200,120,.35)',
  },
  {
    planet: 'Earth', code: 'MOD-03', title: 'Software Solutions',
    desc: 'Custom ERPs, CRMs, dashboards, and internal tools tailored to how your business actually runs — not how off-the-shelf software wishes it did.',
    chips: ['ERPs & CRMs', 'Dashboards', 'Internal tools'],
    size: 380, accent: '#8fd0ff', moons: 1, img: 'earth.webp', glow: 'rgba(110,180,255,.4)',
  },
  {
    planet: 'Mars', code: 'MOD-04', title: 'Software Consulting',
    desc: 'Senior engineers in your corner before you commit budget. Architecture reviews, tech-stack decisions, code audits, and delivery roadmaps that de-risk the mission.',
    chips: ['Architecture reviews', 'Tech audits', 'Roadmaps'],
    size: 330, accent: '#ff9a6b', moons: 1, img: 'mars.webp', glow: 'rgba(255,130,80,.32)',
  },
  {
    planet: 'Jupiter', code: 'MOD-05', title: 'Software Maintenance',
    desc: 'Long-haul support for the systems you already run. Bug fixes, dependency upgrades, performance tuning, and security patches — your software ages well instead of breaking down.',
    chips: ['Bug fixes', 'Upgrades & patches', 'Performance tuning'],
    size: 520, accent: '#e8cfa8', moons: 2, img: 'jupiter.webp', glow: 'rgba(230,200,150,.3)',
  },
  {
    planet: 'Saturn', code: 'MOD-06', title: 'Testing & QA',
    desc: 'Nothing launches untested. Automated suites, regression coverage, load and security testing — every release rehearsed until failure has nowhere to hide.',
    chips: ['Automation suites', 'Regression', 'Load testing'],
    size: 620, accent: '#eee0bd', img: 'saturn.webp', glow: 'rgba(235,215,170,.3)',
  },
  {
    planet: 'Uranus', code: 'MOD-07', title: 'Data Cleaning',
    desc: 'Deduplication, validation, normalization, and migration. We make messy datasets launch-ready so every downstream system trusts its inputs.',
    chips: ['Dedup & validation', 'Normalization', 'Migrations'],
    size: 370, accent: '#9fe5e1', img: 'uranus.webp', glow: 'rgba(130,220,215,.3)',
  },
  {
    planet: 'Neptune', code: 'MOD-08', title: 'Cloud Deployment',
    desc: 'CI/CD pipelines, cloud infrastructure, monitoring, and incident response. Deployments without drama — your systems stay in stable orbit.',
    chips: ['CI/CD', 'AWS / GCP / Azure', 'Monitoring'],
    size: 390, accent: '#a9c0ff', img: 'neptune.webp', glow: 'rgba(120,150,255,.38)',
  },
];

/* ---------- micro-components ---------- */

/* terminal decode on mount — random glyphs settle into the text */
function ScrambleIn({ text, style }) {
  const ref = useRef(null);
  const GLYPHS = '█▓▒░<>/\\|=+*·';
  useEffect(() => {
    if (!ref.current) return;
    let frame = 0, raf;
    const total = 22;
    const tick = () => {
      frame++;
      const settled = Math.floor((frame / total) * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        out += i < settled ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      ref.current.textContent = out;
      if (frame < total) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <span ref={ref} style={style}>{' '}</span>;
}

/* per-character masked cascade for the service title */
function KineticTitle({ text }) {
  let ci = 0;
  return (
    <h3 className="p-title" aria-label={text}>
      {text.split(' ').map((word, wi) => (
        <span key={wi} className="tw">
          {word.split('').map((ch, i) => (
            <motion.span
              key={i}
              className="tc"
              initial={{ y: '118%' }}
              animate={{ y: '0%' }}
              transition={{ delay: 0.12 + (ci++) * 0.02, duration: 0.6, ease: EASE }}
            >
              {ch}
            </motion.span>
          ))}
          {wi < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </h3>
  );
}

function Planet({ s }) {
  return (
    <div className="planet" style={{ '--size': `${s.size}px`, '--glow': s.glow }}>
      <img src={`${import.meta.env.BASE_URL}textures/planets/${s.img}`} alt="" draggable="false" />
      {Array.from({ length: s.moons || 0 }, (_, i) => (
        <div key={i} className="moon-orbit" style={{ animationDuration: `${11 + i * 7}s`, inset: `${-12 - i * 9}%` }}>
          <i />
        </div>
      ))}
    </div>
  );
}

/* Planets live on one continuous flight path scrubbed by scroll. */
function PlanetCar({ s, i, count, progress }) {
  const rel = useTransform(progress, (p) => p * count - (i + 0.5));
  const x = useTransform(rel, (r) => `${-r * 82}vw`);
  const y = useTransform(rel, (r) => `${-r * 9 + r * r * 3.5}vh`);
  const scale = useTransform(rel, (r) => Math.max(0.45, 1 - Math.abs(r) * 0.42));
  const rotate = useTransform(rel, (r) => -r * 10);
  const opacity = useTransform(rel, (r) => Math.min(1, Math.max(0, 1.45 - Math.abs(r) * 1.45)));
  const filter = useTransform(rel, (r) => `blur(${Math.min(Math.abs(r) * 11, 16).toFixed(1)}px)`);
  const visibility = useTransform(rel, (r) => (Math.abs(r) > 1.12 ? 'hidden' : 'visible'));

  return (
    <div className="planet-car">
      <motion.div style={{ x, y, scale, rotate, opacity, filter, visibility }}>
        <Planet s={s} />
      </motion.div>
    </div>
  );
}

const stageVariants = {
  enter: (d) => ({ y: d > 0 ? 54 : -54, opacity: 0 }),
  center: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
  exit: (d) => ({ y: d > 0 ? -54 : 54, opacity: 0, transition: { duration: 0.32, ease: [0.55, 0, 0.55, 0.2] } }),
};

const item = (delay) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: EASE },
});

export default function Services() {
  const wrapRef = useRef(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);

  // preload all planet photos so scroll transitions never flash
  useEffect(() => {
    SERVICES.forEach((s) => {
      const im = new Image();
      im.src = `${import.meta.env.BASE_URL}textures/planets/${s.img}`;
    });
  }, []);

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(SERVICES.length - 1, Math.max(0, Math.floor(v * SERVICES.length)));
    if (idx !== activeRef.current) {
      setDir(idx > activeRef.current ? 1 : -1);
      activeRef.current = idx;
      setActive(idx);
    }
  });

  if (prefersReducedMotion) {
    return (
      <section id="services">
        <div className="sec-head">
          <p className="eyebrow">Mission modules</p>
          <h2>Eight planets.<br />One <span className="solar">mission.</span></h2>
        </div>
        <div className="modules">
          {SERVICES.map((s) => (
            <article key={s.code} className="module" data-code={s.code}>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  const s = SERVICES[active];

  return (
    <section id="services" className="solar-wrap" ref={wrapRef}>
      <div className="solar-pin">
        <div className="sec-head solar-head">
          <Reveal as="p" variant="left" className="eyebrow">Mission modules · a tour of the system</Reveal>
          <Reveal as="h2" variant="left" delay={0.08}>
            Eight planets.<br />One <span className="solar">mission.</span>
          </Reveal>
        </div>

        <div className="solar-holder">
          <svg className="orbit-path" viewBox="0 0 1440 700" preserveAspectRatio="none" aria-hidden="true">
            <path d="M-40 560 Q 720 330 1480 130" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="1.2" strokeDasharray="2 9" />
          </svg>

          <div className="planet-track" aria-hidden="true">
            {SERVICES.map((p, i) => (
              <PlanetCar key={p.code} s={p} i={i} count={SERVICES.length} progress={scrollYProgress} />
            ))}
          </div>

          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={active}
              className="solar-stage"
              custom={dir}
              variants={stageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <div className="planet-info">
                <motion.p className="p-code" {...item(0.06)}>
                  <i className="p-tick" style={{ background: s.accent, boxShadow: `0 0 10px ${s.accent}` }} />
                  {s.code} · <ScrambleIn text={s.planet} style={{ color: s.accent }} />
                </motion.p>

                <KineticTitle text={s.title} />

                <motion.div
                  className="p-divider"
                  style={{ background: `linear-gradient(90deg, ${s.accent}, transparent)` }}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
                />

                <motion.a className="p-cta" href="#contact" {...item(0.62)}>
                  Plan this module <span>→</span>
                  <motion.i
                    initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 0.72, duration: 0.5, ease: EASE }}
                  />
                </motion.a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="solar-rail" aria-hidden="true">
          <div className="rail-line"><motion.i style={{ scaleX: scrollYProgress }} /></div>
          <div className="rail-stops">
            {SERVICES.map((p, i) => (
              <div key={p.planet} className={`stop${i === active ? ' on' : ''}`}>
                <b style={i === active ? { background: p.accent, boxShadow: `0 0 12px ${p.accent}` } : undefined} />
                <span>{p.planet}</span>
              </div>
            ))}
          </div>
          <div className="rail-count">{String(active + 1).padStart(2, '0')} / 08 · scroll to travel</div>
        </div>
      </div>
    </section>
  );
}
