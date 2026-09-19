# Parth Shrestha — Portfolio

React + TypeScript + Vite + Tailwind, React Three Fiber, GSAP ScrollTrigger, and a small FastAPI content service. The project lives in `~/Desktop/parth-portfolio`.

## Run

Node 22.12+ (tested Node 23.10.0); Python 3.9+ (tested 3.9.10).

```sh
npm ci
npm run dev
python3 -m venv .venv
.venv/bin/pip install -r apps/api/requirements.lock.txt
.venv/bin/uvicorn main:app --app-dir apps/api --port 8000
```

Vite proxies `/api` to FastAPI in development. No secrets or database are needed.

```sh
npm run build
npm test
.venv/bin/pytest apps/api -q
```

## Editing content

`content/portfolio.json` is canonical. Zod validates the bundled frontend snapshot and API responses; Pydantic validates server startup content and endpoint responses. The page renders immediately from the snapshot, then tries the API with a 2.5 second timeout. API failures leave the snapshot intact. Rebuild after content edits.

Draft content was authorized by the owner for this initial release. Project names and stacks come from the brief. Case studies remain draft descriptions with no fabricated achievements. Add verified repository/demo links, actual screenshots, photography, full biography, and contact destinations to complete the content. Missing links are hidden.

## Portrait and animation

The portrait is generated from the supplied photograph and visual mockup. It is artistic interpretation, not a scanned 3D model. It is sampled once into GPU point buffers with stable seeded destinations. ScrollTrigger supplies one normalized progress value; the shader derives turn, dispersion, and fade directly from it. No time-driven dissolution or random target regeneration. Reverse scrolling reconstructs identical points. Rendering is demand-driven and stops without scroll/pointer changes; pointer updates stop after full dispersion.

The current surface has estimated relief depth. **A genuine full profile turn is outstanding** until a prepared owner-likeness head and hair mesh is supplied (`public/assets/hero/head.glb`). Do not describe the current shallow relief as a complete 3D head. The reference video has a full head rotating and transforming into strands; this version interprets its choreography with particles.

Motion can be disabled from the header; the preference is saved locally. System reduced-motion starts with the static portrait. WebGL/asset errors retain HTML content and the fallback image. The avatar is disabled; `experience.avatarEnabled`, stable section IDs, active navigation, normalized hero progress, and `#companion-overlay` are the Phase 2 hooks.

## Hosting

The current Sites deployment hosts the Vite **static frontend** (`dist`). FastAPI is included and tested locally but is **not running on Sites**, whose hosted runtime is Cloudflare Workers. The frontend's bundled snapshot makes the hosted site fully usable without it. To host FastAPI, deploy `apps/api` to a Python ASGI host with the canonical `content/` folder and proxy `/api` to it from the frontend's origin. No second backend has been created. `Dockerfile` runs the API and built frontend together on a Python-compatible host if preferred.

React Router handles project routes and unknown pages; Sites static hosting supplies SPA fallback. Per-project document titles update in the browser. Static HTML metadata is site-wide; use prerendering before requiring crawler-specific project social previews.

## Remaining content/assets

- Prepared 3D head/hair geometry and approval of artistic portrait likeness.
- Real project screenshots and complete architecture/results.
- Photography gallery images.
- Verified email, GitHub, LinkedIn, optional resume.
- Deployment of the Python service if a live API is required.

Cover images are generated illustrations, not project screenshots or photos of the owner's vehicle. See `docs/assets.md`.
