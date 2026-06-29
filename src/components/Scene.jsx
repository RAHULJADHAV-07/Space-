import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { buildEarth, EARTH_R, geoToLocal } from '../lib/earth.js';
import { makeStars, buildComets } from '../lib/stars.js';
import { motion, prefersReducedMotion } from '../lib/store.js';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 760;

/* Procedural environment so reflective materials (the astronaut visor/suit) catch
   a soft gradient + horizon glow instead of rendering dead black. */
function applyEnvironment(gl, scene) {
  const W = 512, H = 256;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0a0c18');   // deep space top
  g.addColorStop(0.55, '#05060c');
  g.addColorStop(0.78, '#1a2138'); // atmosphere band
  g.addColorStop(1, '#2b3a5e');    // earthshine from below
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // a couple of soft highlights for specular interest
  for (const [cx, cy, r, a] of [[140, 70, 60, .5], [380, 110, 90, .35]]) {
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, `rgba(255,255,255,${a})`); rg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(gl);
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
}

function Contents() {
  const { camera } = useThree();

  const world = useMemo(() => {
    const { group: earthGroup, earth } = buildEarth();

    const stars1 = makeStars(1100, .16, .85);
    const stars2 = makeStars(260, .26, .5);
    const comets = buildComets(isMobile ? 3 : 6);

    // anchor for the India / Mumbai callout. Kept at scene root; each frame we
    // copy India's local point and push it through earth's world matrix so the
    // <Html> tag tracks the spinning globe without being re-parented.
    const anchor = new THREE.Object3D();
    const indiaLocal = geoToLocal(76, 21, EARTH_R * 1.02);

    // base orientation (India facing camera) we tilt around for parallax
    const baseQuat = earthGroup.quaternion.clone();

    return { earthGroup, earth, stars1, stars2, comets, anchor, indiaLocal, baseQuat };
  }, []);

  const sm = useRef({ scroll: 0, px: 0, py: 0 });
  const qTmp = useRef(new THREE.Quaternion());
  const eTmp = useRef(new THREE.Euler());

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const t = state.clock.elapsedTime;
    const { earth, stars1, stars2, comets, earthGroup } = world;

    // smoothing
    sm.current.scroll += (motion.scrollY - sm.current.scroll) * .06;
    sm.current.px += (motion.px - sm.current.px) * .05;
    sm.current.py += (motion.py - sm.current.py) * .05;
    const { scroll, px, py } = sm.current;
    const sp = scroll / window.innerHeight;

    // earth — gentle spin around the pole (keeps India roughly centred) + scroll sink.
    earth.rotation.y = Math.sin(t * .04) * .006 + sp * .08;
    earthGroup.position.y = -6.55 - sp * 3.2;
    // parallax tilt applied on top of the India-facing base orientation
    eTmp.current.set(py * 0.02, px * 0.03, 0);
    qTmp.current.setFromEuler(eTmp.current);
    earthGroup.quaternion.copy(world.baseQuat).premultiply(qTmp.current);

    // stars + comets + camera parallax
    stars1.rotation.y = t * .003 + px * .025;
    stars1.rotation.x = py * .015 - sp * .04;
    stars2.rotation.y = -t * .005 + px * .04;
    comets.update(dt);

    camera.position.x = px * .22;
    camera.position.y = -py * .14;
    camera.lookAt(0, -.4, 0);

    // track India's surface point in world space for the callout tag
    earth.updateMatrixWorld();
    world.anchor.position.copy(world.indiaLocal);
    earth.localToWorld(world.anchor.position);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 6, 5]} intensity={1.1} />
      <directionalLight position={[-6, 3, -4]} intensity={1.6} />
      <directionalLight position={[6, 3, -4]} intensity={1.6} />
      <pointLight position={[0, 0, 5]} intensity={0.5} distance={30} />

      <primitive object={world.earthGroup} />
      <primitive object={world.stars1} />
      <primitive object={world.stars2} />
      <primitive object={world.comets.group} />

      <primitive object={world.anchor}>
        <Html center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="globe-pin">
            <span className="globe-pin__dot" />
            <span className="globe-pin__tag">
              Mumbai, India
              <small>HOME BASE · 19.07°N 72.87°E</small>
            </span>
          </div>
        </Html>
      </primitive>
    </>
  );
}

export default function Scene() {
  return (
    <div id="webgl" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={prefersReducedMotion ? 'demand' : 'always'}
        onCreated={({ gl, scene }) => { gl.setClearColor(0x000000, 0); applyEnvironment(gl, scene); }}
      >
        <Contents />
      </Canvas>
    </div>
  );
}
