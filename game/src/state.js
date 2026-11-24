// Solara Bay v18 — game state: missions, wanted level, police dispatch,
// crew, saves and career stats. Pure logic, no rendering.
import { MISSIONS, WEAPONS, KPD_UNITS, WANTED_LABELS, SAVE_SLOTS } from './config.js';

export const SAVE_KEY = 'solara-bay-v18-saves';

export function loadSaves() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* storage unavailable in some embeds */ }
  return JSON.parse(JSON.stringify(SAVE_SLOTS));
}

export function storeSaves(slots) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(slots)); } catch (e) { /* ignore */ }
}

export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.cash = 0;
    this.rp = 1240;
    this.rank = 'STREET';
    this.wanted = 0;
    this.health = 100;
    this.armor = 55;
    this.weaponIndex = 1;
    this.ammo = WEAPONS.map((w) => w.ammo);
    this.reserve = WEAPONS.map((w) => w.reserve);
    this.missionIndex = 0;
    this.stageIndex = 0;
    this.missionTime = 180;
    this.missionActive = false;
    this.missionDone = false;
    this.missionFailed = false;
    this.completedMissions = [1, 2, 3, 4, 5];
    // Career snapshot: 5 of 8 missions done, partial credit on the mission in
    // progress, 66.1% overall story completion.
    this.completion = 66.1;
    this.ratings = { 1: 'S', 2: 'G', 3: 'G', 4: 'B', 5: 'S' };
    this.inCar = false;
    this.speedKmh = 0;
    this.condition = 100;
    this.vehicleName = 'ON FOOT';
    this.clockMinutes = 12 * 60;
    this.preset = 'noon';
    this.feedIndex = 0;
    this.feedText = '';
    this.feedTimer = 0;
    this.units = KPD_UNITS.map((u) => ({ ...u, distance: 0, active: false }));
    this.saves = loadSaves();
    this.career = {
      carsStolen: 47, copsEscaped: 23, highestWanted: 5, distanceDriven: 312.4,
      peopleTakenOut: 86, longestJump: 41.2, headshots: 19, playtime: 18.6,
    };
    this.holdTimer = 0;
    this.holdNeeded = 0;
  }

  get mission() { return MISSIONS[this.missionIndex]; }
  get stage() { return this.mission.stages[this.stageIndex]; }

  startMission(index) {
    this.missionIndex = index;
    this.stageIndex = 0;
    this.missionTime = 180;
    this.missionActive = true;
    this.missionDone = false;
    this.missionFailed = false;
    this.holdTimer = 0;
  }

  advanceStage() {
    this.stageIndex += 1;
    if (this.stageIndex >= this.mission.stages.length) this.completeMission();
  }

  completeMission() {
    this.missionActive = false;
    this.missionDone = true;
    this.cash += this.mission.payout;
    if (!this.completedMissions.includes(this.mission.id)) {
      this.completedMissions.push(this.mission.id);
      this.ratings[this.mission.id] = 'S';
      this.completion = Math.round((this.completedMissions.length / MISSIONS.length) * 1000) / 10;
    }
    this.rp += 240;
    this.wanted = Math.max(0, this.wanted - 1);
  }

  failMission(reason) {
    this.missionActive = false;
    this.missionFailed = true;
    this.failReason = reason;
  }

  addWanted(n) {
    this.wanted = Math.min(5, this.wanted + n);
    if (this.wanted > this.career.highestWanted) this.career.highestWanted = this.wanted;
  }

  wantedLabel() {
    if (this.wanted === 0) return 'WANTED 0 — CLEAN';
    const tag = this.wanted >= 4 ? 'AIR UNIT' : this.wanted >= 3 ? 'HUNTED' : 'CHASED';
    return `WANTED ${this.wanted} — ${tag}`;
  }

  activeUnitCount() {
    if (this.wanted === 0) return 0;
    return Math.min(2 + this.wanted, 6);
  }

  // Police dispatch: each active unit gets a role and a live distance from
  // the player; the air unit appears at wanted 4+.
  updateUnits(playerPos, unitPositions) {
    const n = this.activeUnitCount();
    for (let i = 0; i < this.units.length; i += 1) {
      const u = this.units[i];
      u.active = i < n;
      if (!u.active) continue;
      const p = unitPositions[i];
      if (p) {
        const dx = p.x - playerPos.x;
        const dz = p.z - playerPos.z;
        u.distance = Math.round(Math.sqrt(dx * dx + dz * dz));
      }
    }
    return this.units.filter((u) => u.active);
  }

  // Staged dispatch: only the police cars actually placed for this shot are
  // listed, with live distances from the player.
  stageUnits(playerPos, police) {
    for (let i = 0; i < this.units.length; i += 1) {
      const u = this.units[i];
      const p = police[i];
      u.active = !!(p && p.group.visible);
      if (!u.active) continue;
      const dx = p.pos.x - playerPos.x;
      const dz = p.pos.z - playerPos.z;
      u.distance = Math.round(Math.sqrt(dx * dx + dz * dz));
    }
  }

  reloadWeapon() {
    const w = WEAPONS[this.weaponIndex];
    if (w.ammo === Infinity) return;
    const need = w.ammo - this.ammo[this.weaponIndex];
    const take = Math.min(need, this.reserve[this.weaponIndex]);
    this.ammo[this.weaponIndex] += take;
    this.reserve[this.weaponIndex] -= take;
  }

  shoot() {
    const w = WEAPONS[this.weaponIndex];
    if (w.ammo === Infinity) return true;
    if (this.ammo[this.weaponIndex] <= 0) return false;
    this.ammo[this.weaponIndex] -= 1;
    return true;
  }

  quickSave() {
    const slot = this.saves[0];
    slot.filled = true;
    slot.title = this.mission.title;
    slot.cash = this.cash;
    slot.completion = this.completion;
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    slot.date = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    storeSaves(this.saves);
    return slot;
  }

  update(dt) {
    if (this.missionActive) {
      this.missionTime -= dt;
      if (this.missionTime <= 0) {
        this.missionTime = 0;
        this.failMission('TIME UP');
      }
    }
    this.feedTimer -= dt;
    if (this.feedTimer <= 0 && this.wanted > 0) {
      this.feedTimer = 7;
      this.feedIndex = (this.feedIndex + 1) % 6;
    }
    // Wanted decays slowly when the player is out of sight and on foot calm.
    if (this.wanted > 0 && !this.missionActive) {
      this.wantedDecay = (this.wantedDecay || 0) + dt;
      if (this.wantedDecay > 45) {
        this.wantedDecay = 0;
        this.wanted -= 1;
      }
    }
    this.clockMinutes = (this.clockMinutes + dt / 60) % (24 * 60);
  }

  clockString() {
    const h = Math.floor(this.clockMinutes / 60);
    const m = Math.floor(this.clockMinutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  missionTimerString() {
    const t = Math.max(0, Math.ceil(this.missionTime));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }

  stageProgress() {
    return Math.min(1, (this.stageIndex + 1) / this.mission.stages.length);
  }
}
