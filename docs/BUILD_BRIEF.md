# Personal Portfolio — Phase 1 Build Brief

Status: implementation-ready project specification. Build Phase 1 only.

## 1. Instructions for Codex

Build a personal software developer portfolio using this document as the product specification. Inspect the existing repository and its instructions first. Preserve established conventions where practical. Use React + TypeScript with Tailwind CSS for the frontend and FastAPI for the backend, as selected by the owner. Work in small, reviewable milestones and keep the application runnable throughout.

The owner is Parth Shrestha. The site presents software projects and interests outside work. Prioritize a polished, usable portfolio before advanced graphics. The dotted-face hero is part of Phase 1; the roaming animated character is Phase 2.

Do not invent biography, employers, project results, repository URLs, contact details, or testimonials. Use clearly marked development placeholders for missing content, and list them in the README. Do not publish unconfirmed personal claims or broken placeholder links.

## 2. Product vision

A restrained, dark, technical portfolio with an interactive grid, a large centered face constructed from white dots, and floating navigation. Scrolling turns and disperses the face into particles as the project grid appears. Scrolling upward reconstructs the same face by reversing the same animation.

The experience must remain useful if graphics fail, motion is disabled, or the backend is unavailable. Content and navigation must never depend on finishing an animation.

### Phase 1 includes

- Responsive home page: Home, Work, After Hours, About, Contact.
- Project detail pages with real screenshots, explanation, and links when supplied.
- Centered dotted-face hero, reversible scroll transition, and subtle interactive grid.
- Floating navigation, keyboard access, mobile layout, motion controls, and static fallback.
- Small read-only backend for portfolio content, with a bundled content fallback.
- Build instructions, meaningful verification, and deployment configuration documentation.
- Lightweight integration points for a later avatar, with the feature disabled.

### Explicitly outside Phase 1

- Roaming avatar, character rig, emotes, wardrobe, props, and guided tours.
- AI chat, LLM calls, voice, autonomous agents, or vector databases.
- Accounts, admin dashboard, CMS, payments, persistent visitor tracking, or database.
- Contact submission service: use verified email/social links for this release.
- Runtime photo uploads or automated face reconstruction service.

## 3. Stack decision

React and TypeScript are used together: React is the UI framework and TypeScript is the language.

| Layer | Default | Alternative / constraint |
| --- | --- | --- |
| Frontend | React + TypeScript + Vite | Use the existing React setup if one is already established |
| Styling | Tailwind CSS | Confirmed choice; use utility classes and shared theme tokens rather than CSS modules |
| Routing | React Router | Home plus `/projects/:slug` and a not-found route |
| Graphics | Three.js through React Three Fiber | Lazy-load the graphics module; keep content in HTML |
| Scroll timeline | GSAP ScrollTrigger | One authoritative normalized progress value |
| Backend | Python FastAPI with Pydantic models | Confirmed choice; do not add a .NET backend |
| Content | Version-controlled JSON and local optimized assets | No database required |
| Verification | Type checking, focused unit tests, browser smoke tests | pytest for the FastAPI backend |

**Confirmed backend choice: FastAPI.** Use Python, Pydantic response models, and an ASGI server such as Uvicorn. Do not scaffold ASP.NET Core or maintain a second backend. The frontend and future companion communicate through the API contract below.

Select compatible stable dependencies at implementation time and commit lockfiles. Record the required Node and Python versions. Avoid hardcoding guessed version numbers from this brief.

Vite provides a React/TypeScript template: [Vite guide](https://vite.dev/guide/). Backend reference: [FastAPI documentation](https://fastapi.tiangolo.com/).

## 4. Visual direction

- Background: near-black charcoal, starting around `#101112`.
- Panels: slightly lighter charcoal, thin borders, restrained transparency.
- Main text: warm off-white; supporting text: legible neutral gray.
- Accent: small muted amber details. Avoid saturated neon, rainbow gradients, and heavy bloom.
- Grid: subtle lines and intersections; nearby intersections may brighten gently with the pointer.
- Typography: readable sans-serif for content; monospace for small labels and technical metadata.
- Layout: generous spacing, strong project imagery, deliberate card alignment.

These colors are starting tokens, not a substitute for contrast checks. Define shared colors, typography, spacing, and breakpoints as Tailwind theme tokens. Use Tailwind utilities for component styling, responsive layouts, hover states, and visible keyboard focus. Keep custom CSS limited to global base styles and effects that are awkward to express with utilities; do not introduce CSS modules as a parallel styling system. Keep repeated UI patterns in reusable React components.

### Hero composition

The face is centered horizontally and faces forward on arrival. Preserve the owner's recognizable proportions, center-part dark hair, and gentle friendly expression. Remove visible blemishes in the artistic treatment. Do not substitute a generic head or a realistic cartoon character.

Place the owner's name and a concise developer introduction around the composition without covering the face. The smoked-glass navigation floats beneath the face around the middle-to-lower portion of the first viewport. Its labels are Home, Work, After Hours, About, Contact.

After leaving the hero, the navigation becomes a compact fixed dock near the bottom edge. On mobile, respect safe-area insets and reserve content padding so it cannot obscure text or controls. Navigation remains reachable throughout the transition.

## 5. Content and pages

| Area | Required content and behavior |
| --- | --- |
| Home | Dotted portrait, name, short introduction, Work link, scroll cue |
| Work | Responsive project grid; title, summary, stack, image, case-study link |
| Project detail | Problem, role, approach, architecture, screenshots, outcomes only when verified, repository/demo links when supplied |
| After Hours | Photography and car interests presented as editorial cards or small galleries |
| About | Short supplied biography, skills, approach, optional supplied resume |
| Contact | Verified email and profile links; hide unavailable destinations |

Candidate content from planning: The Luthier's Library, Open Data Pipeline, photography, and a 1991 Nissan 300ZX. Treat names and technical details as draft content to confirm before publication. Do not invent achievement metrics.

Use semantic headings, real links, image alt text, visible focus styles, and direct links to sections. A direct visit to a project URL must work after refresh. Unknown project slugs show a useful not-found page.

## 6. Dotted-face assets and animation

### Asset reality

A reference photo or generated mockup is not a finished 3D head. A convincing profile turn needs suitable head geometry, including hair silhouette. Prepare or obtain that asset separately and record its provenance and usage rights.

Proposed asset slots:

- `public/assets/hero/head.glb`: prepared head mesh used to sample points.
- `public/assets/hero/portrait-fallback.webp`: approved static dotted portrait.
- `public/assets/hero/head-points.bin`: optional precomputed particle positions.
- Optimized project screenshots and photography under separate asset folders.

These filenames are targets, not claims that files already exist. Do not rely on temporary chat attachment paths. List missing files explicitly. A temporary portrait or point silhouette can unblock layout work, but it is not an approved likeness or the completed 3D effect.

### Reversible scroll specification

Use a sticky hero stage within a scroll region, initially around 220–280 viewport heights on desktop; tune after browser review. Use native scrolling. Do not intercept wheel or touch input to force animation steps.

Let `p` be normalized scroll progress from 0 to 1:

| Progress | Visual state |
| --- | --- |
| 0.00–0.15 | Recognizable frontal dotted face; introduction visible |
| 0.15–0.40 | Face gently turns toward a right-facing profile; edge particles begin separating |
| 0.40–0.75 | Dots disperse outward in a controlled flow; project content enters |
| 0.75–1.00 | Remaining particles fade completely; project grid becomes the main focus |

Scrolling upward must evaluate this same sequence in reverse. Stopping scroll holds the transformation stage. Avoid independent time-driven dissolution or random target regeneration.

Implementation requirements:

1. Give each particle a fixed source position, seeded destination, and optional fixed delay.
2. Derive rotation, dispersion, opacity, and content transitions from `p`.
3. Keep particle identity stable across frames, resize, and scroll direction changes.
4. Use GPU buffers/shaders or efficient point rendering, not a React component per dot.
5. Do not push per-frame particle or pointer updates through React state.
6. Keep pointer response subtle and separate from the scroll transformation; disable it for touch and reduced motion.
7. Handle resize, restored scroll position, direct anchor navigation, and graphics cleanup.
8. When fully dispersed, stop unnecessary drawing; resume correctly when scrolling upward.

ScrollTrigger supports scroll-linked timelines and scrubbing; use those facilities rather than two competing forward/backward animations. See [ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

### Fallbacks

Reduced motion: static dotted portrait, ordinary document scrolling, no long pinned transition. Missing WebGL, failed asset loading, or context loss: replace the canvas with the fallback portrait and keep all content accessible. On weaker devices, reduce dot count and pixel ratio or use the static presentation.

## 7. Backend and content contract

Keep the API small and framework-independent. Use JSON with camelCase keys and explicit Pydantic response models in FastAPI.

| Endpoint | Result |
| --- | --- |
| `GET /api/v1/health` | `{ "status": "ok" }` |
| `GET /api/v1/portfolio` | Complete public portfolio document |
| `GET /api/v1/projects/{slug}` | One project; HTTP 404 for an unknown slug |

Suggested frontend contract:

```ts
type SectionId = 'home' | 'work' | 'after-hours' | 'about' | 'contact';

interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  stack: string[];
  image?: { src: string; alt: string };
  caseStudy: { problem: string; role: string; approach: string; outcome?: string };
  links: { repository?: string; demo?: string };
}

interface PortfolioContent {
  schemaVersion: 1;
  owner: { name: string; headline: string; bio: string };
  projects: Project[];
  interests: Array<{ id: string; title: string; description: string;
    image?: { src: string; alt: string } }>;
  contact: { email?: string; github?: string; linkedin?: string; resume?: string };
}
```

Use one canonical content file, such as `content/portfolio.json`. The backend validates and serves it; the frontend build bundles a validated snapshot from that same file. Render the snapshot immediately and refresh from the API with a bounded timeout. API failure must not blank the site or display intrusive error messages for content already available.

Hide absent optional links. Validate content structure and handle incompatible schema versions. Keep credentials out of frontend variables; Phase 1 should require no external service secrets. Prefer same-origin `/api` routing, with explicit allowed origins if deployed separately. Supply a development proxy and `.env.example` without credentials.

## 8. Repository organization

| Path | Responsibility |
| --- | --- |
| `apps/web/` | React application and frontend tooling |
| `apps/web/src/features/hero/` | Particle scene, timeline, asset loading, fallback |
| `apps/web/src/features/portfolio/` | Sections, project grid, project detail pages |
| `apps/web/src/components/` | Navigation and shared accessible controls |
| `apps/web/src/services/` | API client, content validation, snapshot fallback |
| `apps/web/src/experience/` | Small shared section/motion context for future companion |
| `apps/web/src/styles/` | Tailwind entry stylesheet, shared theme tokens, and minimal global styles |
| `apps/api/` | FastAPI app, routes, Pydantic schemas, content loader, and pytest tests |
| `content/` | Canonical public content |
| `docs/` | Asset inventory, decisions, deployment notes |

This structure is a suggestion for a new repository. Do not reorganize an existing application merely to match these paths.

## 9. Prepare for Phase 2 without building it

The future companion is a small chibi character with dark center-part hair, friendly expressions, casual clothing, and contextual outfits. It may roam safe areas, react to clicks, change expressions, and guide visitors. Those features are not Phase 1 deliverables.

Add only the following inexpensive integration points:

- Stable section IDs and an active-section observer.
- A normalized hero progress source, with a low-frequency hero-complete state for UI consumers.
- A shared reduced-motion preference and an `avatarEnabled` flag defaulting to `false`.
- A documented future overlay mount location, without loading an avatar runtime.
- Optional `data-companion-anchor` attributes on a few suitable empty layout areas.

Do not add dummy characters, an empty chat widget, a behavior engine, a global event framework, or avatar packages now. The site must work permanently with the companion disabled.

Future integration rules: the companion yields to navigation and controls; only its own hit area captures clicks; it can be paused or hidden. It becomes eligible after the hero disperses and retreats when the visitor scrolls back to the face. Contextual outfits and emotes can be local state-machine behavior. Any later AI conversation belongs behind the backend and is separate from animation logic.

## 10. Build sequence and estimate

Estimates assume roughly 25 focused hours per week and access to usable content and head assets. They are planning ranges, not delivery guarantees.

| Milestone | Deliverable | Estimate |
| --- | --- | --- |
| 1. Plan and content inventory | Stack confirmed, assets inventoried, page outline, content schema | 6–10 hours |
| 2. Usable portfolio | Responsive pages, navigation, project details, static hero, content | 20–30 hours |
| 3. Head asset preparation | Approved likeness and point sampling input | 12–24 hours |
| 4. Motion and grid | Reversible particle timeline, grid response, fallback handling | 18–30 hours |
| 5. Minimal backend | Read-only API, content validation, frontend fallback integration | 6–12 hours |
| 6. Release preparation | Accessibility, performance, verification, deployment documentation | 12–20 hours |
| **Total** | **Phase 1 with backend** | **74–126 hours; approximately 3–6 weeks** |

The earlier core-site estimate was 68–114 hours without this explicit backend work. The biggest uncertainty remains head-asset quality. If the mesh is unavailable, finish the usable portfolio with a static fallback and identify the final profile-turn effect as outstanding; do not report the full visual specification complete.

Start with milestone 2's usable HTML portfolio after the initial inventory. Do not spend the first week tuning particles while the site itself is empty.

## 11. Acceptance criteria

- [ ] The first viewport uses the centered, forward-facing dotted portrait and restrained visual direction.
- [ ] Floating navigation works by mouse, keyboard, and touch and never covers essential content.
- [ ] Work, After Hours, About, Contact, project details, and not-found behavior are complete.
- [ ] Scroll down disperses the face; scroll up reforms the same particles and likeness without jumps.
- [ ] Pausing scroll holds the transformation; resizing and back navigation do not scramble it.
- [ ] Reduced motion, missing graphics assets, and WebGL failure retain a usable site.
- [ ] Small phone, tablet, and desktop layouts have no horizontal overflow.
- [ ] Text, focus states, and controls meet WCAG AA contrast expectations; canvas is decorative and content is semantic HTML.
- [ ] Keyboard users have a skip link and can bypass the long hero region.
- [ ] API success, missing project, malformed content, and API outage paths are handled.
- [ ] No unconfirmed biography, fake metrics, placeholder destinations, or broken images remain in the release content.
- [ ] Project pages have descriptive titles and metadata; production routing supports direct visits. Document prerendering if needed for project-specific social previews.
- [ ] No avatar, AI, or wardrobe code is required to run Phase 1.
- [ ] README includes installation, development, build, FastAPI startup, content editing, asset replacement, and deployment instructions.

Performance targets to measure: initial non-3D page payload around 1 MB or less compressed, lazy-loaded hero assets, stable layout, and smooth motion on the agreed test device. Aim for LCP at or below 2.5 seconds, CLS at or below 0.1, and INP at or below 200 ms where measurable. These are targets, not claims of achieved performance. Report device and test conditions; do not use Lighthouse alone as proof of field performance.

Verification should focus on actual risks: API response contracts, content fallback, deterministic animation endpoints/reversal, navigation and project routes, reduced motion, and mobile overlap. Manually inspect intermediate animation states. Avoid snapshot tests that only duplicate markup.

## 12. Copy-paste kickoff prompt

> Implement Phase 1 from PHASE_1_PORTFOLIO_BUILD_BRIEF.md in this repository. Inspect existing instructions and code first. Use React + TypeScript with Tailwind CSS and a Python FastAPI backend. This stack is confirmed. Use Tailwind utilities and shared theme tokens for styling; do not use CSS modules. Do not scaffold .NET or a second backend. Start with the responsive portfolio, real content structure, floating navigation, static hero fallback, and minimal content API; then add the reversible dotted-face scroll effect. Keep the avatar disabled and add only the Phase 2 extension points specified in the brief. Do not invent personal content or claim a placeholder head matches me. If approved head assets are missing, continue with the fallback and clearly list the remaining asset work. Verify the main user flows and document setup and deployment steps. Deliver working code in milestones; do not deploy publicly unless requested.

