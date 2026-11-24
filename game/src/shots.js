// Solara Bay v18 — shot staging: the 4 dossier frames, each a deterministic
// setup of the real game (mission, time, wanted, cash, camera, cast).
// The cover fix vs v17: hero car LARGE and CENTRAL, the BIG yacht + ocean
// unmistakable in frame, slim palms kept to the edges.
import { RADIO_TRACKS } from './config.js';

function v(x, y, z) { return { x, y, z }; }

export const SHOTS = {
  cover: {
    mission: 6, stage: 1, timer: 23, cash: 18450, wanted: 4,
    preset: 'noon', clock: 12 * 60, speed: 111, condition: 62, vehicle: 'REGENT GT',
    banner: 'AIR UNIT DEPLOYED — KPD HELICOPTER OVERHEAD',
    radio: RADIO_TRACKS[0],
  },
  foot: {
    mission: 2, stage: 1, timer: 107, cash: 7270, wanted: 2,
    preset: 'afternoon', clock: 14 * 60 + 30, speed: 0, condition: 100, vehicle: 'ON FOOT',
    hint: 'HINT: DUCK BY A STALL TO HIDE',
    radio: RADIO_TRACKS[0],
  },
  chase: {
    mission: 3, stage: 1, timer: 45, cash: 12860, wanted: 3,
    preset: 'sunset', clock: 17 * 60 + 45, speed: 110, condition: 68, vehicle: 'COMET S',
    banner: 'IN SIGHT — ROADBLOCK 120M',
    radio: RADIO_TRACKS[0],
  },
  meta: {
    mission: 6, stage: 1, timer: 23, cash: 21340, wanted: 0,
    preset: 'noon', clock: 12 * 60, speed: 0, condition: 100, vehicle: 'REGENT GT',
    radio: RADIO_TRACKS[0],
  },
};

export function stageShot(name, game) {
  const s = SHOTS[name] || SHOTS.cover;
  const st = game.state;
  game.shotMode = name;
  st.startMission(s.mission - 1);
  st.stageIndex = s.stage;
  st.missionTime = s.timer;
  st.cash = s.cash;
  st.wanted = s.wanted;
  st.clockMinutes = s.clock;
  st.preset = s.preset;
  st.speedKmh = s.speed;
  st.condition = s.condition;
  st.vehicleName = s.vehicle;
  st.missionActive = true;
  game.sky.setPreset(s.preset);
  game.city.roadblock.visible = name === 'chase';
  game.hud.hideHint();
  document.getElementById('title-screen').classList.add('hidden');
  document.getElementById('pause-screen').classList.add('hidden');
  document.getElementById('mission-result').classList.add('hidden');
  document.getElementById('radio-line').textContent = '♪ ' + s.radio;
  if (name === 'meta') {
    st.cash = 21340;
    st.wanted = 0;
    game.hud.showMeta(st);
    game.setCamera(10, 8, 30, 0, 2, -20);
    return;
  }
  game.hud.hideMeta();

  if (name === 'cover') {
    // Hero car large + central, 3/4 rear view; yacht + ocean fill the left,
    // Ferris wheel the right skyline; slim palms only at the frame edges.
    game.placeHeroCar(v(0, 0, -4), 0, 0xd21f2b, 'REGENT GT');
    st.inCar = true;
    game.placePlayer(v(2.5, 0, 2), 0, false);
    game.placePolice([
      { pos: v(-4.5, 0, -17), heading: 0, role: 'PURSUE' },
      { pos: v(5.2, 0, -21), heading: 0, role: 'PURSUE' },
      { pos: v(0, 0, -32), heading: Math.PI, role: 'ROADBLOCK' },
      { pos: v(-5.5, 0, 6), heading: 0, role: 'SEARCH' },
    ]);
    game.placeHeli(v(10, 15, -28));
    game.placeTank(v(7.6, 0, -26), Math.PI * 0.75);
    game.placeScooter(v(7.2, 0, -9), 0);
    game.placeTraffic([
      { pos: v(-3, 0, -48), heading: 0, color: 0x4fa8c9 },
      { pos: v(3.5, 0, -58), heading: Math.PI, color: 0xf2a541 },
      { pos: v(-3, 0, 26), heading: 0, color: 0xeeeeee },
    ]);
    game.placeCrowd('beach', 9);
    game.placeGuard(v(12, 0, -14), 0);
    game.setCamera(4.4, 3.1, 7.6, -9, 2.6, -46);
    game.hud.showBanner(s.banner, 60000);
    game.hud.setMission(st);
  }

  if (name === 'foot') {
    game.placePlayer(v(30, 0, 18), 0, true);
    st.inCar = false;
    game.placeHeroCar(v(10, 0, 30), Math.PI * 0.5, 0x2a2a2a, 'COMET S');
    game.placePolice([
      { pos: v(10, 0, 8), heading: 0, role: 'PURSUE' },
      { pos: v(12, 0, 26), heading: Math.PI, role: 'ROADBLOCK' },
    ]);
    game.placeHeli(v(40, 30, -20), false);
    game.placeDowned(v(29, 0, 13.5));
    game.placeGuard(v(24, 0, 10), Math.PI * 0.5);
    game.placeGuard(v(34, 0, 20), -Math.PI * 0.5);
    game.placeCrowd('market', 14);
    game.placeTraffic([{ pos: v(4, 0, -6), heading: 0, color: 0x7a68c9 }]);
    game.setCamera(30, 2.8, 26.5, 29, 1.8, 4);
    game.hud.showHint(s.hint);
    game.hud.setMission(st);
  }

  if (name === 'chase') {
    game.placeHeroCar(v(0, 0, 6), 0, 0xd21f2b, 'COMET S');
    st.inCar = true;
    game.placePlayer(v(2.5, 0, 12), 0, false);
    game.placePolice([
      { pos: v(-3.2, 0, 15), heading: 0, role: 'PURSUE' },
      { pos: v(3.6, 0, 19), heading: 0, role: 'PURSUE' },
      { pos: v(-2.5, 0, -10), heading: Math.PI, role: 'ROADBLOCK' },
      { pos: v(2.5, 0, -10), heading: Math.PI, role: 'ROADBLOCK' },
    ]);
    game.placeHeli(v(6, 13, -14));
    game.placeTraffic([
      { pos: v(-3, 0, -34), heading: 0, color: 0x4fa8c9 },
      { pos: v(3.2, 0, -44), heading: Math.PI, color: 0xe86a5a },
    ]);
    game.placeScooter(v(-7.4, 0, -2), 0);
    game.placeCrowd('sidewalk', 6);
    game.setCamera(2.6, 3.3, 16.5, -1, 1.6, -22);
    game.hud.showBanner(s.banner, 60000);
    game.hud.setMission(st);
  }

  // Refresh every HUD panel from the staged state.
  st.stageUnits(st.inCar ? game.heroCar.pos : game.player.pos, game.police);
  game.hud.setWanted(st);
  game.hud.setPolice(st);
  game.hud.setWeapons(st);
  game.hud.setVehicle(st);
  game.hud.drawMinimap(
    st.inCar ? game.heroCar.pos : game.player.pos,
    st.inCar ? game.heroCar.heading : game.player.heading,
    st.stage.target,
    game.police.filter((p) => p.group.visible).map((p) => p.pos),
  );
}
