// Solara Bay v18 — main: boot, game loop, driving, on-foot play, police AI,
// shooting, camera, autopilot, and the headless hooks (__step / __game) used
// by the playtest and the screenshot driver.
import * as THREE from 'three';
import { SkySystem } from './sky.js';
import { CityBuilder } from './city.js';
import { makeHeroCar, makePoliceCar, makeTrafficCar, makeScooter, makeTank, makeHeli } from './vehicles.js';
import { makePed, makePlayer, makeGuard, makeDowned, pulseDowned } from './crowd.js';
import { GameState } from './state.js';
import { Hud } from './hud.js';
import { AudioEngine } from './audio.js';
import { stageShot } from './shots.js';
import { MISSIONS, RADIO_TRACKS, mulberry32 } from './config.js';

const STEP = 1 / 60;
const TRAFFIC_COLORS = [0x4fa8c9, 0xf2a541, 0xeeeeee, 0x7a68c9, 0xe86a5a, 0x5ac98a];

function wrapAngle(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

class Game {
  constructor() {
    this.errors = [];
    window.addEventListener('error', (e) => this.errors.push(String(e.message || e.error)));
    window.addEventListener('unhandledrejection', (e) => this.errors.push('rejection: ' + String(e.reason)));
    this.canvas = document.getElementById('scene');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    this.camera.position.set(6, 4, 14);
    this.sky = new SkySystem(this.scene, this.renderer);
    this.city = new CityBuilder(this.scene);
    this.state = new GameState();
    this.hud = new Hud();
    this.audio = new AudioEngine();
    this.rng = mulberry32(777);
    this.time = 0;
    this.started = false;
    this.paused = false;
    this.autopilot = false;
    this.shotMode = null;
    this.keys = {};
    this.radioTimer = 0;
    this.radioIndex = 0;
    this.tracers = [];
    this.camPos = new THREE.Vector3(6, 4, 14);
    this.camTarget = new THREE.Vector3(0, 1, -10);
    this.buildActors();
    this.bindInput();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    // Headless hooks: fixed-step advance + state snapshot for playtest/shots.
    window.__step = (dt, opts = {}) => {
      if (opts.autopilot || opts.shot) {
        this.started = true;
        document.getElementById('title-screen').classList.add('hidden');
      }
      if (opts.autopilot) this.autopilot = true;
      if (opts.shot) stageShot(opts.shot, this);
      const n = Math.max(1, Math.round(dt / STEP));
      for (let i = 0; i < n; i += 1) this.step(STEP);
      this.renderer.render(this.scene, this.camera);
      return this.snapshot();
    };
    window.__game = () => this.snapshot();
    window.__shot = (name) => { stageShot(name, this); this.renderer.render(this.scene, this.camera); return this.snapshot(); };
    window.__ready = false;
  }

  buildActors() {
    // Player on foot.
    this.player = {
      group: makePlayer(), pos: new THREE.Vector3(4, 0, 22), heading: 0, speed: 0, visible: true,
    };
    this.player.group.position.copy(this.player.pos);
    this.scene.add(this.player.group);
    // Hero car (the Comet S / Regent GT the player drives).
    this.heroCar = {
      group: makeHeroCar(0xd21f2b), pos: new THREE.Vector3(4, 0, 10), heading: 0,
      speed: 0, steer: 0, name: 'COMET S',
    };
    this.heroCar.group.position.copy(this.heroCar.pos);
    this.scene.add(this.heroCar.group);
    // Police fleet (6 units, named in state).
    this.police = [];
    for (let i = 0; i < 6; i += 1) {
      const group = makePoliceCar();
      group.visible = false;
      this.scene.add(group);
      this.police.push({ group, pos: new THREE.Vector3(0, 0, 40 + i * 8), heading: 0, speed: 0 });
    }
    // Traffic.
    this.traffic = [];
    for (let i = 0; i < 8; i += 1) {
      const group = makeTrafficCar(TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]);
      const lane = i % 2 === 0 ? -3 : 3;
      const pos = new THREE.Vector3(lane, 0, -100 + i * 26);
      const heading = i % 2 === 0 ? 0 : Math.PI;
      group.position.copy(pos);
      group.rotation.y = heading;
      this.scene.add(group);
      this.traffic.push({ group, pos, heading, speed: 8 + (i % 4) * 1.5 });
    }
    // Helicopter, tank, scooter.
    this.heli = { group: makeHeli(), pos: new THREE.Vector3(17, 25, -40), heading: 0 };
    this.heli.group.position.copy(this.heli.pos);
    this.scene.add(this.heli.group);
    this.tank = { group: makeTank(), pos: new THREE.Vector3(14, 0, -18), heading: 0 };
    this.tank.group.position.copy(this.tank.pos);
    this.scene.add(this.tank.group);
    this.scooter = { group: makeScooter(), pos: new THREE.Vector3(7.2, 0, -9), heading: 0 };
    this.scooter.group.position.copy(this.scooter.pos);
    this.scene.add(this.scooter.group);
    // Crowd, guards, downed enemy.
    this.peds = [];
    this.guards = [];
    this.downed = null;
    this.placeCrowd('boulevard', 16);
    this.spawnGuards();
    this.state.startMission(0);
    this.hud.setMission(this.state);
  }

  spawnGuards() {
    const spots = [[12, -14, 0], [24, 10, 1.5], [34, 20, -1.5], [-6, -80, 0]];
    for (const [x, z, ry] of spots) {
      const group = makeGuard();
      group.position.set(x, 0, z);
      group.rotation.y = ry;
      this.scene.add(group);
      this.guards.push({ group, pos: new THREE.Vector3(x, 0, z), health: 100, down: false });
    }
  }

  // ---- placement helpers used by shots.js ----
  placeHeroCar(pos, heading, color, name) {
    this.heroCar.group.removeFromParent();
    this.heroCar.group = makeHeroCar(color);
    this.heroCar.group.position.set(pos.x, 0, pos.z);
    this.heroCar.group.rotation.y = heading;
    this.scene.add(this.heroCar.group);
    this.heroCar.pos.set(pos.x, 0, pos.z);
    this.heroCar.heading = heading;
    this.heroCar.speed = 0;
    this.heroCar.name = name;
  }

  placePlayer(pos, heading, visible) {
    this.player.pos.set(pos.x, 0, pos.z);
    this.player.heading = heading;
    this.player.group.position.copy(this.player.pos);
    this.player.group.rotation.y = heading;
    this.player.group.visible = visible;
    this.player.visible = visible;
  }

  placePolice(list) {
    this.police.forEach((p, i) => {
      const spec = list[i];
      if (!spec) { p.group.visible = false; return; }
      p.group.visible = true;
      p.pos.set(spec.pos.x, 0, spec.pos.z);
      p.heading = spec.heading;
      p.group.position.copy(p.pos);
      p.group.rotation.y = spec.heading;
      p.speed = 0;
      this.state.units[i].role = spec.role;
    });
  }

  placeTraffic(list) {
    this.traffic.forEach((t, i) => {
      const spec = list[i];
      if (!spec) { t.group.visible = false; return; }
      t.group.visible = true;
      // Recolour the traffic car body for the shot.
      t.group.children[0].material = new THREE.MeshLambertMaterial({ color: spec.color });
      t.pos.set(spec.pos.x, 0, spec.pos.z);
      t.heading = spec.heading;
      t.group.position.copy(t.pos);
      t.group.rotation.y = spec.heading;
      t.speed = 0;
    });
  }

  placeHeli(pos, visible = true) {
    this.heli.pos.set(pos.x, pos.y, pos.z);
    this.heli.group.position.copy(this.heli.pos);
    this.heli.group.visible = visible;
  }

  placeTank(pos, heading) {
    this.tank.pos.set(pos.x, 0, pos.z);
    this.tank.heading = heading;
    this.tank.group.position.copy(this.tank.pos);
    this.tank.group.rotation.y = heading;
  }

  placeScooter(pos, heading) {
    this.scooter.pos.set(pos.x, 0, pos.z);
    this.scooter.group.position.copy(this.scooter.pos);
    this.scooter.group.rotation.y = heading;
  }

  placeGuard(pos, heading) {
    const g = this.guards.find((x) => !x.down);
    if (!g) return;
    g.pos.set(pos.x, 0, pos.z);
    g.group.position.copy(g.pos);
    g.group.rotation.y = heading;
    g.group.visible = true;
  }

  placeDowned(pos) {
    if (this.downed) this.downed.group.removeFromParent();
    const group = makeDowned();
    group.position.set(pos.x, 0, pos.z);
    this.scene.add(group);
    this.downed = { group, pos: new THREE.Vector3(pos.x, 0, pos.z) };
  }

  placeCrowd(area, count) {
    for (const p of this.peds) p.group.removeFromParent();
    this.peds = [];
    const rng = mulberry32(area.length * 131 + count * 17);
    for (let i = 0; i < count; i += 1) {
      let x, z;
      if (area === 'market') { x = 20 + rng() * 22; z = 4 + rng() * 24; }
      else if (area === 'beach') { x = -14 - rng() * 12; z = -44 + rng() * 60; }
      else if (area === 'sidewalk') { x = rng() < 0.5 ? -8.4 : 8.4; z = -30 + rng() * 50; }
      else { x = (rng() < 0.5 ? -8.4 : 8.4); z = -90 + rng() * 130; }
      const group = makePed(rng);
      group.position.set(x, 0, z);
      group.rotation.y = rng() * Math.PI * 2;
      this.scene.add(group);
      this.peds.push({ group, pos: new THREE.Vector3(x, 0, z), heading: group.rotation.y, phase: rng() * 6 });
    }
  }

  setCamera(x, y, z, tx, ty, tz) {
    this.camPos.set(x, y, z);
    this.camTarget.set(tx, ty, tz);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Enter' && !this.started) { this.start(); return; }
      if (e.code === 'Escape') { this.paused = !this.paused; document.getElementById('pause-screen').classList.toggle('hidden', !this.paused); return; }
      if (!this.started || this.paused) return;
      if (e.code === 'KeyE') this.toggleEnterCar();
      if (e.code === 'KeyR') { this.state.reloadWeapon(); this.audio.blip(660); }
      if (e.code === 'KeyM') {
        if (this.hud.metaOpen) this.hud.hideMeta(); else this.hud.showMeta(this.state);
      }
      if (e.code === 'F9') { this.state.quickSave(); this.hud.showToast('SAVED — SLOT 1'); }
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5)) - 1;
        if (n >= 0 && n < 6) { this.state.weaponIndex = n; this.audio.blip(520); }
      }
      this.audio.resume();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.started || this.paused) return;
      this.audio.resume();
      if (e.button === 0) this.shoot();
    });
  }

  start() {
    this.started = true;
    document.getElementById('title-screen').classList.add('hidden');
    this.audio.resume();
    this.audio.startRadio();
    this.state.startMission(this.state.missionIndex);
    this.hud.setMission(this.state);
    this.hud.showBanner(`MISSION ${this.state.mission.id} — ${this.state.mission.title}`, 3200);
  }

  toggleEnterCar() {
    const st = this.state;
    if (st.inCar) {
      st.inCar = false;
      this.heroCar.speed = 0;
      const side = this.heroCar.pos.x + 2.4;
      this.placePlayer({ x: side, y: 0, z: this.heroCar.pos.z }, this.heroCar.heading, true);
      st.vehicleName = 'ON FOOT';
      st.speedKmh = 0;
      return;
    }
    const dx = this.heroCar.pos.x - this.player.pos.x;
    const dz = this.heroCar.pos.z - this.player.pos.z;
    if (Math.sqrt(dx * dx + dz * dz) < 4.5) {
      st.inCar = true;
      this.placePlayer(this.player.pos, this.player.heading, false);
      st.vehicleName = this.heroCar.name;
      if (st.missionIndex === 0 && st.stageIndex === 0) {
        st.addWanted(1);
        st.career.carsStolen += 1;
        this.hud.showToast('CAR STOLEN — KPD ALERTED');
      }
      this.audio.blip(440);
    }
  }

  shoot() {
    const st = this.state;
    const w = [0, 1, 2, 3, 4, 5][st.weaponIndex];
    const weapon = [{ name: 'FISTS', dmg: 12, rng: 2 }, { name: 'P9 PISTOL', dmg: 25, rng: 42 }, { name: 'VK SMG', dmg: 16, rng: 36 }, { name: 'RIOT SHOTGUN', dmg: 22, rng: 20 }, { name: 'AR-77 RIFLE', dmg: 34, rng: 70 }, { name: 'LONGSHOT SNIPER', dmg: 95, rng: 120 }][w];
    const origin = st.inCar ? this.heroCar.pos.clone().setY(1.2) : this.player.pos.clone().setY(1.4);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    if (weapon.name === 'FISTS') {
      for (const g of this.guards) {
        if (g.down) continue;
        if (g.pos.distanceTo(this.player.pos) < 2.6) this.damageGuard(g, 50);
      }
      return;
    }
    if (!st.shoot()) { this.hud.showToast('RELOAD — PRESS R'); this.audio.blip(220); return; }
    this.audio.gunshot();
    const end = origin.clone().add(dir.clone().multiplyScalar(weapon.rng));
    // Hit test: nearest guard inside a narrow cone and inside weapon range.
    let hit = null; let hitDist = Infinity;
    for (const g of this.guards) {
      if (g.down) continue;
      const to = g.pos.clone().setY(1.2).sub(origin);
      const dist = to.length();
      if (dist > weapon.rng) continue;
      const angle = to.normalize().angleTo(dir);
      if (angle < 0.16 && dist < hitDist) { hit = g; hitDist = dist; }
    }
    if (hit) {
      end.copy(hit.pos).setY(1.2);
      this.damageGuard(hit, weapon.dmg);
    }
    this.spawnTracer(origin, end);
  }

  damageGuard(g, dmg) {
    g.health -= dmg;
    if (g.health <= 0 && !g.down) {
      g.down = true;
      g.group.rotation.set(-Math.PI / 2, g.group.rotation.y, 0);
      g.group.position.y = 0.25;
      this.state.career.peopleTakenOut += 1;
      this.state.addWanted(1);
      this.hud.showToast('TAKEN OUT');
    }
  }

  spawnTracer(from, to) {
    const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.95 }));
    this.scene.add(line);
    this.tracers.push({ line, life: 0.09 });
  }

  // ---- per-frame simulation ----
  step(dt) {
    this.time += dt;
    const st = this.state;
    this.sky.update(dt, this.time);
    this.city.update(dt, this.time);
    if (this.shotMode) {
      // Staged dossier frame: freeze the game (mission timer, speed, HUD)
      // and only let the world breathe — clouds, wheel, rotor, ring pulse.
      this.updateHeli(dt);
      if (this.downed) pulseDowned(this.downed.group, this.time);
      this.camera.position.copy(this.camPos);
      this.camera.lookAt(this.camTarget);
      return;
    }
    st.update(dt);
    // Radio rotation.
    this.radioTimer += dt;
    if (this.radioTimer > 25) {
      this.radioTimer = 0;
      this.radioIndex = (this.radioIndex + 1) % RADIO_TRACKS.length;
      document.getElementById('radio-line').textContent = '♪ ' + RADIO_TRACKS[this.radioIndex];
    }
    const input = this.autopilot ? this.autopilotInput() : this.readKeys();
    if (input.enter) { this.toggleEnterCar(); }
    if (st.inCar) this.drive(dt, input);
    else this.walk(dt, input);
    this.updatePolice(dt);
    this.updateTraffic(dt);
    this.updateCrowd(dt);
    this.updateHeli(dt);
    this.updateTracers(dt);
    this.checkStage(dt);
    this.audio.setEngine(st.speedKmh, st.inCar);
    this.audio.setSiren(st.wanted, dt);
    // HUD refresh, throttled to every 6th step.
    this.hudTick = (this.hudTick || 0) + 1;
    if (this.hudTick % 6 === 0 && !this.hud.metaOpen) {
      this.hud.setMission(st);
      this.hud.setWanted(st);
      this.hud.setPolice(st);
      this.hud.setWeapons(st);
      this.hud.setVehicle(st);
      this.hud.drawMinimap(
        st.inCar ? this.heroCar.pos : this.player.pos,
        st.inCar ? this.heroCar.heading : this.player.heading,
        st.missionActive ? st.stage.target : null,
        this.police.filter((p) => p.group.visible).map((p) => p.pos),
      );
    }
    if (!this.shotMode) this.followCamera(dt);
  }

  ambient(dt) {
    this.time += dt;
    this.sky.update(dt, this.time);
    this.city.update(dt, this.time);
    if (this.downed) pulseDowned(this.downed.group, this.time);
    if (this.heli.group.visible) this.heli.group.userData.rotor.rotation.y += dt * 22;
  }

  readKeys() {
    const k = this.keys;
    return {
      up: !!(k.KeyW || k.ArrowUp), down: !!(k.KeyS || k.ArrowDown),
      left: !!(k.KeyA || k.ArrowLeft), right: !!(k.KeyD || k.ArrowRight),
      enter: false,
    };
  }

  // Autopilot: plays the current mission stage toward its target. Used by
  // the headless playtest and by ?shot staging in the future.
  autopilotInput() {
    const st = this.state;
    const target = st.stage.target;
    const focus = st.inCar ? this.heroCar : this.player;
    const dx = target.x - focus.pos.x;
    const dz = target.z - focus.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const out = { up: false, down: false, left: false, right: false, enter: false };
    // Need the car but on foot: walk to the car first, then enter it.
    if (!st.inCar && ['drive', 'arrive', 'escape', 'ram'].includes(st.stage.kind)) {
      const cx = this.heroCar.pos.x - this.player.pos.x;
      const cz = this.heroCar.pos.z - this.player.pos.z;
      const cd = Math.sqrt(cx * cx + cz * cz);
      if (cd < 3.5) { out.enter = true; return out; }
      return this.steerToward(this.player, this.heroCar.pos, 5.5);
    }
    if (st.stage.kind === 'hold') return out; // stand still, holdTimer runs
    if (st.stage.kind === 'fight') {
      const g = this.guards.find((x) => !x.down && x.pos.distanceTo(this.player.pos) < 6);
      if (g) { this.damageGuard(g, 120); return out; }
      return this.steerToward(this.player, { x: target.x, z: target.z }, 5.5);
    }
    if (st.inCar) {
      // Drive through the target radius; checkStage fires on the pass.
      const desired = Math.atan2(-dx, -dz);
      const diff = wrapAngle(desired - this.heroCar.heading);
      out.up = Math.abs(diff) < 1.1;
      out.left = diff > 0.12;
      out.right = diff < -0.12;
      out.down = Math.abs(diff) > 2.4;
      return out;
    }
    if (dist < 2.2) return out;
    return this.steerToward(this.player, target, 5.5);
  }

  steerToward(actor, target, speed) {
    const dx = target.x - actor.pos.x;
    const dz = target.z - actor.pos.z;
    const desired = Math.atan2(-dx, -dz);
    const diff = wrapAngle(desired - actor.heading);
    actor.heading += Math.max(-0.12, Math.min(0.12, diff));
    actor.group.rotation.y = actor.heading;
    const out = { up: true, down: false, left: false, right: false, enter: false };
    return out;
  }

  drive(dt, input) {
    const car = this.heroCar;
    const st = this.state;
    const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
    const speedFactor = Math.max(0.15, Math.min(1, Math.abs(car.speed) / 12));
    car.heading += steer * 1.9 * speedFactor * dt * (car.speed >= 0 ? 1 : -1);
    if (input.up) car.speed += 16 * dt;
    if (input.down) car.speed -= 26 * dt;
    car.speed *= (1 - 0.35 * dt);
    car.speed = Math.max(-8, Math.min(33, car.speed));
    const fx = -Math.sin(car.heading), fz = -Math.cos(car.heading);
    car.pos.x += fx * car.speed * dt;
    car.pos.z += fz * car.speed * dt;
    // Soft off-road slowdown + world bounds.
    if (Math.abs(car.pos.x) > 7) car.speed *= (1 - 1.1 * dt);
    car.pos.x = Math.max(-95, Math.min(95, car.pos.x));
    car.pos.z = Math.max(-118, Math.min(58, car.pos.z));
    car.group.position.copy(car.pos);
    car.group.rotation.y = car.heading;
    st.speedKmh = Math.abs(car.speed) * 3.6;
    st.career.distanceDriven += Math.abs(car.speed) * dt / 1000;
    // Condition wears when ramming the world edge.
    if (Math.abs(car.pos.x) > 90 || car.pos.z < -115 || car.pos.z > 55) {
      st.condition = Math.max(20, st.condition - dt * 2);
    }
  }

  walk(dt, input) {
    const p = this.player;
    const st = this.state;
    let mx = 0, mz = 0;
    if (input.up) mz -= 1;
    if (input.down) mz += 1;
    if (input.left) mx -= 1;
    if (input.right) mx += 1;
    if (this.autopilot && input.up) {
      // Autopilot steers by heading directly.
      const fx = -Math.sin(p.heading), fz = -Math.cos(p.heading);
      p.pos.x += fx * 5.5 * dt;
      p.pos.z += fz * 5.5 * dt;
    } else if (mx !== 0 || mz !== 0) {
      const len = Math.sqrt(mx * mx + mz * mz);
      p.pos.x += (mx / len) * 5.5 * dt;
      p.pos.z += (mz / len) * 5.5 * dt;
      p.heading = Math.atan2(-mx / len, -mz / len);
    }
    p.pos.x = Math.max(-95, Math.min(95, p.pos.x));
    p.pos.z = Math.max(-118, Math.min(58, p.pos.z));
    p.group.position.copy(p.pos);
    p.group.rotation.y = p.heading;
    st.speedKmh = (mx !== 0 || mz !== 0 || (this.autopilot && input.up)) ? 20 : 0;
  }

  updatePolice(dt) {
    const st = this.state;
    const n = st.activeUnitCount();
    const focus = st.inCar ? this.heroCar.pos : this.player.pos;
    for (let i = 0; i < this.police.length; i += 1) {
      const p = this.police[i];
      if (this.shotMode) continue; // staged positions + visibility stay as placed
      if (i >= n) { p.group.visible = false; continue; }
      p.group.visible = true;
      const dx = focus.x - p.pos.x, dz = focus.z - p.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const desired = Math.atan2(-dx, -dz);
      const diff = wrapAngle(desired - p.heading);
      p.heading += Math.max(-0.06, Math.min(0.06, diff));
      p.speed = dist < 9 ? 6 : Math.min(30, 8 + dist * 0.55);
      p.pos.x += -Math.sin(p.heading) * p.speed * dt;
      p.pos.z += -Math.cos(p.heading) * p.speed * dt;
      p.group.position.copy(p.pos);
      p.group.rotation.y = p.heading;
      // Light bar flash.
      const flash = Math.sin(this.time * 12 + i) > 0;
      if (p.group.userData.lightRed) p.group.userData.lightRed.visible = flash;
      if (p.group.userData.lightBlue) p.group.userData.lightBlue.visible = !flash;
    }
    st.updateUnits(focus, this.police.map((p) => p.pos));
  }

  updateTraffic(dt) {
    if (this.shotMode) return;
    for (const t of this.traffic) {
      if (!t.group.visible) continue;
      t.pos.x += -Math.sin(t.heading) * t.speed * dt;
      t.pos.z += -Math.cos(t.heading) * t.speed * dt;
      if (t.pos.z < -115) t.pos.z = 55;
      if (t.pos.z > 55) t.pos.z = -115;
      t.group.position.copy(t.pos);
    }
  }

  updateCrowd(dt) {
    for (const p of this.peds) {
      if (this.shotMode) continue;
      p.phase += dt * p.group.userData.walkSpeed;
      p.pos.x += Math.sin(p.phase * 0.7) * 0.4 * dt;
      p.pos.z += Math.cos(p.phase * 0.5) * 0.4 * dt;
      p.group.position.copy(p.pos);
      p.group.position.y = Math.abs(Math.sin(p.phase * 3)) * 0.05;
    }
    if (this.downed) pulseDowned(this.downed.group, this.time);
  }

  updateHeli(dt) {
    const st = this.state;
    if (this.shotMode) {
      // Staged frame: keep the placed heli, just spin the rotor.
      if (this.heli.group.visible) this.heli.group.userData.rotor.rotation.y += dt * 22;
      return;
    }
    const show = st.wanted >= 4;
    this.heli.group.visible = show;
    if (!show) return;
    this.heli.group.userData.rotor.rotation.y += dt * 22;
    const focus = st.inCar ? this.heroCar.pos : this.player.pos;
    const target = new THREE.Vector3(focus.x + 10, 26, focus.z - 14);
    this.heli.pos.lerp(target, 1 - Math.exp(-1.5 * dt));
    this.heli.group.position.copy(this.heli.pos);
    // The searchlight cone hangs straight down from a level heli.
  }

  updateTracers(dt) {
    for (const t of this.tracers) {
      t.life -= dt;
      t.line.material.opacity = Math.max(0, t.life / 0.09);
    }
    const dead = this.tracers.filter((t) => t.life <= 0);
    for (const t of dead) {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      t.line.material.dispose();
    }
    this.tracers = this.tracers.filter((t) => t.life > 0);
  }

  checkStage(dt) {
    const st = this.state;
    if (!st.missionActive) return;
    const target = st.stage.target;
    const focus = st.inCar ? this.heroCar.pos : this.player.pos;
    const dx = target.x - focus.x, dz = target.z - focus.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const kind = st.stage.kind;
    if (kind === 'walk' || kind === 'collect') {
      if (dist < 2.5) this.advanceOrComplete();
    } else if (kind === 'drive' || kind === 'arrive') {
      if (dist < 7) this.advanceOrComplete();
    } else if (kind === 'fight') {
      const near = this.guards.some((g) => g.down && g.pos.distanceTo(this.player.pos) < 8);
      if (near) this.advanceOrComplete();
    } else if (kind === 'ram') {
      if (dist < 4.5) {
        st.condition = Math.max(20, st.condition - 25);
        st.addWanted(1);
        this.audio.crash();
        this.advanceOrComplete();
      }
    } else if (kind === 'hold') {
      if (dist < 6) {
        st.holdTimer += dt;
        if (st.holdTimer > 4) { st.holdTimer = 0; this.advanceOrComplete(); }
      } else st.holdTimer = 0;
    } else if (kind === 'escape') {
      if (st.wanted === 0) {
        st.holdTimer += dt;
        if (st.holdTimer > 3) { st.holdTimer = 0; this.advanceOrComplete(); }
      } else st.holdTimer = 0;
    }
  }

  advanceOrComplete() {
    const st = this.state;
    const wasLast = st.stageIndex >= st.mission.stages.length - 1;
    st.advanceStage();
    if (wasLast) {
      this.audio.blip(880);
      this.hud.showMissionResult(true, st.mission.payout, 'S');
      this.hud.showBanner('MISSION COMPLETE', 3200);
      this.autopilot = false;
    } else {
      this.audio.blip(660);
      this.hud.showBanner(`STAGE ${st.stageIndex + 1} — ${st.stage.text}`, 2200);
    }
  }

  followCamera(dt) {
    const st = this.state;
    const focus = st.inCar ? this.heroCar.pos : this.player.pos;
    const heading = st.inCar ? this.heroCar.heading : this.player.heading;
    const fx = -Math.sin(heading), fz = -Math.cos(heading);
    const desired = new THREE.Vector3(focus.x - fx * 9, 3.4, focus.z - fz * 9);
    this.camPos.lerp(desired, 1 - Math.exp(-5 * dt));
    this.camTarget.lerp(new THREE.Vector3(focus.x + fx * 7, 1.4, focus.z + fz * 7), 1 - Math.exp(-7 * dt));
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camTarget);
  }

  snapshot() {
    const st = this.state;
    return {
      mission: st.missionIndex + 1,
      stage: st.stageIndex + 1,
      missionDone: st.missionDone,
      missionFailed: st.missionFailed,
      missionActive: st.missionActive,
      cash: Math.round(st.cash),
      wanted: st.wanted,
      health: st.health,
      speedKmh: Math.round(st.speedKmh),
      inCar: st.inCar,
      time: Math.round(this.time * 10) / 10,
      playerPos: { x: Math.round(this.player.pos.x * 10) / 10, z: Math.round(this.player.pos.z * 10) / 10 },
      heroPos: { x: Math.round(this.heroCar.pos.x * 10) / 10, z: Math.round(this.heroCar.pos.z * 10) / 10 },
      errors: [...this.errors],
    };
  }
}

// ---- boot ----
const game = new Game();
window.__solara = game;
const params = new URLSearchParams(window.location.search);
const shotParam = params.get('shot');
if (shotParam) {
  game.started = true;
  document.getElementById('title-screen').classList.add('hidden');
  stageShot(shotParam, game);
  game.renderer.render(game.scene, game.camera);
  game.hud.setMission(game.state);
  window.__ready = true;
}
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.started && !game.paused) {
    let acc = dt;
    while (acc > 0) {
      const s = Math.min(STEP, acc);
      game.step(s);
      acc -= s;
    }
  } else {
    game.ambient(dt);
  }
  game.renderer.render(game.scene, game.camera);
  if (!window.__ready) window.__ready = true;
}
requestAnimationFrame(loop);
