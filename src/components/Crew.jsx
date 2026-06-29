import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  motion, AnimatePresence, useScroll, useMotionValueEvent,
  useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import Reveal from './Reveal.jsx';
import Scramble from './Scramble.jsx';
import { motion as store, prefersReducedMotion } from '../lib/store.js';

const EASE = [0.16, 1, 0.3, 1];
/* Official NASA 3D Resources spacesuits (public domain), meshopt-compressed
   to ~300 KB each — one distinct suit per crew member. These models face -Z
   natively, so each gets a yaw correction to look at the camera. */
const SUITS = [
  { url: '/models/gemini.glb', yaw: Math.PI },
  { url: '/models/mark-iii.glb', yaw: Math.PI },
  { url: '/models/mercury.glb', yaw: Math.PI },
];
SUITS.forEach((s) => useGLTF.preload(s.url));

/* ----------------------------------------------------------------------------
   CREW MANIFEST — two real members + one open seat that recruits the visitor.
   Swap names / initials / dossier values for the real team.
---------------------------------------------------------------------------- */
const CREW = [
  {
    tag: 'CDR', initials: 'C1', accent: 'var(--solar)', hex: '#FFB347',
    name: 'Crew Member One',
    role: 'Founder & Mission Commander',
    bio: 'Sets the trajectory — strategy, vision, and the final call before every launch.',
    dossier: [
      ['SPECIALTY', 'Strategy · Product'],
      ['CLEARANCE', 'LEVEL 5'],
      ['MISSIONS', '08 LAUNCHES'],
    ],
    id: 'AVT-CDR-001',
  },
  {
    tag: 'ENG', initials: 'C2', accent: 'var(--ion)', hex: '#7B8CFF',
    name: 'Crew Member Two',
    role: 'Lead Engineer',
    bio: 'Builds the systems that hold under load — architecture, code, the hard parts.',
    dossier: [
      ['SPECIALTY', 'Architecture · Web'],
      ['CLEARANCE', 'LEVEL 5'],
      ['STACK', 'React · 3D · Cloud'],
    ],
    id: 'AVT-ENG-002',
  },
  {
    tag: 'YOU', initials: '+', accent: '#EDEDF2', hex: '#EDEDF2',
    name: 'This Could Be You',
    role: 'Open Seat · Mission Specialist',
    bio: "We keep one seat open for the right client or collaborator. Hail us and let's plan your launch.",
    dossier: [
      ['STATUS', 'RECRUITING'],
      ['SEAT', 'MS-3 · OPEN'],
      ['NEXT LAUNCH', 'BOOKING NOW'],
    ],
    id: 'AVT-OPN-003',
  },
];

const BARS = [3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 5, 2, 1, 3, 1, 2, 4, 1, 2, 1, 3];
const DIM_COL = new THREE.Color('#2b3a5e');

/* ----------------------------------------------------------------------------
   ASTRO — one NASA spacesuit per crew member (Gemini / Mark III / Mercury),
   floating weightless across the open section.
   Anchors are fractions of the live viewport, so the three of them spread
   across the ENTIRE width on any screen (and stack vertically on phones).
   Clicking the suit or the callsign tag hails them; the hailed member drifts
   toward the camera while the others recede and dim.
---------------------------------------------------------------------------- */
function Astro({ m, i, active, onSelect }) {
  const { scene } = useGLTF(SUITS[i].url);
  const model = useMemo(() => {
    const c = scene.clone(true);
    c.rotation.y = SUITS[i].yaw;
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const size = box.getSize(new THREE.Vector3());
    c.scale.setScalar(2.3 / size.y); // normalise to ~2.3 units tall
    const box2 = new THREE.Box3().setFromObject(c);
    const centre = box2.getCenter(new THREE.Vector3());
    c.position.sub(centre); // centre on the origin
    return c;
  }, [scene]);

  const group = useRef();
  const inner = useRef();
  const rim = useRef();
  const [hover, setHover] = useState(false);
  const accent = useMemo(() => new THREE.Color(m.hex), [m.hex]);
  const lean = (i - 1) * -0.35; // outer two angle in toward the centre

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const t = state.clock.elapsedTime + i * 2.1; // de-phase the floats
    const g = group.current;
    if (!g) return;
    const isOn = active === i;

    // anchors as fractions of the live viewport → full-width spread.
    // In portrait the canvas is very tall, which inflates world→px scale, so
    // size the suits off the viewport WIDTH and stack them in a loose zigzag.
    const vp = state.viewport;
    const vertical = vp.aspect < 0.9;
    const fit = vertical ? Math.min(1, (vp.width * 0.58) / 2.3) : 1;
    const ax = vertical ? (i - 1) * vp.width * 0.16 : (i - 1) * vp.width * 0.36;
    const ay = vertical
      ? (1 - i) * (2.3 * fit) * 1.28 + vp.height * 0.03
      : [0.5, -0.2, 0.42][i];

    // weightless drift toward the slowly wandering anchor
    const tx = ax + Math.sin(t * 0.4) * 0.14 + store.px * 0.25;
    const ty = ay + Math.sin(t * 0.7) * 0.18 + store.py * 0.12;
    const tz = isOn ? 0.9 : -0.6;
    g.position.x += (tx - g.position.x) * dt * 2;
    g.position.y += (ty - g.position.y) * dt * 2;
    g.position.z += (tz - g.position.z) * dt * 2.4;

    const s = fit * (isOn ? 1.12 : 0.86) * (hover ? 1.04 : 1);
    g.scale.setScalar(g.scale.x + (s - g.scale.x) * dt * 3.5);

    // slow weightless tumble
    if (inner.current) {
      inner.current.rotation.y = lean + Math.sin(t * 0.3) * 0.22;
      inner.current.rotation.z = Math.sin(t * 0.5) * 0.1;
      inner.current.rotation.x = Math.sin(t * 0.45) * 0.07;
    }

    if (rim.current) {
      rim.current.color.lerp(isOn || hover ? accent : DIM_COL, dt * 4);
      const ti = isOn ? 3 : hover ? 2 : 0.9;
      rim.current.intensity += (ti - rim.current.intensity) * dt * 4;
      rim.current.position.set(g.position.x + 1.4, g.position.y + 1.2, 2.6);
    }
  });

  return (
    <group ref={group} position={[(i - 1) * 2.4, 0, -0.6]}>
      <group
        ref={inner}
        onClick={(e) => { e.stopPropagation(); onSelect(i); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
        onPointerOut={() => setHover(false)}
      >
        <primitive object={model} />
      </group>
      <pointLight ref={rim} intensity={0.9} distance={9} />

      {/* floating callsign tag — also a hail button */}
      <Html center position={[0, -1.6, 0]} zIndexRange={[10, 0]}>
        <button
          className={`astro-tag${active === i ? ' on' : ''}${hover ? ' hot' : ''}`}
          style={{ '--accent': m.accent }}
          onClick={() => onSelect(i)}
        >
          <i /> {m.tag}
        </button>
      </Html>
    </group>
  );
}

function Stage({ active, onSelect }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={prefersReducedMotion ? 'demand' : 'always'}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} />
      <directionalLight position={[-5, 2, -3]} intensity={1.2} color="#7B8CFF" />
      {/* front fill + earthshine from below, like an orbital photo */}
      <pointLight position={[0, 0.6, 5]} intensity={1.3} distance={16} color="#cfd6ff" />
      <pointLight position={[0, -3.5, 1.5]} intensity={1.6} distance={18} color="#3f6fd9" />
      <Suspense fallback={null}>
        {CREW.map((m, i) => (
          <Astro key={m.tag} m={m} i={i} active={active} onSelect={onSelect} />
        ))}
      </Suspense>
    </Canvas>
  );
}

/* ----------------------------------------------------------------------------
   LOWER THIRD — broadcast-style holo dossier of whoever is hailed. Full-width
   glass bar: portrait | identity | dossier | credentials. Keeps the holo foil,
   glare and scanlines; flips on every hail change.
---------------------------------------------------------------------------- */
function LowerThird({ m }) {
  const ref = useRef(null);
  const rawX = useMotionValue(0), rawY = useMotionValue(0);
  const rx = useSpring(rawX, { stiffness: 170, damping: 16 });
  const ry = useSpring(rawY, { stiffness: 170, damping: 16 });

  const onMove = (e) => {
    if (prefersReducedMotion || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    rawX.set(-ny * 6);
    rawY.set(nx * 4);
    ref.current.style.setProperty('--gx', nx.toFixed(3));
    ref.current.style.setProperty('--gy', ny.toFixed(3));
  };
  const onLeave = () => {
    rawX.set(0); rawY.set(0);
    ref.current?.style.setProperty('--gx', '0');
    ref.current?.style.setProperty('--gy', '0');
  };

  return (
    <motion.article
      ref={ref}
      className="l3"
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1400, '--accent': m.accent }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="badge__holo" aria-hidden="true" />
      <span className="badge__glare" aria-hidden="true" />
      <span className="badge__scan" aria-hidden="true" />

      <div className="badge__portrait" aria-hidden="true">
        <span className="badge__ring badge__ring--1" />
        <span className="badge__ring badge__ring--2" />
        <span className="badge__sweepring" />
        <span className="badge__disc"><span>{m.initials}</span></span>
      </div>

      <div className="l3__ident">
        <h3 className="badge__name"><Scramble text={m.name} duration={1000} /></h3>
        <p className="badge__role">{m.role}</p>
        <p className="badge__bio">{m.bio}</p>
      </div>

      <dl className="badge__dossier">
        {m.dossier.map(([k, v]) => (
          <div className="badge__row" key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>

      <div className="l3__side">
        <span className="badge__tag">{m.tag}</span>
        <span className="badge__chip" aria-hidden="true" />
        <span className="badge__barcode" aria-hidden="true">
          {BARS.map((w, b) => <i key={b} style={{ width: w }} />)}
        </span>
        <span className="badge__id">{m.id}<em>EVA READY</em></span>
      </div>
    </motion.article>
  );
}

export default function Crew() {
  const secRef = useRef(null);
  const [active, setActive] = useState(0);
  /* progress value at the moment of a manual hail; scrolling resumes control
     once the user has moved a meaningful distance past that point */
  const manualAt = useRef(null);
  const m = CREW[active];

  const { scrollYProgress } = useScroll({ target: secRef, offset: ['start 0.85', 'end 0.5'] });
  const ghostX = useTransform(scrollYProgress, [0, 1], ['4%', '-14%']);

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (prefersReducedMotion) return;
    if (manualAt.current != null) {
      if (Math.abs(p - manualAt.current) < 0.16) return; // honour the click for a beat
      manualAt.current = null;
    }
    // three bands with dead zones so the handoff never flutters
    setActive((prev) => {
      if (p < 0.42) return 0;
      if (p > 0.48 && p < 0.68) return 1;
      if (p > 0.74) return 2;
      return prev;
    });
  });

  const select = (i) => { manualAt.current = scrollYProgress.get(); setActive(i); };

  return (
    <section id="crew" ref={secRef}>
      {/* full-bleed EVA field — the astronauts float across the whole section */}
      <div className="crew-space">
        <Stage active={active} onSelect={select} />
      </div>
      <div className="crew-horizon" aria-hidden="true" />

      {/* giant outlined word drifting behind the crew */}
      <motion.span
        className="crew-ghost"
        style={prefersReducedMotion ? undefined : { x: ghostX }}
        aria-hidden="true"
      >
        EXPEDITION
      </motion.span>

      <div className="sec-head crew-head">
        <Reveal as="p" variant="left" className="eyebrow">Flight crew · EVA team</Reveal>
        <Reveal as="h2" variant="left" delay={0.08}>
          The humans behind <span className="solar">mission control</span>
        </Reveal>
        <Reveal as="div" variant="left" delay={0.16} className="tlm-status">
          <span className="tlm-status__dot" /> 2 SOULS ON BOARD
          <em>·</em> 1 SEAT OPEN
          <em>·</em> UPLINK STABLE
        </Reveal>
      </div>

      {/* open space where the crew floats */}
      <div className="crew-field" aria-hidden="true" />

      <div className="crew-hudbar" aria-hidden="true">
        <span><i className="eva__rec" /> EVA FEED · LIVE</span>
        <span className="crew-hudbar__hint">CLICK AN ASTRONAUT TO HAIL <em>·</em> OR JUST KEEP SCROLLING</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
            style={{ color: m.accent }}
          >
            TARGET LOCK · {m.tag}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* broadcast lower-third dossier — flips when the hail changes */}
      <div className="l3-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={prefersReducedMotion ? false : { rotateX: -55, y: 34, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { rotateX: 40, y: -22, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            style={{ transformPerspective: 1400 }}
          >
            <LowerThird m={m} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
