import * as THREE from 'three';

export const EARTH_R = 5.6;
export const BASE_ROT_Y = Math.PI / 2 - 2 * Math.PI * ((79 + 180) / 360); // India faces camera

export const INDIA = [
  [68, 24], [69.5, 22], [70.5, 20.8], [72.5, 19], [73.5, 15.5], [74.5, 12.5], [76.5, 8.2], [78, 8.2],
  [79.8, 10.5], [80.3, 13.2], [82, 16.5], [84.8, 19.2], [87, 21.5], [89, 21.8], [92, 22], [93.5, 24], [92, 25.5],
  [89.5, 26.5], [88, 27], [84, 27.3], [80.5, 29.5], [78.5, 31.5], [76.5, 33], [74.5, 34], [73, 32], [71.5, 29], [69.5, 26.5],
];

export function pointInPoly(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > p[1]) !== (yj > p[1])) && (p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

/* local point on earth sphere for lon/lat (matches SphereGeometry mapping) */
export function geoToLocal(lon, lat, R) {
  const u = (lon + 180) / 360, v = (90 - lat) / 180;
  const phi = 2 * Math.PI * u, theta = Math.PI * v;
  return new THREE.Vector3(
    -R * Math.cos(phi) * Math.sin(theta),
    R * Math.cos(theta),
    R * Math.sin(phi) * Math.sin(theta)
  );
}

/* ---- monochrome night-earth texture ---- */
export function makeEarthTexture() {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const px = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];

  x.fillStyle = '#06070c'; x.fillRect(0, 0, W, H);

  function blob(lon, lat, rw, rh, a) {
    const [cx, cy] = px(lon, lat);
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rw, rh));
    gr.addColorStop(0, `rgba(48,52,62,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.save(); x.translate(cx, cy); x.scale(rw / Math.max(rw, rh), rh / Math.max(rw, rh)); x.translate(-cx, -cy);
    x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, Math.max(rw, rh), 0, 7); x.fill(); x.restore();
  }
  blob(80, 25, 250, 170, .9); blob(105, 38, 300, 190, .85); blob(45, 25, 200, 150, .7);
  blob(20, 5, 240, 230, .7); blob(18, 50, 270, 140, .75); blob(135, -25, 180, 130, .6);
  blob(-95, 40, 300, 180, .7); blob(-60, -12, 200, 220, .6);

  /* India landmass slightly brighter */
  x.beginPath();
  INDIA.forEach((pt, i) => { const [ax, ay] = px(pt[0], pt[1]); i ? x.lineTo(ax, ay) : x.moveTo(ax, ay); });
  x.closePath(); x.fillStyle = 'rgba(70,74,86,.95)'; x.fill();

  /* world city lights */
  function dots(l0, l1, a0, a1, n, bright, poly) {
    for (let i = 0; i < n; i++) {
      const lon = l0 + Math.random() * (l1 - l0), lat = a0 + Math.random() * (a1 - a0);
      if (poly && !pointInPoly([lon, lat], poly)) continue;
      const [ax, ay] = px(lon, lat);
      const r = .5 + Math.random() * 1.1;
      x.shadowColor = '#fff'; x.shadowBlur = r * 2.6;
      x.fillStyle = `rgba(255,255,255,${bright * (0.5 + Math.random() * 0.5)})`;
      x.beginPath(); x.arc(ax, ay, r, 0, 7); x.fill();
    }
  }
  dots(68, 94, 8, 34, 2600, .95, INDIA);
  dots(95, 145, 18, 46, 1100, .5);
  dots(-10, 40, 36, 58, 900, .5);
  dots(35, 60, 14, 40, 420, .45);
  dots(-125, -70, 25, 48, 800, .45);
  dots(112, 153, -38, -12, 200, .4);

  const metros = [[72.8, 19.1, 9], [77.2, 28.6, 10], [88.4, 22.6, 8], [80.3, 13.1, 8], [77.6, 13, 8], [78.5, 17.4, 8], [72.6, 23, 7], [75.8, 26.9, 6], [80.9, 26.8, 6], [73.8, 18.5, 7], [85.8, 20.3, 5], [76.3, 9.9, 5]];
  metros.forEach(([lon, lat, r]) => {
    const [ax, ay] = px(lon, lat);
    const gr = x.createRadialGradient(ax, ay, 0, ax, ay, r * 3);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.shadowBlur = 0; x.fillStyle = gr;
    x.beginPath(); x.arc(ax, ay, r * 3, 0, 7); x.fill();
  });
  x.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const atmosphereMaterial = () => new THREE.ShaderMaterial({
  transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
  vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `varying vec3 vN;void main(){float i=pow(.6-dot(vN,vec3(0,0,1.)),4.0);gl_FragColor=vec4(.85,.9,1.,1.)*i*1.1;}`,
});

/* Build the full earth group; returns the group plus refs we animate.
   Starts on the procedural texture, then upgrades to the real NASA Blue Marble
   maps (day color + normal) bundled in /public/textures. */
export function buildEarth() {
  const group = new THREE.Group();

  const earthMat = new THREE.MeshStandardMaterial({ map: makeEarthTexture(), roughness: .95, metalness: .05 });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 128, 128), earthMat);
  group.add(earth);

  const loader = new THREE.TextureLoader();
  loader.load(`${import.meta.env.BASE_URL}textures/earth-day.jpg`, (day) => {
    day.colorSpace = THREE.SRGBColorSpace;
    earthMat.map = day;
    earthMat.roughness = 0.78;
    earthMat.metalness = 0.0;
    earthMat.needsUpdate = true;
  });
  loader.load(`${import.meta.env.BASE_URL}textures/earth-normal.jpg`, (n) => {
    earthMat.normalMap = n;
    earthMat.normalScale = new THREE.Vector2(0.7, 0.7);
    earthMat.needsUpdate = true;
  });

  const atmo = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.03, 128, 128), atmosphereMaterial());
  group.add(atmo);

  // Orient the dome so India sits on its visible crest. The globe's centre is
  // far below the viewport, so the camera-facing point is off-screen — what the
  // viewer actually sees is the top of the sphere tilted slightly toward the
  // camera: direction ≈ (0, 1, 0.4) from the globe's centre.
  // The shortest-arc rotation alone leaves the north pole facing the camera
  // (the map reads upside-down), so roll 180° around the crest axis to put
  // north away from the viewer and make India read correctly.
  const indiaDir = geoToLocal(79, 22, 1).normalize();
  const crestDir = new THREE.Vector3(0, 1, 0.4).normalize();
  group.quaternion.setFromUnitVectors(indiaDir, crestDir);
  const roll = new THREE.Quaternion().setFromAxisAngle(crestDir, Math.PI);
  group.quaternion.premultiply(roll);
  group.position.set(0, -6.55, 0);

  return { group, earth };
}
