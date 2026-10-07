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

Content is drawn from the owner's resume (`Parth_Shrestha_Claude_corps.pdf`, 2026-10-04): the biography, the five projects and their case studies, the four experience entries, skills, education and certifications are all taken from it, with no fabricated achievements. Live site links are set for The Luthier's Library, LensHive and Shrestha Media and each was checked for a 200 response on 2026-10-04; they render as "Go live" buttons on the project card and project page. Repository links are still absent, and missing links are hidden. The resume's phone number is deliberately not published, and the schema has no field for it.

Beyond `owner`, `projects`, `interests` and `contact`, the schema carries `experience`, `education`, `certifications` and `skills`. All four default to empty and render only when populated, so older content without them stays valid. The About section renders them below the biography.

## Portrait and animation

The hero uses one static asset, `apps/web/public/assets/hero/portrait-fallback.webp`, three ways: as the accessible `<img>` that shows first and whenever graphics are unavailable, as the sampling source for the particles, and as the layout box the particles are drawn over.

**Sampling.** On load, `apps/web/src/features/hero/sampler.ts` finds every dot of the stippled artwork (local maxima of the smoothed luminance; about 14k dots on the current portrait, roughly 50 ms) and turns each one into a particle with a fixed source position, a radius taken from the dot's size, a left-to-right `order`, and four seeded randoms. Nothing is regenerated afterwards, so particle identity is stable across frames, resizes and reloads. The served WebP has a transparent background (see `docs/assets.md` for how it is derived from the PNG master); the sampler composites it over black before reading, so a black-background replacement works too.

**Scroll timeline.** GSAP ScrollTrigger supplies one normalized progress value for the 240svh hero region, and the canvas renderer in `apps/web/src/features/hero/Particles.tsx` derives everything from it. The schedule lives in `apps/web/src/experience/timeline.ts` (`schedule`); the renderer and unit tests use the same particle timeline functions.

| Progress | What happens |
| --- | --- |
| 0.00–0.12 | Intact face; continuous dot drift, pointer repulsion and click ripples |
| 0.12–0.72 | A ragged departure front sweeps across the head from its left edge to its right edge. Each dot loosens just before it leaves, then accelerates leftwards along its own seeded, gently curling path, so the trail is dense beside the face and sparse far out |
| 0.28–0.70 | Explore cards fade in beneath the trail |
| 0.85–0.97 | Global fade; by 0.97 nothing is drawn and the canvas stops rendering |

Scrolling up evaluates the same function backwards, so the face reassembles dot for dot, and stopping holds the frame. The head does not turn: the profile turn in the brief needs a prepared head and hair mesh (`public/assets/hero/head.glb`, not supplied) and was deliberately left out in favour of a correct dispersal.

**Tuning.** Edit `schedule` in `timeline.ts` for timing (sweep start and length, per-dot jitter, flight duration, final fade) or the constants in the canvas renderer for the look (flight distance `0.4 + seed * 1.3` image widths, vertical fan `0.6`, curl amplitude, dot growth). `npm test` checks that the schedule is monotonic, reversible, intact at `schedule.start` and empty at `schedule.fadeEnd`.

**Rendering and fallbacks.** The portrait uses Canvas 2D and requestAnimationFrame, so animation does not depend on WebGL availability or a separate React Three Fiber render root. Dots are batched into eight opacity paths. Ambient drift, mouse repulsion, click/tap ripples, and reversible scroll dispersal share the same particle identities. Rendering pauses when the document is hidden or the portrait has dispersed, and resumes on visibility or scroll. Readiness is reported after the first draw. Reduced motion and image/canvas errors retain the static portrait. The `?debug` overlay reports readiness, failure, progress, and frame rate.

## Hosting

The current Sites deployment hosts the Vite **static frontend** (`dist`). FastAPI is included and tested locally but is **not running on Sites**, whose hosted runtime is Cloudflare Workers. The frontend's bundled snapshot makes the hosted site fully usable without it. To host FastAPI, deploy `apps/api` to a Python ASGI host with the canonical `content/` folder and proxy `/api` to it from the frontend's origin. No second backend has been created. `Dockerfile` runs the API and built frontend together on a Python-compatible host if preferred.

React Router handles project routes and unknown pages; Sites static hosting supplies SPA fallback. Per-project document titles update in the browser. Static HTML metadata is site-wide; use prerendering before requiring crawler-specific project social previews.

## Remaining content/assets

- Prepared 3D head/hair geometry and approval of artistic portrait likeness.
- Real project screenshots; cover art exists only for The Luthier's Library and the 300ZX.
- Photography gallery images.
- Repository links per project; live site links are set for the three deployed projects.
- LinkedIn URL and a hosted resume link, if wanted; email and GitHub are set.
- Deployment of the Python service if a live API is required.

Project cards carry either a real site logo (`image.fit: "contain"`, rendered on a light plate) or a generated editorial illustration. Neither is a project screenshot, and the 300ZX art is not a photo of the owner's vehicle. See `docs/assets.md`.
