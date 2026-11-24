// Solara Bay v18 — city builder: boulevard, beach, ocean + marina yacht, pier,
// Ferris wheel, lantern market, facades with procedural textures, slim palms.
import * as THREE from 'three';
import { mulberry32 } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function facadeTexture(base, win, lit) {
  return canvasTexture(128, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.12)';
    for (let y = 0; y < h; y += 48) g.fillRect(0, y, w, 2);
    for (let y = 18; y < h; y += 48) {
      for (let x = 14; x < w; x += 38) {
        g.fillStyle = Math.random() < lit ? '#ffe9a8' : win;
        g.fillRect(x, y, 20, 24);
      }
    }
  });
}

function roadTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#2c2f36'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8c33c';
    g.fillRect(w / 2 - 3, 0, 6, h);
    g.fillStyle = '#e8e8e8';
    g.fillRect(8, 0, 3, h); g.fillRect(w - 11, 0, 3, h);
  });
}

function sandTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#e8cf9a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(190,160,110,0.35)';
    for (let i = 0; i < 24; i += 1) g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
  });
}

function waterTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#1e7fb8'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      g.beginPath();
      const y = Math.random() * h;
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.1 + i) * 4);
      g.stroke();
    }
  });
}

const FACADES = [
  ['#e86a5a', '#2c3e50', 0.25], ['#f2a541', '#24344a', 0.3], ['#4fa8c9', '#1f2c3d', 0.35],
  ['#c95a8a', '#2a2438', 0.4], ['#7a68c9', '#20263a', 0.45], ['#e8d44f', '#33302a', 0.2],
  ['#5ac98a', '#1e3328', 0.3], ['#8a94a6', '#232a36', 0.35],
];

export class CityBuilder {
  constructor(scene) {
    this.scene = scene;
    this.rng = mulberry32(20261124);
    this.animated = [];
    this.buildGround();
    this.buildBoulevard();
    this.buildCityBlocks();
    this.buildBeach();
    this.buildMarina();
    this.buildFerrisWheel();
    this.buildMarket();
    this.buildPalms();
    this.buildProps();
  }

  box(w, h, d, color, x, y, z, opts = {}) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color, ...(opts.tex ? { map: opts.tex } : {}) }),
    );
    m.position.set(x, y, z);
    if (opts.ry) m.rotation.y = opts.ry;
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = true;
    this.scene.add(m);
    return m;
  }

  buildGround() {
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x7a9a5a }),
    );
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(40, -0.05, -20);
    grass.receiveShadow = true;
    this.scene.add(grass);
  }

  buildBoulevard() {
    const roadTex = roadTexture();
    roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
    roadTex.repeat.set(1, 14);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 260),
      new THREE.MeshLambertMaterial({ map: roadTex }),
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, -30);
    road.receiveShadow = true;
    this.scene.add(road);
    // Sidewalks, both sides.
    for (const sx of [-8.5, 8.5]) {
      const walk = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 260),
        new THREE.MeshLambertMaterial({ color: 0xb8b0a0 }),
      );
      walk.rotation.x = -Math.PI / 2;
      walk.position.set(sx, 0.02, -30);
      walk.receiveShadow = true;
      this.scene.add(walk);
    }
    // Crosswalk stripes near the market corner.
    for (let i = 0; i < 6; i += 1) {
      this.box(1.4, 0.05, 3.4, 0xe8e8e8, -5.4 + i * 2.1, 0.03, 22, { shadow: false });
    }
  }

  buildCityBlocks() {
    const rng = this.rng;
    const blocks = [
      { x: 22, z: -10, w: 26, d: 22 }, { x: 24, z: -44, w: 24, d: 20 },
      { x: 30, z: -78, w: 28, d: 22 }, { x: 58, z: -20, w: 24, d: 24 },
      { x: 62, z: -58, w: 26, d: 22 }, { x: 26, z: 34, w: 24, d: 18 },
      { x: 60, z: 34, w: 22, d: 18 }, { x: -24, z: -96, w: 20, d: 16 },
      { x: 16, z: -108, w: 30, d: 18 },
    ];
    for (const b of blocks) {
      const n = 3 + Math.floor(rng() * 3);
      for (let i = 0; i < n; i += 1) {
        const f = FACADES[Math.floor(rng() * FACADES.length)];
        const bw = 6 + rng() * 7;
        const bh = 10 + rng() * 26;
        const bd = 6 + rng() * 7;
        const bx = b.x - b.w / 2 + 4 + rng() * (b.w - 8);
        const bz = b.z - b.d / 2 + 4 + rng() * (b.d - 8);
        const tex = facadeTexture(f[0], f[1], f[2]);
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(bw, bh, bd),
          new THREE.MeshLambertMaterial({ map: tex }),
        );
        m.position.set(bx, bh / 2, bz);
        m.castShadow = true; m.receiveShadow = true;
        this.scene.add(m);
        // Roof trim + neon sign strip on some towers.
        if (rng() < 0.5) {
          this.box(bw + 0.4, 0.5, bd + 0.4, 0x222222, bx, bh + 0.2, bz, { shadow: false });
        }
        if (rng() < 0.4) {
          const neon = new THREE.Mesh(
            new THREE.BoxGeometry(bw * 0.7, 0.7, 0.3),
            new THREE.MeshBasicMaterial({ color: [0xff4fd8, 0x4fd8ff, 0xffc93c][Math.floor(rng() * 3)] }),
          );
          neon.position.set(bx, bh * 0.72, bz + bd / 2 + 0.2);
          this.scene.add(neon);
        }
      }
    }
    // Downtown skyline silhouettes far north-east.
    for (let i = 0; i < 7; i += 1) {
      const h = 34 + rng() * 30;
      this.box(10 + rng() * 6, h, 10, 0x3a4a6a, 70 + i * 14, h / 2, -130 - rng() * 20, { shadow: false });
    }
  }

  buildBeach() {
    const sandTex = sandTexture();
    sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
    sandTex.repeat.set(6, 10);
    const sand = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 260),
      new THREE.MeshLambertMaterial({ map: sandTex }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.position.set(-21, 0.01, -30);
    sand.receiveShadow = true;
    this.scene.add(sand);
    // Ocean: big animated plane west of the beach.
    const waterTex = waterTexture();
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(10, 10);
    this.waterTex = waterTex;
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 300),
      new THREE.MeshLambertMaterial({ map: waterTex }),
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(-180, 0.0, -30);
    this.scene.add(ocean);
    // Beach umbrellas + towels.
    const umbrellaCols = [0xff5c5c, 0x4fd8ff, 0xffc93c, 0x4fd87d, 0xff8ad8];
    for (let i = 0; i < 10; i += 1) {
      const ux = -16 - Math.random() * 12;
      const uz = 30 - i * 13 - Math.random() * 4;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6),
        new THREE.MeshLambertMaterial({ color: 0xdddddd }),
      );
      pole.position.set(ux, 1.2, uz);
      this.scene.add(pole);
      const top = new THREE.Mesh(
        new THREE.ConeGeometry(1.9, 0.9, 8),
        new THREE.MeshLambertMaterial({ color: umbrellaCols[i % umbrellaCols.length] }),
      );
      top.position.set(ux, 2.7, uz);
      top.castShadow = true;
      this.scene.add(top);
    }
  }

  buildMarina() {
    // Pier jutting into the ocean, due west of the boulevard.
    const pier = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.6, 46),
      new THREE.MeshLambertMaterial({ color: 0x8a6a4a }),
    );
    pier.position.set(-34, 0.4, -52);
    pier.castShadow = true; pier.receiveShadow = true;
    this.scene.add(pier);
    for (let i = 0; i < 7; i += 1) {
      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 2.6, 6),
        new THREE.MeshLambertMaterial({ color: 0x333333 }),
      );
      lamp.position.set(-32.4, 1.6, -32 - i * 6.5);
      this.scene.add(lamp);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe9a8 }),
      );
      bulb.position.set(-32.4, 3.0, -32 - i * 6.5);
      this.scene.add(bulb);
    }
    // THE REGENT — the big yacht. Navy hull + white decks + gold trim, so it
    // reads unmistakably against ocean and sand; 26 m long, broadside to the
    // boulevard.
    const yacht = new THREE.Group();
    const hullMat = new THREE.MeshLambertMaterial({ color: 0x1a3a5a });
    const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 2.6, 26), hullMat);
    hull.position.y = 1.1; hull.castShadow = true;
    yacht.add(hull);
    const bow = new THREE.Mesh(new THREE.ConeGeometry(3.5, 6, 4), hullMat);
    bow.rotation.x = -Math.PI / 2; bow.rotation.y = Math.PI / 4;
    bow.scale.set(1, 1, 0.55); bow.position.set(0, 1.1, -15.5);
    yacht.add(bow);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(7.2, 0.8, 24),
      new THREE.MeshLambertMaterial({ color: 0xc9a227 }),
    );
    stripe.position.y = 2.3;
    yacht.add(stripe);
    const deck1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 2.2, 17), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    deck1.position.set(0, 3.4, 2); deck1.castShadow = true;
    yacht.add(deck1);
    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.0, 11), new THREE.MeshLambertMaterial({ color: 0xeef2f5 }));
    deck2.position.set(0, 5.4, 3); deck2.castShadow = true;
    yacht.add(deck2);
    // Tinted window band on the main deck — tall and dark so the hull reads
    // as a yacht, not a white building, at 80 m.
    const windows = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 1.4, 15),
      new THREE.MeshLambertMaterial({ color: 0x14324a }),
    );
    windows.position.set(0, 3.6, 2);
    yacht.add(windows);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 8, 16, Math.PI), new THREE.MeshLambertMaterial({ color: 0xc9a227 }));
    arch.position.set(0, 6.4, 7.5);
    yacht.add(arch);
    const radar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.6, 6),
      new THREE.MeshLambertMaterial({ color: 0x888888 }),
    );
    radar.position.set(0, 7.2, 3);
    yacht.add(radar);
    const radarBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.14, 0.3), new THREE.MeshLambertMaterial({ color: 0xdddddd }));
    radarBar.position.set(0, 8.0, 3);
    yacht.add(radarBar);
    this.animated.push({ obj: radarBar, kind: 'spinY', speed: 1.2 });
    // Name board on the stern.
    const nameBoard = new THREE.Mesh(
      new THREE.BoxGeometry(5.0, 1.0, 0.2),
      new THREE.MeshLambertMaterial({ color: 0x14324a }),
    );
    nameBoard.position.set(0, 1.6, 13.1);
    yacht.add(nameBoard);
    // Red stern ensign so the hull reads as a boat at a glance.
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), new THREE.MeshLambertMaterial({ color: 0x888888 }));
    flagPole.position.set(0, 3.4, 12.6);
    yacht.add(flagPole);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.06), new THREE.MeshLambertMaterial({ color: 0xd21f2b }));
    flag.position.set(0.8, 4.2, 12.6);
    yacht.add(flag);
    yacht.position.set(-40, -0.1, -48);
    // Broadside to the boulevard: the 26 m hull must read at full length from
    // the cover camera, never end-on like a white box.
    yacht.rotation.y = -0.91;
    this.scene.add(yacht);
    this.yacht = yacht;
    // Second, smaller yacht further out for depth.
    const yacht2 = yacht.clone();
    yacht2.scale.set(0.55, 0.55, 0.55);
    yacht2.position.set(-86, -0.1, -110);
    yacht2.rotation.y = -0.5;
    this.scene.add(yacht2);
    // Speedboat near the pier.
    const boat = new THREE.Group();
    const bHull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 6), new THREE.MeshLambertMaterial({ color: 0xff5c3c }));
    bHull.position.y = 0.5; boat.add(bHull);
    const bTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2.4), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    bTop.position.set(0, 1.1, 0.4); boat.add(bTop);
    boat.position.set(-38, -0.1, -38);
    boat.rotation.y = 0.8;
    this.scene.add(boat);
    this.speedboat = boat;
  }

  buildFerrisWheel() {
    // Solara Ferris wheel on the marina skyline, east side of the pier road.
    const wheel = new THREE.Group();
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xd84f4f });
    const rim = new THREE.Mesh(new THREE.TorusGeometry(15, 0.55, 10, 40), rimMat);
    wheel.add(rim);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(9, 0.4, 8, 32), new THREE.MeshLambertMaterial({ color: 0xffc93c }));
    wheel.add(rim2);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 30, 6), rimMat);
      spoke.rotation.z = a + Math.PI / 2;
      wheel.add(spoke);
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 2.0, 2.0),
        new THREE.MeshLambertMaterial({ color: [0x4fd8ff, 0xffc93c, 0xff5c5c, 0x4fd87d][i % 4] }),
      );
      cabin.position.set(Math.cos(a) * 15, Math.sin(a) * 15, 0);
      wheel.add(cabin);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
      bulb.position.set(Math.cos(a) * 15, Math.sin(a) * 15, 1.3);
      wheel.add(bulb);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
    hub.rotation.x = Math.PI / 2;
    wheel.add(hub);
    // A-frame legs.
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 19, 8), new THREE.MeshLambertMaterial({ color: 0xcccccc }));
      leg.position.set(s * 5.5, -8.5, 0);
      leg.rotation.z = s * 0.32;
      wheel.add(leg);
    }
    wheel.position.set(30, 19, -72);
    this.scene.add(wheel);
    this.ferrisWheel = wheel;
    this.animated.push({ obj: wheel, kind: 'spinZ', speed: 0.12 });
    // Ticket booth + queue rails at the base.
    this.box(6, 3, 4, 0xe86a5a, 30, 1.5, -58, {});
    this.box(6.4, 0.4, 4.4, 0x2c3e50, 30, 3.2, -58, { shadow: false });
  }

  buildMarket() {
    // Old Town fruit market: stalls with striped awnings, crates, fruit piles.
    const stallCols = [0xe86a5a, 0x4fa8c9, 0xf2a541, 0x5ac98a];
    const spots = [
      { x: 24, z: 8, ry: 0.15 }, { x: 32, z: 14, ry: -0.1 }, { x: 38, z: 26, ry: 0.3 },
      { x: 36, z: 6, ry: -0.3 }, { x: 40, z: 18, ry: 0.1 }, { x: 22, z: 26, ry: 0.2 },
    ];
    spots.forEach((s, i) => {
      const g = new THREE.Group();
      const counter = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.0, 2.2), new THREE.MeshLambertMaterial({ color: 0x7a5230 }));
      counter.position.y = 0.6; counter.castShadow = true;
      g.add(counter);
      const awn = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.18, 3.0), new THREE.MeshLambertMaterial({ color: stallCols[i % stallCols.length] }));
      awn.position.y = 2.6; awn.castShadow = true;
      g.add(awn);
      for (const px of [-1.9, 1.9]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        pole.position.set(px, 1.3, 1.2);
        g.add(pole);
      }
      // Fruit piles: little coloured spheres on the counter.
      const fruitCols = [0xff5c3c, 0xffc93c, 0x7dff5c, 0xff8ad8, 0xffa53c];
      for (let f = 0; f < 9; f += 1) {
        const fruit = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 8, 6),
          new THREE.MeshLambertMaterial({ color: fruitCols[(i + f) % fruitCols.length] }),
        );
        fruit.position.set(-1.6 + (f % 3) * 1.1 + (Math.random() - 0.5) * 0.3, 1.25, -0.5 + Math.floor(f / 3) * 0.7);
        g.add(fruit);
      }
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.ry;
      this.scene.add(g);
    });
    // Big FRUIT sign board over the market.
    const sign = new THREE.Group();
    const board = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 0.5), new THREE.MeshLambertMaterial({ color: 0x2f9e4f }));
    board.castShadow = true;
    sign.add(board);
    const boardTrim = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.4, 0.6), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    boardTrim.position.y = 2.6;
    sign.add(boardTrim);
    // Painted FRUIT lettering on the board face.
    const signTex = canvasTexture(512, 160, (g, w, h) => {
      g.fillStyle = '#2f9e4f'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#ffffff';
      g.font = '900 84px Arial, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('FRUIT', w / 2, 62);
      g.font = '700 26px Arial, sans-serif';
      g.fillText('FRESH  •  MARKET  •  OLD TOWN', w / 2, 128);
    });
    const signFace = new THREE.Mesh(
      new THREE.PlaneGeometry(15.5, 4.8),
      new THREE.MeshBasicMaterial({ map: signTex }),
    );
    signFace.position.z = 0.3;
    sign.add(signFace);
    sign.position.set(28, 6.5, 2);
    this.scene.add(sign);
    this.marketSign = sign;
    // Crates and barrels scattered between stalls.
    for (let i = 0; i < 12; i += 1) {
      this.box(0.9, 0.9, 0.9, 0x9a6a3a, 20 + Math.random() * 24, 0.45, 4 + Math.random() * 26, { ry: Math.random() });
    }
  }

  buildPalms() {
    // Slim palms: thin trunks, SMALL canopies (radius ~2) pushed to the frame
    // edges so they never crowd the hero car or hide the yacht and ocean.
    const rng = this.rng;
    const spots = [];
    for (let z = 48; z > -110; z -= 15) {
      spots.push({ x: -8.6, z: z + rng() * 4 });
      spots.push({ x: 8.6, z: z + rng() * 4 });
    }
    // Keep the cover sightline clear: no left-side palms between z -18 and -72.
    const filtered = spots.filter((s) => !(s.x < 0 && s.z < -16 && s.z > -74));
    for (const s of filtered) {
      const h = 4.6 + rng() * 1.6;
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.22, h, 7),
        new THREE.MeshLambertMaterial({ color: 0x8a6a4a }),
      );
      trunk.position.set(s.x, h / 2, s.z);
      trunk.castShadow = true;
      this.scene.add(trunk);
      const canopy = new THREE.Group();
      for (let i = 0; i < 6; i += 1) {
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.55, 3.4, 4),
          new THREE.MeshLambertMaterial({ color: i % 2 ? 0x2f9e4f : 0x3cb35c }),
        );
        const a = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 1.3, -0.3, Math.sin(a) * 1.3);
        leaf.rotation.z = Math.cos(a) * 1.1;
        leaf.rotation.x = -Math.sin(a) * 1.1;
        leaf.castShadow = true;
        canopy.add(leaf);
      }
      canopy.position.set(s.x, h + 0.4, s.z);
      this.scene.add(canopy);
    }
  }

  buildProps() {
    // Street lamps along the boulevard.
    for (let z = 44; z > -100; z -= 18) {
      for (const sx of [-7.6, 7.6]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 5.2, 6), new THREE.MeshLambertMaterial({ color: 0x2a2a2a }));
        pole.position.set(sx, 2.6, z);
        this.scene.add(pole);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
        lamp.position.set(sx, 5.3, z);
        this.scene.add(lamp);
      }
    }
    // Roadblock barriers + cones (used by the sunset chase).
    this.roadblock = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 0.4), new THREE.MeshLambertMaterial({ color: 0xe8e8e8 }));
      barrier.position.set(-4 + i * 4, 0.6, 0);
      barrier.castShadow = true;
      this.roadblock.add(barrier);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 0.42), new THREE.MeshBasicMaterial({ color: 0xff3c3c }));
      stripe.position.set(-4 + i * 4, 0.85, 0);
      this.roadblock.add(stripe);
    }
    for (let i = 0; i < 5; i += 1) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.1, 10), new THREE.MeshLambertMaterial({ color: 0xff6a1a }));
      cone.position.set(-5 + i * 2.5, 0.55, 2.4);
      cone.castShadow = true;
      this.roadblock.add(cone);
    }
    this.roadblock.position.set(0, 0, -12);
    this.roadblock.visible = false;
    this.scene.add(this.roadblock);
    // Tank parked by the docks (mission 6 prize).
    this.tankSpot = { x: 14, z: -18 };
  }

  update(dt, time) {
    if (this.waterTex) this.waterTex.offset.y = (time * 0.02) % 1;
    for (const a of this.animated) {
      if (a.kind === 'spinY') a.obj.rotation.y += a.speed * dt;
      if (a.kind === 'spinZ') a.obj.rotation.z += a.speed * dt;
    }
  }
}
