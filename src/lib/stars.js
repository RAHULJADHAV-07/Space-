import * as THREE from 'three';

export function makeStars(count, size, opacity) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 40 + Math.random() * 80, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: true, transparent: true, opacity }));
}

/* Shooting-star streaks that periodically fire across the sky. */
export function buildComets(n = 5) {
  const group = new THREE.Group();
  const comets = [];
  const mat = () => new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending });

  for (let i = 0; i < n; i++) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const line = new THREE.Line(geo, mat());
    group.add(line);
    comets.push({ line, t: -Math.random() * 8, speed: 0, dir: new THREE.Vector3(), start: new THREE.Vector3(), life: 0 });
  }

  function reset(c) {
    c.start.set((Math.random() - .5) * 60, 18 + Math.random() * 22, -20 - Math.random() * 30);
    c.dir.set(-.6 - Math.random() * .4, -.5 - Math.random() * .3, .15).normalize();
    c.speed = 26 + Math.random() * 18;
    c.life = 1.1 + Math.random() * .7;
    c.t = 0;
  }

  function update(dt) {
    comets.forEach((c) => {
      c.t += dt;
      if (c.t < 0) return;
      if (c.t === 0 || c.life === 0) reset(c);
      const p = c.t / c.life;
      if (p >= 1) { c.t = -(1.5 + Math.random() * 6); c.line.material.opacity = 0; return; }
      const head = c.start.clone().addScaledVector(c.dir, c.speed * c.t);
      const tail = head.clone().addScaledVector(c.dir, -2.4 - c.speed * 0.05);
      const arr = c.line.geometry.attributes.position.array;
      arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
      arr[3] = tail.x; arr[4] = tail.y; arr[5] = tail.z;
      c.line.geometry.attributes.position.needsUpdate = true;
      c.line.material.opacity = Math.sin(p * Math.PI) * .9;
    });
  }

  return { group, update };
}
