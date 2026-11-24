// Solara Bay v18 — game data: districts, missions, weapons, crew, police, radio.
// All names, places and people are original to Solara Bay.
export const DISTRICTS = [
  { name: 'CORAL BAY', x: -30, z: 10, friendly: 82, color: '#2fa8c9' },
  { name: 'MARINA DISTRICT', x: -18, z: -52, friendly: 64, color: '#e8b13c' },
  { name: 'OLD TOWN', x: 34, z: 18, friendly: 71, color: '#c96a2f' },
  { name: 'NEON ROW', x: 40, z: -34, friendly: 58, color: '#d84fd8' },
  { name: 'PALM HEIGHTS', x: 52, z: -70, friendly: 47, color: '#4fc96a' },
  { name: 'THE DOCKS', x: -6, z: -86, friendly: 41, color: '#8a94a6' },
  { name: 'SUNSET STRIP', x: 12, z: -58, friendly: 77, color: '#ff7a3c' },
  { name: 'VICE POINT', x: 66, z: 6, friendly: 33, color: '#3c7dff' },
];

export const MISSIONS = [
  {
    id: 1, title: 'STEAL THE COMET', payout: 1200, rating: 'S',
    briefing: 'MK: Fresh Comet S parked on the Strip. Steal it, bring it to the marina lockup. Quiet and quick.',
    stages: [
      { text: 'REACH THE COMET', target: { x: 4, z: 10 }, kind: 'walk' },
      { text: 'DRIVE TO THE MARINA LOCKUP', target: { x: -2, z: -58 }, kind: 'drive' },
      { text: 'PARK INSIDE THE LOCKUP', target: { x: -2, z: -58 }, kind: 'arrive' },
    ],
    dialogue: { face: 'MK', text: 'Comet S is parked on the Strip, keys in it. Take it north — marina lockup, no cops, no fuss.' },
  },
  {
    id: 2, title: 'COLLECT THE DROP', payout: 2400, rating: 'G',
    briefing: 'UD: Package is under the FRUIT stall in Old Town market. Lookout is watching — take him out first.',
    stages: [
      { text: 'TAKE OUT THE LOOKOUT', target: { x: 30, z: 14 }, kind: 'fight' },
      { text: 'GRAB THE PACKAGE', target: { x: 28, z: 12 }, kind: 'collect' },
      { text: 'DELIVER TO THE DOCKS', target: { x: -6, z: -80 }, kind: 'drive' },
    ],
    dialogue: { face: 'UD', text: 'Package is under the FRUIT stall. Lookout is down — grab it and go.' },
  },
  {
    id: 3, title: 'OUTRUN THE SUNSET ROADBLOCK', payout: 3600, rating: 'G',
    briefing: 'KK: KPD set a roadblock on the Strip. Punch through it and lose the tail before the bridge.',
    stages: [
      { text: 'BREAK THE ROADBLOCK', target: { x: 0, z: -12 }, kind: 'drive' },
      { text: 'LOSE THE PURSUIT', target: { x: 12, z: -58 }, kind: 'escape' },
      { text: 'REACH THE SAFEHOUSE', target: { x: 52, z: -70 }, kind: 'arrive' },
    ],
    dialogue: { face: 'KK', text: 'Roadblock ahead on the Strip. Punch through — do not stop.' },
  },
  {
    id: 4, title: 'THE MARINA HEIST', payout: 5200, rating: 'B',
    briefing: 'MK: The Regent yacht holds a safe of casino chips. Board at the pier, crack it, get out by boat.',
    stages: [
      { text: 'BOARD THE REGENT YACHT', target: { x: -38, z: -55 }, kind: 'walk' },
      { text: 'CRACK THE SAFE', target: { x: -38, z: -55 }, kind: 'hold' },
      { text: 'ESCAPE BY SPEEDBOAT', target: { x: -60, z: -90 }, kind: 'drive' },
    ],
    dialogue: { face: 'MK', text: 'The Regent is loaded. Safe is below deck — crack it fast, the crew is armed.' },
  },
  {
    id: 5, title: 'NEON ROW RACE', payout: 4800, rating: 'S',
    briefing: 'PL: Three laps, Neon Row to Vice Point. Beat Vex or the crew eats ramen for a month.',
    stages: [
      { text: 'WIN LAP 1 OF 3', target: { x: 66, z: 6 }, kind: 'drive' },
      { text: 'WIN LAP 2 OF 3', target: { x: 40, z: -34 }, kind: 'drive' },
      { text: 'WIN THE RACE', target: { x: 66, z: 6 }, kind: 'drive' },
    ],
    dialogue: { face: 'PL', text: 'Vex is fast but sloppy. Brake late, cut the Neon Row corner — you have got this.' },
  },
  {
    id: 6, title: 'WRECK THE REGENT', payout: 7400, rating: '—',
    briefing: 'UD: The Regent is running for the marina. Wreck his car — the tank is ours. Borrowed.',
    stages: [
      { text: 'RAM THE CONVOY ESCORT', target: { x: 0, z: -24 }, kind: 'ram' },
      { text: 'WRECK THE REGENT', target: { x: -8, z: -44 }, kind: 'ram' },
      { text: 'ESCAPE THE AIR UNIT', target: { x: 12, z: -58 }, kind: 'escape' },
    ],
    dialogue: { face: 'UD', text: 'The Regent is running for the marina. Wreck his car — the tank is ours. Borrowed.' },
  },
  {
    id: 7, title: 'THE DOCKS STANDOFF', payout: 6100, rating: '—',
    briefing: 'KK: Dock crew turned on us. Hold the warehouse until Dee wipes the cameras.',
    stages: [
      { text: 'CLEAR THE WAREHOUSE', target: { x: -6, z: -86 }, kind: 'fight' },
      { text: 'HOLD UNTIL DEE FINISHES', target: { x: -6, z: -86 }, kind: 'hold' },
      { text: 'EXFIL TO THE BOULEVARD', target: { x: 0, z: -20 }, kind: 'drive' },
    ],
    dialogue: { face: 'KK', text: 'Hold the line. Dee needs ninety seconds on the cameras — do not let them through the door.' },
  },
  {
    id: 8, title: 'KING OF SOLARA BAY', payout: 12000, rating: '—',
    briefing: 'MK: Final job. Hit the Vice Point vault, outrun a 5-star lockdown, and the city is yours.',
    stages: [
      { text: 'BREACH THE VAULT', target: { x: 66, z: 6 }, kind: 'hold' },
      { text: 'OUTRUN THE LOCKDOWN', target: { x: 12, z: -58 }, kind: 'escape' },
      { text: 'REACH THE CROWN', target: { x: -30, z: 10 }, kind: 'arrive' },
    ],
    dialogue: { face: 'MK', text: 'One vault, five stars, one crown. Do this and Solara Bay is yours.' },
  },
];

export const WEAPONS = [
  { name: 'FISTS', dmg: 12, rng: 2, ammo: Infinity, reserve: Infinity },
  { name: 'P9 PISTOL', dmg: 25, rng: 42, ammo: 12, reserve: 96 },
  { name: 'VK SMG', dmg: 16, rng: 36, ammo: 32, reserve: 160 },
  { name: 'RIOT SHOTGUN', dmg: 22, rng: 20, ammo: 8, reserve: 40 },
  { name: 'AR-77 RIFLE', dmg: 34, rng: 70, ammo: 30, reserve: 150 },
  { name: 'LONGSHOT SNIPER', dmg: 95, rng: 120, ammo: 5, reserve: 20 },
];

export const CREW = [
  { initials: 'PL', name: 'PILAR', role: 'GETAWAY DRIVER', ability: 'PILAR GETAWAY', cooldown: 0 },
  { initials: 'DE', name: 'DEE', role: 'HACKER', ability: 'DEE ON 25S', cooldown: 25 },
  { initials: 'JN', name: 'JUNO', role: 'MUSCLE', ability: 'JUNO 30S', cooldown: 30 },
];

export const KPD_UNITS = [
  { callsign: 'CORAL-48', role: 'PURSUE' },
  { callsign: 'VICE-12', role: 'ROADBLOCK' },
  { callsign: 'NEON-07', role: 'PURSUE' },
  { callsign: 'DOCK-33', role: 'SEARCH' },
  { callsign: 'PALM-21', role: 'PURSUE' },
  { callsign: 'STRIP-09', role: 'ROADBLOCK' },
];

export const WANTED_LABELS = ['CLEAN', 'CHASED', 'HUNTED', 'HUNTED', 'AIR UNIT', 'LOCKDOWN'];

export const RADIO_TRACKS = [
  'SOLARA FM 98.6 — "Neon Coast" by The Palms',
  'SOLARA FM 98.6 — "Vice Point Nights" by Coral Static',
  'SOLARA FM 98.6 — "Marina Lights" by The Palms',
  'SOLARA FM 98.6 — "Sunset Strip" by Juno Keys',
];

export const POLICE_FEED = [
  'CORAL-48: shots fired in the Pasaru night market',
  'VICE-12: suspect vehicle northbound on the Strip',
  'NEON-07: roadblock holding at Sunset Strip',
  'DOCK-33: searching the marina, no visual',
  'AIR ONE: eyes on the suspect, boulevard north',
  'PALM-21: requesting backup, Coral Bay',
];

export const WORKSHOP_UPGRADES = [
  { name: 'ENGINE TUNE LV3', price: 4200, state: 'OWNED' },
  { name: 'NITRO BOOST', price: 2800, state: 'OWNED' },
  { name: 'ARMOUR PLATING', price: 3600, state: 'OWNED' },
  { name: 'CHROME TRIM', price: 1150, state: 'LOCKED' },
  { name: 'NEON UNDERGLOW', price: 900, state: 'OWNED' },
  { name: 'TURBO KIT', price: 6500, state: 'LOCKED' },
];

export const TRACKS = [
  { name: 'STORY MISSIONS', done: 5, total: 8 },
  { name: 'STREET RACES', done: 7, total: 12 },
  { name: 'STUNT JUMPS', done: 11, total: 20 },
  { name: 'COLLECTIBLES', done: 23, total: 50 },
  { name: 'EXPORT LIST', done: 4, total: 10 },
  { name: 'DISTRICT JOBS', done: 9, total: 16 },
  { name: 'DISTRICTS FRIENDLY', done: 5, total: 8 },
  { name: 'CREW RECRUITED', done: 3, total: 3 },
];

export const CAREER = [
  { name: 'CARS STOLEN', value: '47' },
  { name: 'COPS ESCAPED', value: '23' },
  { name: 'HIGHEST WANTED', value: '5 ★' },
  { name: 'DISTANCE DRIVEN', value: '312.4 KM' },
  { name: 'PEOPLE TAKEN OUT', value: '86' },
  { name: 'LONGEST JUMP', value: '41.2 M' },
  { name: 'HEADSHOTS', value: '19' },
  { name: 'PLAYTIME', value: '18.6 H' },
];

export const SAVE_SLOTS = [
  { slot: 1, filled: true, title: 'WRECK THE REGENT', cash: 21340, completion: 66.1, date: 'TUE 24 NOV 11:02' },
  { slot: 2, filled: false, title: '', cash: 0, completion: 0, date: '' },
  { slot: 3, filled: false, title: '', cash: 0, completion: 0, date: '' },
];

// Time-of-day palettes: one sun drives sky, fog, lights and clouds together.
export const DAY_PRESETS = {
  noon: {
    label: '12:00', sunElev: 78, sunColor: 0xfff6e0, sunIntensity: 2.6,
    zenith: '#2b7fe0', mid: '#7ec3f2', horizon: '#cfeaff', fog: '#bfe2f7',
    hemiSky: 0xbfdfff, hemiGround: 0x8a7a5a, hemiIntensity: 0.9, exposure: 1.05,
  },
  afternoon: {
    label: '14:30', sunElev: 55, sunColor: 0xffeec4, sunIntensity: 2.4,
    zenith: '#2f83dd', mid: '#82bdef', horizon: '#d8ecff', fog: '#c4e2f5',
    hemiSky: 0xbdd8f5, hemiGround: 0x8a7a5a, hemiIntensity: 0.85, exposure: 1.05,
  },
  sunset: {
    label: '17:45', sunElev: 14, sunColor: 0xffb36b, sunIntensity: 2.2,
    zenith: '#3a2a6e', mid: '#c94f5e', horizon: '#ff8a3c', fog: '#e0703c',
    hemiSky: 0x8a6a9a, hemiGround: 0x5a4a3a, hemiIntensity: 0.55, exposure: 1.1,
  },
  night: {
    label: '21:30', sunElev: -12, sunColor: 0x9ab8ff, sunIntensity: 0.5,
    zenith: '#060a24', mid: '#101a3e', horizon: '#2a2a55', fog: '#141a30',
    hemiSky: 0x2a3a6a, hemiGround: 0x1a1a22, hemiIntensity: 0.35, exposure: 1.0,
  },
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
