import * as THREE from 'three';

/* Procedural back-view astronaut (glossy suit). Returns the group + parts we animate. */
export function buildAstronaut() {
  const astro = new THREE.Group();

  const suit = new THREE.MeshPhysicalMaterial({ color: 0x191a22, metalness: .85, roughness: .32, clearcoat: 1, clearcoatRoughness: .25 });
  const suit2 = new THREE.MeshPhysicalMaterial({ color: 0x23242e, metalness: .8, roughness: .4, clearcoat: .8, clearcoatRoughness: .3 });
  const strap = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: .5, metalness: .6 });
  const visorM = new THREE.MeshPhysicalMaterial({ color: 0x0c0d14, metalness: 1, roughness: .08, clearcoat: 1 });

  function add(geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, parent = astro) {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m;
  }

  /* helmet */
  const head = new THREE.Group(); head.position.set(0, 1.52, 0);
  add(new THREE.SphereGeometry(.3, 48, 48), visorM, 0, 0, 0, 0, 0, 0, head);
  add(new THREE.BoxGeometry(.1, .14, .18), suit2, -.3, 0, 0, 0, 0, 0, head);
  add(new THREE.BoxGeometry(.1, .14, .18), suit2, .3, 0, 0, 0, 0, 0, head);
  astro.add(head);

  /* neck + torso */
  add(new THREE.CylinderGeometry(.13, .16, .14, 24), suit, 0, 1.3, 0);
  const torso = add(new THREE.CylinderGeometry(.34, .27, .78, 32), suit, 0, .86, 0);
  add(new THREE.SphereGeometry(.34, 32, 32), suit, 0, 1.2, 0).scale.set(1, .6, .85);

  /* backpack faces camera */
  add(new THREE.BoxGeometry(.5, .62, .22), suit2, 0, .95, .3);
  add(new THREE.BoxGeometry(.34, .1, .05), strap, 0, 1.16, .43);
  add(new THREE.BoxGeometry(.34, .1, .05), strap, 0, .78, .43);

  /* belt + hips */
  add(new THREE.TorusGeometry(.285, .045, 12, 40), strap, 0, .46, 0, Math.PI / 2);
  add(new THREE.SphereGeometry(.3, 32, 32), suit, 0, .36, 0).scale.set(1, .7, .9);

  /* arms */
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-.36, 1.16, 0); armR.position.set(.36, 1.16, 0);
  [armL, armR].forEach((arm) => {
    add(new THREE.SphereGeometry(.14, 24, 24), suit, 0, 0, 0, 0, 0, 0, arm);
    add(new THREE.CylinderGeometry(.105, .09, .52, 20), suit, 0, -.3, 0, 0, 0, 0, arm);
    add(new THREE.SphereGeometry(.095, 20, 20), suit2, 0, -.58, 0, 0, 0, 0, arm);
    add(new THREE.CylinderGeometry(.085, .075, .46, 20), suit, 0, -.82, 0, 0, 0, 0, arm);
    add(new THREE.SphereGeometry(.1, 20, 20), suit2, 0, -1.06, 0, 0, 0, 0, arm);
  });
  armL.rotation.z = .18; armR.rotation.z = -.18;
  astro.add(armL, armR);

  /* legs */
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-.15, .32, 0); legR.position.set(.15, .32, 0);
  [[legL, 1], [legR, -1]].forEach(([leg, s]) => {
    add(new THREE.CylinderGeometry(.125, .105, .55, 20), suit, 0, -.3, 0, 0, 0, 0, leg);
    add(new THREE.TorusGeometry(.115, .03, 10, 30), strap, 0, -.44, 0, Math.PI / 2, 0, 0, leg);
    add(new THREE.SphereGeometry(.105, 20, 20), suit2, 0, -.6, 0, 0, 0, 0, leg);
    add(new THREE.CylinderGeometry(.1, .115, .52, 20), suit, 0, -.88, 0, 0, 0, 0, leg);
    add(new THREE.BoxGeometry(.2, .16, .3), suit2, 0, -1.2, .05, 0, 0, 0, leg);
    leg.rotation.z = s * .04;
  });
  astro.add(legL, legR);

  astro.rotation.y = Math.PI; // back to camera, facing Earth

  return { astro, head, torso, armL, armR, legL, legR };
}
