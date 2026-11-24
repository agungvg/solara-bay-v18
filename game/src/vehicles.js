// Solara Bay v18 — vehicles: hero sports cars, KPD police sedans with door
// lettering, traffic, scooter, tank, and the Air One helicopter.
import * as THREE from 'three';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function policeDoorTexture() {
  return canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = '#10141c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.font = '900 52px Arial, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('POLICE', w / 2, h / 2 - 8);
    g.font = '700 26px Arial, sans-serif';
    g.fillStyle = '#ffc93c';
    g.fillText('911 • KPD', w / 2, h / 2 + 34);
  });
}

function lambert(color, extra = {}) {
  return new THREE.MeshLambertMaterial({ color, ...extra });
}

function wheelMesh(r = 0.38) {
  const g = new THREE.Group();
  const tyre = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 14), lambert(0x141414));
  tyre.rotation.z = Math.PI / 2;
  tyre.castShadow = true;
  g.add(tyre);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.32, 10), lambert(0xcccccc));
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  return g;
}

// Rounded hero sports car: long hood, arched roof, flared fenders, spoiler.
export function makeHeroCar(color = 0xd21f2b) {
  const car = new THREE.Group();
  const body = lambert(color);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 4.7), body);
  lower.position.y = 0.55; lower.castShadow = true;
  car.add(lower);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.28, 1.3), body);
  hood.position.set(0, 0.9, -1.55);
  hood.castShadow = true;
  car.add(hood);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 2.1), lambert(0x14181f));
  cabin.position.set(0, 1.05, 0.35);
  cabin.castShadow = true;
  car.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 1.9), body);
  roof.position.set(0, 1.32, 0.4);
  roof.castShadow = true;
  car.add(roof);
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.4), lambert(0x141414));
  spoiler.position.set(0, 1.15, 2.25);
  car.add(spoiler);
  for (const sx of [-0.7, 0.7]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), lambert(0x141414));
    strut.position.set(sx, 0.98, 2.25);
    car.add(strut);
  }
  // Headlights + taillights.
  for (const sx of [-0.65, 0.65]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
    head.position.set(sx, 0.72, -2.36);
    car.add(head);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    tail.position.set(sx, 0.72, 2.36);
    car.add(tail);
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 0.08), lambert(0x111111));
  grille.position.set(0, 0.55, -2.36);
  car.add(grille);
  // Fender flares.
  for (const [wx, wz] of [[-0.95, -1.5], [0.95, -1.5], [-0.95, 1.5], [0.95, 1.5]]) {
    const flare = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.9), body);
    flare.position.set(wx, 0.62, wz);
    car.add(flare);
    const wheel = wheelMesh(0.38);
    wheel.position.set(wx, 0.38, wz);
    car.add(wheel);
  }
  car.userData.wheels = car.children.filter((c) => c.children.length === 2);
  return car;
}

export function makePoliceCar() {
  const car = new THREE.Group();
  const bodyMat = lambert(0xf2f2f2);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 4.6), bodyMat);
  lower.position.y = 0.6; lower.castShadow = true;
  car.add(lower);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 2.2), lambert(0x1a2028));
  cabin.position.set(0, 1.1, 0.3);
  cabin.castShadow = true;
  car.add(cabin);
  // Black hood + trunk (KPD livery) and POLICE door lettering.
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.1, 1.2), lambert(0x10141c));
  hood.position.set(0, 0.92, -1.6);
  car.add(hood);
  const doorTex = policeDoorTexture();
  for (const sx of [-1.01, 1.01]) {
    const door = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 0.75),
      new THREE.MeshBasicMaterial({ map: doorTex }),
    );
    door.position.set(sx, 0.62, 0.3);
    door.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    car.add(door);
  }
  // Light bar: red + blue.
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.16, 0.4), lambert(0x222222));
  bar.position.set(0, 1.45, 0.3);
  car.add(bar);
  const red = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  red.position.set(-0.32, 1.47, 0.3);
  car.add(red);
  const blue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.18, 0.42), new THREE.MeshBasicMaterial({ color: 0x2266ff }));
  blue.position.set(0.32, 1.47, 0.3);
  car.add(blue);
  car.userData.lightRed = red;
  car.userData.lightBlue = blue;
  // Push bar on the nose.
  const push = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.15), lambert(0x333333));
  push.position.set(0, 0.55, -2.35);
  car.add(push);
  for (const sx of [-0.65, 0.65]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
    head.position.set(sx, 0.75, -2.31);
    car.add(head);
  }
  for (const [wx, wz] of [[-0.95, -1.5], [0.95, -1.5], [-0.95, 1.5], [0.95, 1.5]]) {
    const wheel = wheelMesh(0.38);
    wheel.position.set(wx, 0.38, wz);
    car.add(wheel);
  }
  return car;
}

export function makeTrafficCar(color) {
  const car = new THREE.Group();
  const body = lambert(color);
  const lower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.2), body);
  lower.position.y = 0.55; lower.castShadow = true;
  car.add(lower);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), lambert(0x2a3440));
  cabin.position.set(0, 1.0, 0.2);
  cabin.castShadow = true;
  car.add(cabin);
  for (const sx of [-0.6, 0.6]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
    head.position.set(sx, 0.7, -2.11);
    car.add(head);
  }
  for (const [wx, wz] of [[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]]) {
    const wheel = wheelMesh(0.36);
    wheel.position.set(wx, 0.36, wz);
    car.add(wheel);
  }
  return car;
}

export function makeScooter(color = 0xffc93c) {
  const s = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 1.7), lambert(color));
  body.position.y = 0.55; body.castShadow = true;
  s.add(body);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.8), lambert(0x222222));
  seat.position.set(0, 0.85, 0.35);
  s.add(seat);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.1), lambert(0x9ad8ff));
  shield.position.set(0, 1.0, -0.8);
  shield.rotation.x = -0.3;
  s.add(shield);
  for (const wz of [-0.65, 0.65]) {
    const wheel = wheelMesh(0.26);
    wheel.position.set(0, 0.26, wz);
    s.add(wheel);
  }
  return s;
}

export function makeTank() {
  const t = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.0, 5.2), lambert(0x4a5a3a));
  hull.position.y = 0.9; hull.castShadow = true;
  t.add(hull);
  const turret = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.8, 2.4), lambert(0x55663f));
  turret.position.set(0, 1.75, 0.2); turret.castShadow = true;
  t.add(turret);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 3.2, 10), lambert(0x333333));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 1.8, -2.6);
  t.add(barrel);
  for (const sx of [-1.7, 1.7]) {
    const track = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 5.4), lambert(0x222222));
    track.position.set(sx, 0.5, 0);
    track.castShadow = true;
    t.add(track);
  }
  return t;
}

export function makeHeli() {
  const h = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 5.2), lambert(0x2a3440));
  body.position.y = 0; body.castShadow = true;
  h.add(body);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.4), lambert(0x9ad8ff));
  glass.position.set(0, 0.1, -2.0);
  h.add(glass);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 4.6), lambert(0x2a3440));
  tail.position.set(0, 0.2, 4.4);
  h.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.2), lambert(0xd21f2b));
  fin.position.set(0, 0.9, 6.4);
  h.add(fin);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.9, 8), lambert(0x333333));
  mast.position.y = 1.2;
  h.add(mast);
  const rotor = new THREE.Group();
  for (let i = 0; i < 2; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 0.5), lambert(0x181818));
    blade.rotation.y = (i * Math.PI) / 2;
    rotor.add(blade);
  }
  rotor.position.y = 1.7;
  h.add(rotor);
  h.userData.rotor = rotor;
  // Searchlight cone + spotlight, pointing down.
  const coneGeo = new THREE.ConeGeometry(7, 26, 24, 1, true);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff6c0, transparent: true, opacity: 0.16,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.y = -13.5;
  h.add(cone);
  const spot = new THREE.SpotLight(0xfff2b0, 900, 60, 0.32, 0.5, 1.2);
  spot.position.set(0, -0.8, 0);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -30, 0);
  h.add(spotTarget);
  spot.target = spotTarget;
  h.add(spot);
  h.userData.spot = spot;
  h.userData.cone = cone;
  return h;
}
