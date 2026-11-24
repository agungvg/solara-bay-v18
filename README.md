<!-- Solara Bay v18 — fix pass: rewritten by the recorded agent. -->
[![gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/c/gta6-01)
[![rank](https://make.fun/badge/gta6-01/agungvg/solara-bay-v18/rank.svg)](https://make.fun/c/gta6-01)
[![reward](https://make.fun/badge/gta6-01/agungvg/solara-bay-v18/reward.svg)](https://make.fun/c/gta6-01)

# Solara Bay v18 — Open-World Crime

A GTA 6-style open-world crime game for the [make.fun gta6-01 bounty](https://make.fun/c/gta6-01), built from zero in Three.js. Explore the sun-soaked Leonida coast city of Solara Bay on foot and by car, steal cars, run 8 story missions with your crew (Pilar, Dee, Juno), outrun the KPD wanted system — patrol cars, roadblocks, the Air One helicopter and tank support — and become King of Solara Bay.

## What's in the game

- **City** — 8 named districts (Coral Bay, Marina District, Old Town, Neon Row, Palm Heights, The Docks, Sunset Strip, Vice Point), beachfront boulevard, ocean + marina with a big yacht, the Solara Ferris wheel, Old Town fruit market, neon signs, slim palms, traffic and crowds.
- **Driving** — arcade handling, steal any car (E), rounded hero cars, traffic, scooter, tank.
- **Wanted** — 6 levels (0 CLEAN … 5 LOCKDOWN), police state machine (patrol → pursue → search → recover), named KPD units with roles and live distances, helicopter with searchlight cone.
- **Missions** — 8 story missions with staged objectives, timers and payouts, dialogue, mission markers on the minimap.
- **Combat** — 6 weapon slots with ammo, reload, tracers, armed guards, downed enemies with a pulsing ring.
- **Systems** — 3-person crew with abilities, workshop upgrades + weapons & gear, 3 save slots (localStorage), synth audio (engine, sirens, gunshots, radio), day presets (noon / afternoon / golden-hour sunset), MAP/STATS meta screen with a real city map and 66.1% completion ring.
- **Screenshots** — 4 staged frames: beachfront chase (Mission 6, big yacht + ocean), market foot mission (Mission 2), sunset roadblock chase (Mission 3), MAP/STATS screen.

## Play it

Serve `game/` from any static server (it loads offline, no network requests):

```sh
node serve.ts
# open http://localhost:8080
```

Controls: WASD drive/walk, E enter & exit car, mouse aim + click to shoot, 1–6 weapons, R reload, M map & stats, F9 quick save, ENTER start, ESC pause.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `game/` + `screenshots/` to the output dir and writes `dossier.json` with the vendored make.fun library. Check it with the level-34 kit:

```sh
node cli/makefun.mjs check --kit . --repo <your repository>
```

## License

MIT — see [LICENSE](LICENSE).
