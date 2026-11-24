// Solara Bay v18 — HUD: mission card, wanted stars, cash, KPD panel, crew
// chips, weapon slots, circular minimap, speed panel, dialogue, and the full
// MAP/STATS meta screen with a real 8-district city map.
import { DISTRICTS, WEAPONS, CREW, TRACKS, CAREER, WORKSHOP_UPGRADES, POLICE_FEED } from './config.js';

const $ = (id) => document.getElementById(id);

function fmtCash(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export class Hud {
  constructor() {
    this.minimap = $('minimap');
    this.mm = this.minimap.getContext('2d');
    this.citymap = $('citymap');
    this.cm = this.citymap.getContext('2d');
    this.metaOpen = false;
    this.buildWeapons();
    this.buildCrew();
    this.buildMetaTabs();
    this.buildProgressTracks();
    this.buildRatings();
    this.buildCareer();
    this.buildWorkshop();
    this.buildGear();
    this.buildCrewList();
    this.renderSaves();
  }

  buildWeapons() {
    const panel = $('weapons-panel');
    panel.innerHTML = '';
    WEAPONS.forEach((w, i) => {
      const row = document.createElement('div');
      row.className = 'wrow';
      row.id = `weapon-${i}`;
      row.innerHTML = `<span>${w.name}</span><span class="ammo" id="ammo-${i}"></span>`;
      panel.appendChild(row);
    });
  }

  buildCrew() {
    const wrap = $('crew-chips');
    wrap.innerHTML = '';
    for (const c of CREW) {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `<div class="face">${c.initials}</div><span>${c.name}</span><span class="cd">${c.ability}</span>`;
      wrap.appendChild(chip);
    }
  }

  buildMetaTabs() {
    const tabs = $('meta-tabs');
    tabs.innerHTML = '';
    for (const t of ['MAP', 'STORY', 'STATS', 'CREW', 'SETTINGS', 'CONTROLS', 'SAVE']) {
      const el = document.createElement('div');
      el.className = 'tab' + (t === 'MAP' ? ' active' : '');
      el.textContent = t;
      tabs.appendChild(el);
    }
  }

  buildProgressTracks() {
    const box = $('progress-tracks');
    box.innerHTML = '';
    for (const t of TRACKS) {
      const row = document.createElement('div');
      row.className = 'trow';
      const pct = Math.round((t.done / t.total) * 100);
      row.innerHTML = `<span class="tlabel">${t.name}</span><div class="tbar"><div style="width:${pct}%"></div></div><span class="tval">${t.done}/${t.total}</span>`;
      box.appendChild(row);
    }
  }

  buildRatings() {
    const box = $('mission-ratings');
    box.innerHTML = '';
    const ratings = { 1: 'S', 2: 'G', 3: 'G', 4: 'B', 5: 'S', 6: '—', 7: '—', 8: '—' };
    for (let m = 1; m <= 8; m += 1) {
      const chip = document.createElement('div');
      chip.className = 'rate-chip' + (ratings[m] === 'S' ? ' gold' : '');
      chip.innerHTML = `${ratings[m]}<span class="mnum">M${m}</span>`;
      box.appendChild(chip);
    }
  }

  buildCareer() {
    const box = $('career-stats');
    box.innerHTML = '';
    for (const c of CAREER) {
      const row = document.createElement('div');
      row.className = 'trow';
      row.innerHTML = `<span class="tlabel">${c.name}</span><span class="tval">${c.value}</span>`;
      box.appendChild(row);
    }
  }

  buildWorkshop() {
    const box = $('workshop');
    box.innerHTML = '';
    for (const u of WORKSHOP_UPGRADES) {
      const row = document.createElement('div');
      row.className = 'trow';
      row.innerHTML = `<span class="tlabel">${u.name}</span><span class="tval">$${u.price.toLocaleString('en-US')}</span><span class="tval" style="color:${u.state === 'OWNED' ? '#7dff8a' : '#9fc3e8'}">${u.state}</span>`;
      box.appendChild(row);
    }
    const quote = document.createElement('div');
    quote.style.cssText = 'margin-top:10px;color:#cfe0f2;font-style:italic;font-size:12px;';
    quote.textContent = '"You break it, I bill it." — MARCO, MECHANIC';
    box.appendChild(quote);
  }

  buildGear() {
    const box = $('gear-list');
    box.innerHTML = '';
    for (const w of WEAPONS) {
      const row = document.createElement('div');
      row.className = 'trow';
      row.innerHTML = `<span class="tlabel">${w.name}</span><span class="tval">DMG ${w.dmg} • RNG ${w.rng}M</span>`;
      box.appendChild(row);
    }
  }

  buildCrewList() {
    const box = $('crew-list');
    box.innerHTML = '';
    for (const c of CREW) {
      const row = document.createElement('div');
      row.className = 'trow';
      row.innerHTML = `<span class="tlabel">${c.initials} ${c.name} — ${c.role}</span>`;
      box.appendChild(row);
    }
  }

  renderSaves() {
    const box = $('save-slots');
    box.innerHTML = '';
    // Save slot data comes from state at show time; default render uses the
    // staged career snapshot so the meta screen is complete on first open.
    const slots = window.__solaraSaves || null;
    const data = slots || [
      { slot: 1, filled: true, title: 'WRECK THE REGENT', cash: 21340, completion: 66.1, date: 'TUE 24 NOV 11:02' },
      { slot: 2, filled: false, title: '', cash: 0, completion: 0, date: '' },
      { slot: 3, filled: false, title: '', cash: 0, completion: 0, date: '' },
    ];
    for (const s of data) {
      const el = document.createElement('div');
      el.className = 'slot' + (s.filled ? ' filled' : '');
      el.innerHTML = s.filled
        ? `<div class="sname">SAVE SLOT ${s.slot} — FILLED</div><div class="sdetail">${s.title} • ${fmtCash(s.cash)} • ${s.completion}%</div><div class="sdate">${s.date}</div>`
        : `<div class="sname">SAVE SLOT ${s.slot} — EMPTY</div><div class="sdetail" style="color:#9fc3e8">No save yet</div>`;
      box.appendChild(el);
    }
  }

  setMission(state) {
    const m = state.mission;
    const stage = state.stage || m.stages[m.stages.length - 1];
    const stageNum = Math.min(state.stageIndex + 1, m.stages.length);
    $('mission-title').textContent = `MISSION ${m.id} "${m.title}"`;
    $('mission-stage').textContent = `STAGE ${stageNum}/${m.stages.length}  ${state.missionTimerString()}`;
    $('stage-fill').style.width = `${Math.round(state.stageProgress() * 100)}%`;
    $('mission-next').textContent = `NEXT: ${stage.text}`;
    $('dialogue-face').textContent = m.dialogue.face;
    $('dialogue-text').textContent = m.dialogue.text;
  }

  setWanted(state) {
    const stars = $('wanted-stars');
    let html = '';
    for (let i = 0; i < 5; i += 1) html += i < state.wanted ? '★' : '<span class="off">★</span>';
    stars.innerHTML = html;
    $('wanted-label').textContent = state.wantedLabel();
    $('cash').textContent = fmtCash(state.cash);
    $('rp-fill').style.width = `${Math.min(100, (state.rp % 2000) / 20)}%`;
    $('rank-line').textContent = `RANK ${state.rank} • RP ${state.rp}`;
    $('clock').textContent = state.clockString();
    $('air-banner').classList.toggle('hidden', state.wanted < 4);
  }

  setPolice(state) {
    const active = state.units.filter((u) => u.active);
    $('unit-count').textContent = `${active.length} UNIT${active.length === 1 ? '' : 'S'}`;
    const list = $('unit-list');
    list.innerHTML = '';
    const roleClass = { PURSUE: 'role-pursue', ROADBLOCK: 'role-roadblock', SEARCH: 'role-search', AIR: 'role-air' };
    for (const u of active) {
      const row = document.createElement('div');
      row.innerHTML = `<span>${u.callsign}</span><span class="${roleClass[u.role] || ''}">${u.role}</span><span>${u.distance}m</span>`;
      list.appendChild(row);
    }
    if (state.wanted >= 4 && !active.some((u) => u.callsign === 'AIR-1')) {
      const row = document.createElement('div');
      row.innerHTML = `<span>AIR-1</span><span class="role-air">AIR UNIT</span><span>—</span>`;
      list.appendChild(row);
    }
    $('police-feed').textContent = state.wanted > 0 ? POLICE_FEED[state.feedIndex % POLICE_FEED.length] : '';
    $('police-panel').style.display = state.wanted > 0 ? '' : 'none';
  }

  setWeapons(state) {
    WEAPONS.forEach((w, i) => {
      const row = $(`weapon-${i}`);
      if (row) row.classList.toggle('sel', i === state.weaponIndex);
      const ammo = $(`ammo-${i}`);
      if (ammo) {
        ammo.textContent = w.ammo === Infinity ? '∞' : `${state.ammo[i]} / ${state.reserve[i]}`;
      }
    });
  }

  setVehicle(state) {
    $('speed').innerHTML = `${Math.round(state.speedKmh)} <span>KM/H</span>`;
    $('vehicle-name').textContent = state.vehicleName;
    $('vehicle-cond').textContent = state.inCar
      ? `${Math.round(state.condition)}% ${state.condition < 70 ? 'DENTED' : 'CLEAN'}`
      : 'ON FOOT — NO VEHICLE';
    $('cond-fill').style.width = state.inCar ? `${state.condition}%` : '0%';
    $('health-fill').style.width = `${state.health}%`;
    $('armor-fill').style.width = `${state.armor}%`;
  }

  showBanner(text, ms = 2600) {
    const b = $('center-banner');
    b.textContent = text;
    b.classList.remove('hidden');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => b.classList.add('hidden'), ms);
  }

  showHint(text) {
    const h = $('hint-line');
    h.textContent = text;
    h.classList.remove('hidden');
  }

  hideHint() { $('hint-line').classList.add('hidden'); }

  showToast(text, ms = 2200) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  showMissionResult(win, payout, rating) {
    const el = $('mission-result');
    el.innerHTML = win
      ? `<div class="big">MISSION COMPLETE</div><div class="pay">+$${payout.toLocaleString('en-US')}</div><div class="sub">RATING ${rating} • RP +240</div>`
      : `<div class="big" style="color:#ff5c5c">MISSION FAILED</div><div class="sub">Try again — the crew is waiting.</div>`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4200);
  }

  // Circular minimap: ocean west, boulevard spine, district dots, route line,
  // mission marker, player arrow, police blips.
  drawMinimap(playerPos, heading, missionTarget, policePositions) {
    const g = this.mm;
    const W = 220, H = 220, C = 110, R = 108;
    g.clearRect(0, 0, W, H);
    g.save();
    g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.clip();
    // Land + ocean.
    g.fillStyle = '#0e2c44'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1e7fb8'; g.fillRect(0, 0, 62, H);
    g.fillStyle = '#e8cf9a'; g.fillRect(62, 0, 8, H);
    g.fillStyle = '#20262e'; g.fillRect(70, 0, W - 70, H);
    // City blocks.
    g.fillStyle = '#3a4a5e';
    for (let i = 0; i < 14; i += 1) {
      const bx = 78 + (i % 4) * 36 + (i % 2) * 6;
      const by = 14 + Math.floor(i / 4) * 48;
      g.fillRect(bx, by, 26, 34);
    }
    // Boulevard + cross streets.
    g.strokeStyle = '#c8c8c8'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(96, 0); g.lineTo(96, H); g.stroke();
    g.strokeStyle = '#5a6a7a'; g.lineWidth = 3;
    for (const y of [44, 96, 148, 190]) { g.beginPath(); g.moveTo(70, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#e8c33c'; g.lineWidth = 1.5;
    g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(96, 0); g.lineTo(96, H); g.stroke();
    g.setLineDash([]);
    // World → map transform: world x [-100..100] → map [0..220], z [-120..60] → [0..220].
    const mx = (x) => ((x + 100) / 200) * W;
    const mz = (z) => ((z + 120) / 180) * H;
    // District labels.
    g.fillStyle = '#e8f2ff'; g.font = '700 7px Arial'; g.textAlign = 'left';
    const labels = [
      ['SUNSET STRIP', 96, 30], ['PALM HEIGHTS', 136, 50], ['NEON ROW', 130, 96],
      ['OLD TOWN', 118, 150], ['CORAL BAY', 26, 170], ['MARINA DISTRICT', 30, 70],
    ];
    for (const [t, x, y] of labels) g.fillText(t, x, y);
    // District dots.
    for (const d of DISTRICTS) {
      g.fillStyle = d.color;
      g.beginPath(); g.arc(mx(d.x), mz(d.z), 3, 0, Math.PI * 2); g.fill();
    }
    // Route line to the mission target.
    if (missionTarget) {
      g.strokeStyle = '#ffc93c'; g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(mx(playerPos.x), mz(playerPos.z));
      g.lineTo(mx(missionTarget.x), mz(missionTarget.z)); g.stroke();
      g.fillStyle = '#ffc93c';
      g.beginPath(); g.arc(mx(missionTarget.x), mz(missionTarget.z), 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#111';
      g.font = '900 8px Arial'; g.textAlign = 'center';
      g.fillText('★', mx(missionTarget.x), mz(missionTarget.z) + 3);
    }
    // Police blips.
    g.fillStyle = '#ff4f4f';
    for (const p of policePositions || []) {
      g.beginPath(); g.arc(mx(p.x), mz(p.z), 3.5, 0, Math.PI * 2); g.fill();
    }
    // Player arrow: heading 0 is north (up on the map), so rotate by -heading.
    const px = mx(playerPos.x), pz = mz(playerPos.z);
    g.save();
    g.translate(px, pz);
    g.rotate(-heading);
    g.fillStyle = '#ffffff';
    g.strokeStyle = '#111'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 7); g.lineTo(0, 4); g.lineTo(-6, 7); g.closePath();
    g.fill(); g.stroke();
    g.restore();
    g.restore();
    // Rim.
    g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 3;
    g.beginPath(); g.arc(C, C, R - 1, 0, Math.PI * 2); g.stroke();
  }

  // Full city map for the meta screen: 8 districts, friendly meters, markers.
  drawCityMap() {
    const g = this.cm;
    const W = 560, H = 240, LAND = 110;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#0e2c44'; g.fillRect(0, 0, W, H);
    // Ocean west + beach.
    g.fillStyle = '#1e7fb8'; g.fillRect(0, LAND + 12, W, H - LAND - 12);
    g.fillStyle = '#e8cf9a'; g.fillRect(0, LAND, W, 12);
    g.fillStyle = '#20262e'; g.fillRect(0, 0, W, LAND);
    // City blocks.
    g.fillStyle = '#33465e';
    for (let i = 0; i < 18; i += 1) {
      g.fillRect(30 + (i % 6) * 88, 10 + Math.floor(i / 6) * 30, 70, 20);
    }
    // Boulevard + roads.
    g.strokeStyle = '#c8c8c8'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(120, 0); g.lineTo(120, LAND); g.stroke();
    g.strokeStyle = '#5a6a7a'; g.lineWidth = 3;
    for (const y of [30, 62, 92]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.strokeStyle = '#e8c33c'; g.lineWidth = 1.5; g.setLineDash([8, 8]);
    g.beginPath(); g.moveTo(120, 0); g.lineTo(120, LAND); g.stroke();
    g.setLineDash([]);
    const mx = (x) => ((x + 100) / 200) * W;
    const mz = (z) => ((z + 120) / 180) * LAND;
    // One line per district: name + friendly %, flipped left when near the
    // edge, staggered above/below so the clustered marina dots stay readable.
    const LABEL_SPOT = {
      'THE DOCKS': { dx: 10, dy: -9, align: 'left' },
      'MARINA DISTRICT': { dx: 10, dy: 16, align: 'left' },
      'SUNSET STRIP': { dx: 10, dy: -13, align: 'left' },
      'PALM HEIGHTS': { dx: -10, dy: 19, align: 'right' },
      'NEON ROW': { dx: 10, dy: -13, align: 'left' },
      'CORAL BAY': { dx: 10, dy: 4, align: 'left' },
      'OLD TOWN': { dx: 10, dy: 11, align: 'left' },
      'VICE POINT': { dx: -10, dy: -4, align: 'right' },
    };
    g.font = '700 9px Arial';
    for (const d of DISTRICTS) {
      const x = mx(d.x), y = mz(d.z);
      g.fillStyle = d.color;
      g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      const label = `${d.name} — ${d.friendly}%`;
      const spot = LABEL_SPOT[d.name] || { dx: 10, dy: 4, align: 'left' };
      g.textAlign = spot.align;
      g.fillText(label, x + spot.dx, y + spot.dy);
    }
    // Player + mission markers.
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(mx(0), mz(-4), 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffc93c';
    g.beginPath(); g.arc(mx(-8), mz(-44), 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.font = '900 8px Arial'; g.textAlign = 'center';
    g.fillText('★', mx(-8), mz(-44) + 3);
    // Ocean label.
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '700 12px Arial'; g.textAlign = 'left';
    g.fillText('CORAL SEA — MARINA', 16, H - 14);
  }

  showMeta(state) {
    this.metaOpen = true;
    $('meta-screen').classList.remove('hidden');
    $('meta-cash').textContent = '$' + Math.round(state.cash).toLocaleString('en-US');
    const ring = $('ring-fg');
    const circ = 326.7;
    ring.style.strokeDashoffset = String(circ * (1 - state.completion / 100));
    $('ring-text').textContent = `${state.completion}%`;
    $('completion-title').textContent = `STORY ${state.completion}%`;
    $('completion-sub').innerHTML = `${state.completedMissions.length} of 8 missions complete<br>Gold ratings: 2`;
    window.__solaraSaves = state.saves;
    this.renderSaves();
    this.drawCityMap();
  }

  hideMeta() {
    this.metaOpen = false;
    $('meta-screen').classList.add('hidden');
  }
}
