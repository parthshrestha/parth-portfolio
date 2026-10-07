# Personal Portfolio — Phase 2 Avatar Build Brief

Status: implementation specification for the website companion. Build on `PHASE_1_PORTFOLIO_BUILD_BRIEF.md`; preserve the working portfolio.

## 1. Instructions for Codex

Inspect the repository instructions and Phase 1 implementation first. Extend the existing React + TypeScript + Tailwind CSS frontend and Python FastAPI backend. Do not rebuild the site, replace its dotted-face hero, or introduce another backend.

Build a playful chibi companion that appears after the visitor scrolls past the hero. It should feel alive through thoughtful animation, context, and variation. Core behavior runs locally in the browser and does not require an AI model.

Work in the release stages below. Keep the avatar behind a feature flag until its assets and interactions are ready. If artwork or a rig is missing, implement and verify the integration using an explicitly labeled development placeholder; document the missing deliverables. Never describe a still image or concept sheet as a finished animated character.

## 2. Experience and scope

The opening experience remains the large, centered dotted portrait. Scrolling down disperses the dots and reveals the portfolio. Once that transition completes, the smaller full-body avatar enters from a safe edge. It hangs out around the content, moves occasionally, responds to a poke, and changes expressions and clothes without requiring visitors to operate a control panel.

Scrolling back toward the hero dismisses the companion while the existing point-cloud animation reforms the face. This is a coordinated handoff between two different assets, not a literal morph between a 3D face and a 2D body.

Phase 2 includes:

- Layered character artwork, rig, animation clips, and production exports.
- Idle life, limited roaming, pointer attention, tap/click reactions, and emotes.
- Contextual outfits and props for development, photography, and garage interests.
- An optional visitor-started tour with short, authored descriptions.
- Pause, hide, restore, keyboard access, reduced motion, and mobile behavior.
- Asset loading, performance controls, integration tests, and release documentation.

Deferred beyond the core Phase 2 release: AI chat, speech, microphone access, generated dialogue, cross-session memory, arbitrary navigation by an agent, and runtime-generated animation. These are optional later additions, not prerequisites for a lively companion.

## 3. Character art direction

Use the user's supplied chibi reference sheets as the visual baseline. Preserve a large rounded head, dark center-part curtain hair, warm tan skin, dark brown eyes, thick natural eyebrows, simple nose and mouth, and a friendly expression. Use clean illustrated shapes and soft cel shading. Avoid photorealistic skin, visible pimples, a realistic anime adult, or a glossy CGI replacement.

Default outfit: cream-and-black plaid overshirt, black T-shirt, dark cargo trousers, and white sneakers. Maintain the same face, hair, proportions, and line treatment across all outfits.

The owner must be able to inspect the front view, walking view, smile, and neutral face before costly animation polishing. References are visual guidance, not ready-to-run assets. Inventory the actual files available in the repository; do not rely on temporary chat attachment paths.

## 4. Technical approach

| Concern | Decision |
| --- | --- |
| Site UI | Existing React, TypeScript, and Tailwind CSS |
| Character production | Layered 2D artwork and a Spine skeletal rig |
| Browser rendering | Compatible official Spine TypeScript/WebGL runtime behind a small renderer adapter |
| Behavior | Typed local state machine with configurable timing, priorities, and seeded randomness for tests |
| Positioning | Fixed companion layer using safe viewport anchors measured from the live layout |
| UI controls and bubbles | Accessible HTML styled with Tailwind, separate from the canvas |
| Backend | Existing FastAPI; no per-frame requests or new server required for core behavior |
| Optional future conversation | FastAPI server-side AI integration, separately scoped |

Spine provides runtime animation integration and exports skeleton data plus texture atlases. Its skins allow animation reuse with different attachments. See [official runtimes](https://esotericsoftware.com/spine-runtimes) and [skins documentation](https://esotericsoftware.com/spine-skins). Check the applicable editor/runtime license and export/runtime compatibility before committing to production assets. Do not purchase tools automatically.

Keep renderer-specific code isolated. If Spine is unavailable, a frame-atlas renderer can support an initial limited character using the same adapter, but producing all outfits as frame animation changes the art workload. Do not silently implement two production renderers or claim a static fallback has the full animation feature set.

## 5. Artwork and rig production

| Element | How to create it | Completion check |
| --- | --- | --- |
| Design sheet | Draw consistent front, three-quarter, and walking-side views | Recognizable identity and stable proportions |
| Layered body | Separate hair back/front, head, torso, upper/lower arms, hands, legs, shoes | Hidden regions are drawn; joints do not expose gaps |
| Face | Separate eyes, lids, brows, mouths; optional cheek details | Smile, focus, surprise, and laugh remain recognizable |
| Skeleton | Root, pelvis, torso, neck/head, limbs, hand/prop sockets, foot contact markers | Neutral pose, bends, and walking silhouette work |
| Clothing | Author matching pieces against the same skeleton and named slots | No clipping through body across supported clips |
| Props | Camera, laptop, wrench with compatible grip poses | Prop follows its hand and clears correctly |
| Animation | Author loops and one-shot reactions; set blend and interrupt rules | No foot sliding, popping, or abrupt loop seams |
| Export | Skeleton data, atlas textures, manifest, preview sheet | Export loads in the chosen browser runtime |

A front-view rig cannot automatically produce a convincing side view. Author a walking-facing pose or additional view as needed. Mirroring is acceptable only where hair, outfit asymmetry, prop hands, and lettering remain correct. Do not promise a full 360-degree turn from one drawing.

Retain editable source artwork and the rig project separately from optimized browser exports. Keep source assets out of the public bundle. Record the author, rights, export version, texture dimensions, and supported actions in an asset inventory.

## 6. Animation and expression inventory

Durations below are starting values to tune visually, not rigid requirements.

| Clip | Type | Approximate duration | Trigger |
| --- | --- | --- | --- |
| `idle` | Loop | 3–5 seconds | Default breathing and slight weight shift |
| `blink` | Facial overlay | 0.15–0.25 seconds | Irregular intervals |
| `look` | Head/eye adjustment | Blended | Brief attention toward nearby pointer or tour target |
| `walk` | Loop | 0.7–1.0 seconds per cycle | Moving between approved anchors |
| `wave` | One-shot | 1–2 seconds | Initial arrival or explicit greeting |
| `poke` | One-shot | 0.5–0.9 seconds | Click, tap, or keyboard activation |
| `laugh` | One-shot | 1–2 seconds | Varied playful reaction |
| `hop` | One-shot | 0.6–1.0 seconds | Occasional explicit reaction |
| `think` | Loop or hold | 2–4 seconds | Quiet context or tour pause |
| `stretch` | One-shot | 2–3 seconds | Infrequent idle variation |
| `sit-enter`, `sit-idle`, `sit-exit` | Transition/loop | Varies | Only at anchors supporting sitting |
| `point` | Hold/one-shot | 1–2 seconds | Tour explanation |
| `outfit-change` | One-shot | 0.5–1.0 seconds | Safe costume transition |
| `camera`, `type`, `inspect` | Context actions | 2–4 seconds | Photographer, developer, mechanic roles |

Facial presets: neutral, smile, focused, thinking, excited, laughing, surprised. Expressions and body actions are separate where the rig permits. Prevent incompatible combinations such as a smiling mouth fighting a laugh animation or a hand wave while holding a two-handed laptop.

Each one-shot must report completion and have a timeout recovery. Missing optional clips fall back to a supported idle or wave, not an endless loading state.

## 7. Personality and interaction rules

Behavior priority, highest first:

1. Hidden, paused, reduced-motion restrictions, unavailable renderer, or hero return.
2. Explicit visitor interaction or a visitor-started tour.
3. Section context and a pending outfit change.
4. Safe roaming.
5. Idle variations.

The avatar should spend most of its time quietly idle. Suggested starting settings: wait 12–25 seconds between autonomous decisions, limit roaming to at most once per 20 seconds, keep the last three actions out of the random choice when alternatives exist, and use a 1-second poke cooldown. Make these configuration values rather than scattered literals.

A poke briefly interrupts ordinary idle or walking, plays a surprise/smile/laugh reaction, then returns to a valid state. Repeated clicks must not queue dozens of clips, start overlapping timers, or produce angry punishment. During a tour, a poke may react briefly without changing the current step or stealing focus.

Pointer tracking is limited and occasional; the character should not stare continuously or chase the cursor. Do not trigger autonomous scrolling, route changes, external links, or audible sound. Tour navigation is allowed only after the visitor explicitly chooses a tour action.

## 8. Wardrobe and context

| Context | Outfit / prop | Example action |
| --- | --- | --- |
| General, About, Contact | Plaid casual outfit | Wave, smile, sit, stretch |
| Work / software project | Dark developer outfit, laptop | Type briefly, think, point at a project |
| Photography area | Casual photography outfit, camera | Raise camera and take an imaginary photo |
| Car / garage area | Mechanic workwear, wrench | Inspect wrench or wipe hands |

Use the active section plus an explicit role hint on relevant cards or subsections. A broad After Hours section alone cannot distinguish photography from cars. Require context to remain stable for about 2 seconds before changing outfits; add a 20–30-second automatic-change cooldown. Do not change clothes mid-walk, during a poke, or while pointing in a tour.

Change at a neutral pose or a designed transition. Clear old props before applying the new set. If a role's assets are missing, retain casual clothing and a compatible action. Load extra outfit assets on demand where practical. No visitor wardrobe menu is required.

## 9. Layout, roaming, and hero handoff

Use the Phase 1 `activeSection`, motion preference, hero progress, and companion anchor attributes. Do not create a second scroll timeline or alter the original particle positions.

Suggested handoff: permit entry after hero progress reaches 0.95; dismiss when progress falls below 0.85. This hysteresis prevents flicker near the boundary. Check readiness and visibility before entering. On direct project-page visits without the hero, a safe anchor may become eligible after the page settles.

Measure anchor rectangles with layout observers and viewport coordinates. Recompute on resize, route changes, substantial scrolling, and content shifts. Keep the avatar inside the viewport and away from navigation, text, links, cookie banners, open dialogs, and focused controls.

Evaluate the entire travel path, not only its destination. Prefer movement along reserved page margins or an unobstructed bottom lane. If no safe path exists, remain parked; if the current position becomes obstructed, fade out and reappear at a safe anchor rather than crossing important content. Do not implement random unrestricted x/y movement across the page.

The full-screen overlay uses `pointer-events: none`; only the character's hit area and its HTML controls capture input. Keep the layer below dialogs. Anchor walking to the feet and match travel speed to the walk cycle. Start around 140–180 CSS pixels tall on desktop, adjusting to available space; mobile uses a smaller parked companion with roaming disabled by default.

## 10. Guided tour

Tours use authored portfolio content. Provide a small accessible action menu with React/Emote, Take a tour, Pause/Resume, and Hide. Keep a separate restore control available after hiding.

A tour is never auto-started. Define steps by stable section/project IDs, concise text, target anchor, and optional compatible gesture. Provide Next, Back, and End controls. Only explicit Next/Back can scroll to the next target. Missing targets are skipped safely. Manual browsing can end the tour without fighting the user's scroll position.

Use HTML bubbles with readable contrast, constrained width, and viewport-aware positioning. Restore focus appropriately on closing controls, and announce intentional tour changes without announcing every blink or idle action.

## 11. Suggested interfaces and modules

```ts
// Application contracts, not a claim that a specific renderer exposes this API.
type AvatarRole = 'casual' | 'developer' | 'photographer' | 'mechanic';
type AvatarMode = 'hidden' | 'parked' | 'idle' | 'walking' | 'reacting' | 'tour';

interface AvatarContext {
  activeSection: string;
  heroProgress: number;
  roleHint?: AvatarRole;
  reducedMotion: boolean;
  documentVisible: boolean;
}

interface AvatarRenderer {
  load(manifestUrl: string): Promise<void>;
  play(clip: string, options?: { loop?: boolean }): void;
  setRole(role: AvatarRole): void;
  setPosition(x: number, y: number): void;
  setPaused(paused: boolean): void;
  dispose(): void;
}
```

| Module | Responsibility |
| --- | --- |
| `features/avatar/AvatarHost.tsx` | Feature flag, loading, lifecycle, error boundary |
| `features/avatar/renderer/` | Canvas and runtime adapter; animation completion events |
| `features/avatar/behavior/` | State transitions, priorities, cooldowns, role selection |
| `features/avatar/layout/` | Safe anchors, path validation, collision avoidance |
| `features/avatar/ui/` | Tailwind controls, bubbles, restore button |
| `features/avatar/tour/` | Authored steps and tour state |
| `public/assets/avatar/` | Optimized runtime exports and asset manifest |
| `docs/avatar/` | Asset inventory, export guide, behavior settings, QA checklist |

The manifest should identify schema version, runtime/export compatibility, atlas/skeleton locations, available clips and roles, nominal bounds, foot origin, and fallback image. Validate it before playback. Keep high-frequency position and frame updates outside React render state. Own and dispose all listeners, timers, animation frames, GPU textures, and observers; React development remounts must not create duplicate companions.

## 12. Backend boundary and optional future AI

The initial companion needs no new backend endpoint: assets, behavior settings, and tour definitions can ship with the frontend. Continue using FastAPI's existing portfolio content contract as needed. Do not send mouse movements, animation frames, or idle decisions to a server.

If AI conversation is commissioned later, scope it separately: a FastAPI chat endpoint, server-held credentials, bounded conversation size, rate limits, cancellation, error UI, and answers grounded in verified public portfolio content. Never invent the owner's experience or claims.

Model suggestions for gestures must pass a small allowlist through the same behavior scheduler. The model must not run arbitrary JavaScript, control unrestricted navigation, or bypass hide/pause preferences. Chat failure must not disable local animations. No AI dependencies or empty chat panel should ship in core Phase 2.

## 13. Accessibility and performance

- Offer keyboard-triggered reactions through an accessible button; do not require clicking a canvas pixel.
- Respect reduced motion: static parked character, no autonomous walking/hopping, instant or simple non-motion UI changes.
- Pause stops all character animation and autonomous scheduling. Hide removes it and stops work. Provide a clear restore control.
- Store only local display preferences when storage is available; handle unavailable storage gracefully.
- Pause timers and rendering when the tab is hidden; resume without replaying missed actions.
- Lazy-load the avatar after core site content and the hero handoff. Do not block the first viewport.
- Cap rendering pixel ratio and stop unnecessary frames when parked with no active animation.
- Handle missing assets, runtime errors, and context loss with a static fallback or cleanly disabled companion.
- Measure performance against the same page with the companion disabled. Target no layout shift and no noticeable navigation/scroll regression; document device and conditions.
- Initial avatar downloads should aim below roughly 2 MB compressed where art quality permits; treat this as a measured budget, not a guaranteed result. Lazy-load additional wardrobes.

## 14. Delivery stages and timeline

Estimates assume roughly 25 focused hours per week, a usable Phase 1, and access to illustration/rigging skills. They are planning ranges. Do not count a generated concept image as completed layered artwork.

| Stage | Deliverable | Estimated effort |
| --- | --- | --- |
| A. Art preparation | Character consistency, layered artwork, asset inventory | 16–24 hours |
| B. First rig | Casual outfit, idle/walk/wave/poke, expressions and exports | 24–36 hours |
| C. Integration | Hero handoff, safe movement, controls, click reactions | 20–30 hours |
| D. Personality | Sitting, stretching, additional expressions and variation | 16–24 hours |
| E. Context roles | Three extra outfits, props, compatible actions | 24–40 hours |
| F. Polish | Tour, mobile, accessibility, transition fixes, verification | 16–24 hours |
| **Total** | **Complete Phase 2 companion** | **116–178 hours; approximately 5–8 weeks** |

A basic companion from stages A–C is roughly 60–90 hours, or 3–4 weeks, and is a subset of the total. Learning illustration and rigging from scratch can extend the whole phase to 8–12 weeks or more. Optional AI chat is a separate later estimate, initially around 12–24 additional hours for a limited implementation, subject to the final requirements.

Release a casual one-outfit character first. Add richer idle life next, then outfits and the tour. Do not delay all browser integration until every costume is finished.

## 15. Acceptance checklist

- [ ] Phase 1 works unchanged with the avatar disabled or failed.
- [ ] The final face, hair, and proportions follow the supplied chibi references.
- [ ] The dotted hero remains the first-viewport focal point; avatar entry/exit does not flicker.
- [ ] Casual idle, walk, wave, poke, and all advertised actions actually animate.
- [ ] Rapid pokes, interrupted walks, and missing clips recover to a valid state.
- [ ] Outfit changes preserve identity, wait for safe transitions, and remove stale props.
- [ ] Random decisions respect cooldowns and context; deterministic seeds support tests.
- [ ] Both movement endpoints and travel paths avoid essential content and controls.
- [ ] Resize, route changes, direct project visits, and scroll restoration are handled.
- [ ] Touch users get a compact parked companion that does not block navigation.
- [ ] Tours start only on request and provide working Next, Back, and End controls.
- [ ] Pause, hide, restore, keyboard reactions, and reduced motion work.
- [ ] No unrequested sound, AI calls, visitor tracking, or automatic navigation occurs.
- [ ] Hidden tabs and unmounted components leave no active rendering or duplicate timers.
- [ ] Runtime versions, licenses, asset provenance, and export steps are documented.

Test scheduler priorities, cooldowns, hero thresholds, invalid assets, and interrupted transitions with a controllable clock. Add browser checks for clicking underlying links, hiding/restoring, keyboard controls, reduced motion, mobile overlap, and tour navigation. Visually inspect walk feet, costume seams, facial blending, and loop boundaries. Avoid tests that merely repeat the configuration values.

## 16. Copy-paste Codex kickoff prompt

> Implement Phase 2 from PHASE_2_AVATAR_BUILD_BRIEF.md on top of the existing Phase 1 portfolio. Keep React + TypeScript + Tailwind CSS and Python FastAPI. Inspect existing code, instructions, assets, and the Phase 1 brief first. Begin with stages A–C: one casual chibi character, a renderer adapter, idle/walk/wave/poke behavior, safe placement, hero handoff, pause/hide/restore, and accessible interactions. Do not rebuild the site or introduce AI chat. Use actual supplied artwork and runtime assets; if those are missing, build the integration with an explicitly labeled development placeholder and document the remaining art/rigging work. Do not claim the finished character exists until it does. Keep animation and movement local to the browser, isolate renderer code, and preserve the disabled-avatar experience. Then proceed through personality, contextual wardrobes, and the opt-in tour in reviewable stages. Verify transitions, content access, reduced motion, and mobile behavior. Do not publish publicly unless requested.
