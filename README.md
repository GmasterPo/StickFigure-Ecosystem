# StickFigure Animation Ecosystem

Four independent, MIT-licensed repositories of stick-figure animation assets and JavaScript systems for HTML5 games — Canvas,
SVG, sprite sheets and JSON, with no dependencies and no build step required at runtime.

**85 clips · ~61 seconds of animation · 25 sprite atlases · 8 playable examples · one shared rig.**

The goal is motion that reads as fluid and intentional rather than a stiff mannequin: every clip is authored on the same
18-bone humanoid, with eased keyframes, weight shift, follow-through and a procedural fallback for anything continuous.

## The repositories

| Repository | What it is | Clips | Extras |
| --- | --- | --- | --- |
| [StickFigure-Animation-Engine](https://github.com/GmasterPo/StickFigure-Animation-Engine) | The foundation: rig, clip format, state machine, blending, procedural motion, Canvas/SVG renderers, sprite sheets, asset baking | 6 demos | 100 exports, single-file bundle, software rasteriser |
| [StickFigure-Combat](https://github.com/GmasterPo/StickFigure-Combat) | Punches, kicks, combos, blocks, counters, dodges, grapples, throws, knockdowns, KOs, weapons, air attacks, finishers | 44 | Frame data, hitboxes, two-fighter runtime, AI |
| [StickFigure-Movement](https://github.com/GmasterPo/StickFigure-Movement) | Idle, walk, run, sprint, jump, land, slide, roll, climb, wall jump, parkour, turning | 21 | Platformer controller, level format, input helper |
| [StickFigure-Physics](https://github.com/GmasterPo/StickFigure-Physics) | Ragdolls, joints, collision response, knockback, momentum, gravity, balance, falls, recovery, environments | 14 | Verlet simulation, balance meter, damage→reaction mapping |

Each repository is complete and self-contained: `README.md`, `LICENSE`, `ATTRIBUTION.md`, `manifest.json`,
`documentation/`, `examples/`, `animations/`, `assets/` and source. None of them imports another at runtime — Combat, Movement
and Physics carry a compiled copy of the engine at `vendor/stickfigure-engine.mjs`.

## How they fit together

```text
                 ┌──────────────────────────────┐
                 │ StickFigure-Animation-Engine │  rig · clips · state machine · renderers
                 └──────────────┬───────────────┘
        vendor/ copy            │            vendor/ copy
     ┌──────────────────────────┼──────────────────────────┐
     ▼                          ▼                          ▼
┌─────────────┐          ┌─────────────┐          ┌─────────────┐
│   Combat    │          │  Movement   │          │   Physics   │
│ fight rules │          │ platformer  │          │ ragdolls    │
└─────────────┘          └─────────────┘          └─────────────┘
```

A typical game uses the engine plus one or two of the others:

- **Fighting game** — Combat for rules and frame data, Physics for KOs and knockdowns.
- **Platformer** — Movement for the controller and clips, Engine for effects and props.
- **Cinematic scene** — Engine alone: procedural motion, blending, SVG or Canvas output.
- **Asset pipeline** — Engine's `tools/bake-lib.mjs` bakes any clip set to JSON, SVG and PNG.

All four share:

- Rig `stick-humanoid`: 18 bones, angle deltas in degrees, neutral pose `BASIC_POSE`, hip at `y = 0`, feet near `y = +44`.
- Clip format `stickfigure-clip` v1.0: sparse keyframes, per-key easing, root channels, events.
- Manifest `stickfigure-manifest` v1.0: searchable by action, style, complexity, tags, license and format.
- Bake settings: 20 fps, 128 px cells, 0.7 scale, origin `(64, 82)`, 8 columns.
- License MIT, original motion, zero dependencies.

## Quick start

Every repository runs the same way and needs no `npm install`:

```bash
git clone https://github.com/GmasterPo/StickFigure-Combat
cd StickFigure-Combat
npm test      # structural + behavioural checks
npm start     # http://localhost:5173/examples/fight-demo.html
```

| Repository | Test command | Examples |
| --- | --- | --- |
| Engine | `node tests/smoke.mjs` — 15 checks | `state-machine.html`, `renderers.html` |
| Combat | `node tests/smoke.mjs` — 15 checks | `fight-demo.html`, `move-browser.html` |
| Movement | `node tests/smoke.mjs` — 13 checks | `platformer.html`, `locomotion-blend.html` |
| Physics | `node tests/smoke.mjs` — 8 checks | `ragdoll-playground.html`, `balance-lab.html` |

`npm start` runs each repository's own 40-line static server. The examples are ES modules and use `fetch`, so they need HTTP.

## Minimal usage

Paths in these snippets assume the repositories are cloned side by side into your project.

```js
import { CanvasRenderer, AnimationClip, AnimationStateMachine } from './StickFigure-Animation-Engine/src/index.js';

const renderer = new CanvasRenderer(canvas);
const idle = AnimationClip.fromJSON(await (await fetch('./animations/idle-breathe.json')).json());
const walk = AnimationClip.fromJSON(await (await fetch('./animations/walk-loop.json')).json());
const run = AnimationClip.fromJSON(await (await fetch('./animations/run-loop.json')).json());

const sm = new AnimationStateMachine({
  clips: { idle, walk, run },
  initial: 'idle',
  parameters: { speed: 0 },
  states: {
    idle: { clip: 'idle', transitions: [{ to: 'walk', when: { param: 'speed', gte: 10 } }] },
    walk: { clip: 'walk', transitions: [{ to: 'run', when: { param: 'speed', gte: 160 }, duration: 0.15 }, { to: 'idle', when: { param: 'speed', lt: 10 } }] },
    run: { clip: 'run', transitions: [{ to: 'walk', when: { param: 'speed', lt: 140 } }] },
  },
});

sm.setParameter('speed', player.speed);
sm.update(dt);
renderer.draw(sm.pose, { x: player.screenX, y: player.screenY, scale: 2, facing: player.facing });
```

## Finding an animation

Each manifest is the index. The same queries work in every repository:

```js
import { searchManifest } from './StickFigure-Animation-Engine/src/index.js';
const manifest = await (await fetch('./manifest.json')).json();

searchManifest(manifest, { text: 'kick' });
searchManifest(manifest, { action: 'punches', maxComplexity: 2 });
searchManifest(manifest, { tag: 'loop', format: 'svg' });
```

Combat entries also carry `moves` (startup / active / recovery, damage, hitstun, knockback, hitboxes, cancels), so an AI agent
or a training mode can read frame data without opening a clip.

## Machine-readable index

[`ecosystem.json`](ecosystem.json) (raw: <https://raw.githubusercontent.com/GmasterPo/StickFigure-Ecosystem/main/ecosystem.json>)
lists every repository, its clip count, manifest path, entry points, examples, docs and the shared conventions — the fastest way for a tool or agent to discover the ecosystem without crawling four folders.

## Using this with an AI coding agent

Point the agent at this README and the relevant repository's `manifest.json` + `documentation/`. The useful facts are all
declared, not implied:

- `skeleton: "stick-humanoid"`, `format: "stickfigure-clip"` — no guessing at the rig.
- `files.json` / `files.svg` / `files.spritesheet` — exact relative paths per animation.
- `license`, `source`, `attribution` per clip — provenance is never ambiguous.
- `moves` frame data — combat timing is data, not folklore.

A good prompt: *“Use StickFigure-Combat's manifest to find a fast high punch with less than 0.12 s startup, then implement it
with Fighter and CombatSession; render with CanvasRenderer at scale 2.”*

## Where these repositories live

All four are published as independent repositories under the [GmasterPo](https://github.com/GmasterPo) account:

- https://github.com/GmasterPo/StickFigure-Animation-Engine
- https://github.com/GmasterPo/StickFigure-Combat
- https://github.com/GmasterPo/StickFigure-Movement
- https://github.com/GmasterPo/StickFigure-Physics

This repository holds the index — this README, [`ecosystem.json`](ecosystem.json) and the `tools/` check that keeps them
consistent. Each of the four can be cloned and run on its own; nothing here is required to use them.

`tools/check-sync.mjs` is a drift check for a workspace with all five repositories cloned side by side: it verifies that the
workspace-root `README.md` and `ecosystem.json` are links to these files rather than copies, that the manifest totals still
agree with the per-repository counts, and repairs broken links.

```bash
node tools/check-sync.mjs          # exit 1 on drift
node tools/check-sync.mjs --fix    # relink the workspace root
```

## Licensing

MIT across all four repositories. Every clip, poster and sprite sheet is original work authored in-repo; no third-party
assets are included. See each repository's `ATTRIBUTION.md` for provenance and `LICENSE` for terms.

## Status and scope

- Verified: 51 automated checks across the four repositories (15 + 15 + 13 + 8) covering rig maths, clip validity, manifests,
  hitbox resolution, controller states, collisions, ragdoll stability and balance.
- Rendered and visually reviewed: contact sheets for combat poses and clips during development.
- Not verified: the eight HTML examples were syntax-checked and are served by the included static server, but their browser
  interactions were not clicked through end-to-end in an automated browser.
- Not included: audio, backgrounds, UI kits, networking/rollback netcode or a game engine wrapper. Those are integration
  concerns, deliberately left to the host project.
