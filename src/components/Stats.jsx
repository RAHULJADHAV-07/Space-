import { useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Reveal from './Reveal.jsx';
import Scramble from './Scramble.jsx';
import { motion as motionStore, prefersReducedMotion } from '../lib/store.js';

const EASE = [0.16, 1, 0.3, 1];

/* Each stat is a full-bleed kinetic row. `pct` only drives the decorative
   fill bar; the printed value is always `value`. */
const STATS = [
  { code: 'TLM-01', value: '08', suffix: '',   label: 'Projects launched',
    desc: 'Shipped to production and holding a stable orbit.',          accent: 'var(--solar)', pct: 0.8  },
  { code: 'TLM-02', value: '03', suffix: '',   label: 'Active clients',
    desc: 'Live missions with an open uplink to ground control.',       accent: 'var(--ion)',   pct: 0.6  },
  { code: 'TLM-03', value: '07', suffix: '',   label: 'Systems maintained',
    desc: 'Monitored, patched and kept nominal around the clock.',      accent: 'var(--solar)', pct: 0.7  },
  { code: 'TLM-04', value: '01', suffix: 'yr', label: 'In orbit',
    desc: 'One full revolution around the sun — and accelerating.',     accent: 'var(--ion)',   pct: 0.45 },
];

/* Strings that scroll across the bottom rail like a live data bus. */
const BUS = [
  'AOS 14:02:41Z', 'DOWNLINK 2.4 Gb/s', 'ATT QUAT NOMINAL', 'PWR BUS 28.1 V',
  'THERM Δ +0.3 K', 'GNC LOCK ✓', 'UPLINK HANDSHAKE OK', 'TELEMETRY FRAME 0x1F4',
  'RANGE 412 km', 'DOPPLER −1.2 kHz', 'PAYLOAD ARMED', 'CMD ECHO VERIFIED',
];

/* ----------------------------------------------------------------------------
   ODOMETER DIGIT — a vertical strip of 0–9; the strip rolls down to the target
   like a launch-countdown split-flap. Each digit lands slightly after the
   previous one for a slot-machine cascade.
---------------------------------------------------------------------------- */
function Digit({ d, delay, go }) {
  const strip = '0123456789'.split('').map((n) => <i key={n}>{n}</i>);
  if (prefersReducedMotion) {
    return (
      <span className="odo">
        <span className="odo__strip" style={{ transform: `translateY(-${d * 10}%)` }}>{strip}</span>
      </span>
    );
  }
  return (
    <span className="odo">
      <motion.span
        className="odo__strip"
        initial={{ y: '0%' }}
        animate={go ? { y: `-${d * 10}%` } : { y: '0%' }}
        transition={{ duration: 1.8, ease: EASE, delay }}
      >
        {strip}
      </motion.span>
    </span>
  );
}

/* One kinetic row: giant odometer number + ghost echo, decoding label, fill
   bar, and an opposing horizontal drift bound to scroll. Odd rows mirror the
   layout so the wall zig-zags down the page. */
function Row({ s, i }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const dir = i % 2 ? 1 : -1;
  const x = useTransform(scrollYProgress, [0, 1], [56 * dir, -56 * dir]);

  return (
    <div ref={ref} className={`kr${i % 2 ? ' kr--flip' : ''}`} style={{ '--accent': s.accent }}>
      <motion.div className="kr__in" style={prefersReducedMotion ? undefined : { x }}>
        <div className="kr__numwrap">
          <span className="kr__ghost" aria-hidden="true">{s.value}{s.suffix}</span>
          <span className="kr__num">
            {s.value.split('').map((d, k) => (
              <Digit key={k} d={+d} delay={0.12 + k * 0.14 + i * 0.06} go={inView} />
            ))}
            {s.suffix && <span className="kr__suffix">{s.suffix}</span>}
          </span>
        </div>

        <div className="kr__meta">
          <span className="kr__code">{s.code}<i aria-hidden="true" /></span>
          <h3 className="kr__lbl"><Scramble text={s.label.toUpperCase()} go={inView} /></h3>
          <p className="kr__desc">{s.desc}</p>
          <span className="kr__bar">
            <motion.i
              initial={prefersReducedMotion ? false : { scaleX: 0 }}
              animate={inView ? { scaleX: s.pct } : undefined}
              transition={{ duration: 1.6, ease: EASE, delay: 0.35 }}
              style={prefersReducedMotion ? { scaleX: s.pct } : undefined}
            />
          </span>
        </div>
      </motion.div>

      <motion.span
        className="kr__line"
        initial={prefersReducedMotion ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 1.2, ease: EASE, delay: 0.1 }}
      />
    </div>
  );
}

export default function Stats() {
  const secRef = useRef(null);

  /* Scroll-velocity skew — the wall shears with scroll speed, same physics as
     the Flight section, so the two read as one system. */
  useEffect(() => {
    if (prefersReducedMotion) return;
    let raf, sk = 0;
    const tick = () => {
      const target = Math.max(-4, Math.min(4, motionStore.velocity * 0.14));
      sk += (target - sk) * 0.1;
      secRef.current?.style.setProperty('--vskew', sk.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="stats" ref={secRef}>
      {/* rotating radar sweep, parked behind the wall */}
      <div className="kr-radar" aria-hidden="true">
        <i /><b /><b /><b />
      </div>

      <div className="sec-head tlm-head">
        <Reveal as="p" variant="left" className="eyebrow">Telemetry</Reveal>
        <Reveal as="h2" variant="left" delay={0.08}>
          Numbers from <span className="solar">mission control</span>
        </Reveal>
        <Reveal as="div" variant="left" delay={0.16} className="tlm-status">
          <span className="tlm-status__dot" /> LIVE FEED
          <em>·</em> LINK STABLE
          <em>·</em> 04 STREAMS
        </Reveal>
      </div>

      <div className="kr-wall">
        {STATS.map((s, i) => <Row key={s.code} s={s} i={i} />)}
      </div>

      {/* scrolling data bus along the bottom rail */}
      <div className="kr-bus" aria-hidden="true">
        <div className="kr-bus__track">
          {[...BUS, ...BUS].map((x, i) => (
            <span key={i} className="kr-bus__item">{x}<em>·</em></span>
          ))}
        </div>
      </div>
    </section>
  );
}
