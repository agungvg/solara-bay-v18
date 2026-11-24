// Solara Bay v18 — people: varied crowd peds, the player, armed guards and a
// downed enemy with a pulsing red ring. Silhouette first, accessories sell it.
import * as THREE from 'three';

const SKINS = [0xf2c89b, 0xd9a066, 0xa06a3c, 0x8a5a30, 0xe8b88a, 0xc98a5a];
const SHIRTS = [0xff5c5c, 0x4fd8ff, 0xffc93c, 0x4fd87d, 0xff8ad8, 0xffffff, 0x2a2a2a, 0xff7a3c, 0x7a68c9];
const PANTS = [0x2a3440, 0x3a3a3a, 0x5a6a8a, 0x8a6a4a, 0xeeeeee];
const HATS = [0xd21f2b, 0xffc93c, 0x2a2a2a, 0xffffff, null, null, null];

function lambert(color) {
  return new THREE.MeshLambertMaterial({ color });
}

// One pedestrian: blocky low-poly body, head, limbs, optional hat / bag / cap.
export function makePed(rng) {
  const ped = new THREE.Group();
  const height = 1.62 + rng() * 0.3;
  const s = height / 1.75;
  const skin = SKINS[Math.floor(rng() * SKINS.length)];
  const shirt = SHIRTS[Math.floor(rng() * SHIRTS.length)];
  const pants = PANTS[Math.floor(rng() * PANTS.length)];
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.3), lambert(shirt));
  torso.position.y = 1.05 * s; torso.castShadow = true;
  ped.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.32), lambert(skin));
  head.position.y = 1.56 * s; head.castShadow = true;
  ped.add(head);
  const hat = HATS[Math.floor(rng() * HATS.length)];
  if (hat !== null) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.12, 10), lambert(hat));
    cap.position.y = 1.78 * s;
    ped.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.2), lambert(hat));
    brim.position.set(0, 1.73 * s, 0.2);
    ped.add(brim);
  } else if (rng() < 0.3) {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.34), lambert(0x1a1a1a));
    hair.position.y = 1.76 * s;
    ped.add(hair);
  }
  for (const sx of [-0.31, 0.31]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.6, 0.16), lambert(shirt));
    arm.position.set(sx, 1.05 * s, 0);
    arm.castShadow = true;
    ped.add(arm);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.2), lambert(pants));
    leg.position.set(sx * 0.55, 0.36 * s, 0);
    leg.castShadow = true;
    ped.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.32), lambert(0x111111));
    shoe.position.set(sx * 0.55, 0.05, 0.04);
    ped.add(shoe);
  }
  if (rng() < 0.3) {
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.26), lambert(0x8a5a30));
    bag.position.set(0.32, 1.0 * s, 0);
    ped.add(bag);
  }
  if (rng() < 0.15) {
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 6, 12), lambert(0xffd75e));
    chain.position.set(0, 1.32 * s, 0.16);
    chain.rotation.x = 0.4;
    ped.add(chain);
  }
  ped.userData.height = height;
  ped.userData.walkPhase = rng() * Math.PI * 2;
  ped.userData.walkSpeed = 0.8 + rng() * 0.9;
  return ped;
}

// The player: orange jacket, dark jeans, backwards cap — readable at distance.
export function makePlayer() {
  const p = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.64, 0.32), lambert(0xff6a1a));
  torso.position.y = 1.06; torso.castShadow = true;
  p.add(torso);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.34), lambert(0xd9a066));
  head.position.y = 1.58; head.castShadow = true;
  p.add(head);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.22, 0.12, 10), lambert(0x1a1a1a));
  cap.position.y = 1.8;
  p.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.2), lambert(0x1a1a1a));
  brim.position.set(0, 1.75, -0.2);
  p.add(brim);
  for (const sx of [-0.32, 0.32]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, 0.17), lambert(0xff6a1a));
    arm.position.set(sx, 1.06, 0);
    arm.castShadow = true;
    p.add(arm);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.64, 0.21), lambert(0x2a3440));
    leg.position.set(sx * 0.55, 0.37, 0);
    leg.castShadow = true;
    p.add(leg);
  }
  // A pistol in the right hand when armed.
  const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.34), lambert(0x111111));
  gun.position.set(0.32, 0.78, 0.2);
  p.add(gun);
  p.userData.gun = gun;
  return p;
}

// Armed guard: dark vest, helmet, rifle.
export function makeGuard() {
  const g = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.64, 0.34), lambert(0x2a3a2a));
  torso.position.y = 1.06; torso.castShadow = true;
  g.add(torso);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.36), lambert(0x1a1a1a));
  vest.position.y = 1.1;
  g.add(vest);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.32), lambert(0xc98a5a));
  head.position.y = 1.56; head.castShadow = true;
  g.add(head);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0x2a3a2a));
  helmet.position.y = 1.62;
  g.add(helmet);
  for (const sx of [-0.32, 0.32]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.62, 0.17), lambert(0x2a3a2a));
    arm.position.set(sx, 1.06, 0);
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.64, 0.21), lambert(0x1a1a1a));
    leg.position.set(sx * 0.55, 0.37, 0);
    g.add(leg);
  }
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 1.0), lambert(0x111111));
  rifle.position.set(0.3, 1.0, 0.35);
  rifle.rotation.x = 0.3;
  g.add(rifle);
  return g;
}

// Downed enemy lying on the ground with a pulsing red ring.
export function makeDowned() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 1.7), lambert(0x8a2a2a));
  body.position.y = 0.16; body.castShadow = true;
  g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), lambert(0xd9a066));
  head.position.set(0, 0.16, 1.0);
  g.add(head);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.7), lambert(0x8a2a2a));
  arm.position.set(0.4, 0.12, 0.6);
  arm.rotation.z = 0.5;
  g.add(arm);
  const ringGeo = new THREE.RingGeometry(1.1, 1.45, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  g.add(ring);
  g.userData.ring = ring;
  g.userData.ringMat = ringMat;
  return g;
}

export function pulseDowned(downed, time) {
  const s = 1 + Math.sin(time * 4) * 0.12;
  downed.userData.ring.scale.set(s, s, 1);
  downed.userData.ringMat.opacity = 0.55 + Math.sin(time * 4) * 0.3;
}
