# Phase 2 — companion status

Status: development preview behind a feature flag. Not production-ready; no public deployment performed.

Enable locally with `?avatar=preview` (add `&debug` for hero diagnostics). Scroll past the hero and the companion appears at a safe corner. Click it for React, Take a tour, Pause, Hide and Close; Escape closes; Hide leaves a Restore control. Preferences persist in local storage when available.

## What exists

| Piece | State |
| --- | --- |
| Character | The original 2D sprite-atlas chibi, `public/assets/avatar/casual-atlas-v1.png`, drawn frame by frame on a 2D canvas by `renderer/adapter.ts` (this is the active renderer) |
| Clips | `idle` (blink loop), `wave`, `poke` as authored frame sequences; the atlas also holds an unused walk row |
| 3D option | A rigged, textured GLB of the same character with an idle clip exists at `docs/avatar/exports/casual-rig.glb` (600 KB, optimised) with a three.js renderer in `renderer/glb.ts`. It is not active: the owner prefers the drawn look. To try it, copy the GLB to `public/assets/avatar/` and switch `manifest.json` to `"renderer": "glb"` with `"model"` and `"clips": {"idle": {"name": "Armature|Idle|baselayer", "loop": true}}` |
| Behaviour | `behavior/machine.ts`: idle decisions every 12–25 s, 1 s poke cooldown, 3 s recovery, deterministic seed for tests |
| Placement | `layout/safe.ts`: parked corner anchors avoiding text and controls, re-measured every 250 ms. No walking yet |
| Hero handoff | Enters at hero progress ≥ 0.95, leaves below 0.85 |
| Controls and tour | Menu, four-stop tour over existing section IDs, pause, hide, restore, keyboard and Escape |

## Idle motion

`renderer/rig-motion.ts` holds the resting pose and the idle life. The arms rest slightly open (`rest.shoulder`)
rather than dead vertical, and `alive()` layers breathing, a slow weight shift that leans the body and
counter-tilts the head, and independent sway on each arm. Left and right use different frequencies rather than
a shared phase, so the two sides drift in and out of step instead of mirroring. Every term is a sine of absolute
time with no phase offset, so the body sits exactly at its rest pose at time zero and gestures still start and
finish from rest. Idle sway fades out of any joint a gesture takes over. Tests assert the ranges are large
enough to read as alive and that the two arms are not a mirrored pair.

## Relaxed pose art (not in use)

`exports/casual-parts-relaxed-v2.png` is a parts sheet generated from the owner's relaxed three-quarter
reference: weight on one leg, softer stance, slimmer build. It is keyed, rebuilt on this rig's exact cell grid
and verified clear of the slicer, but it is **not** wired up. The shipped rig draws every part by stretching its
alpha bounding box into a fixed destination rectangle, and those rectangles encode the current chunky chibi's
proportions. The relaxed character is slimmer and longer in the torso, so its shoulders no longer reach the arm
pivots at x=111/209. Adopting it needs the destination rectangles, arm pivots and hip line retuned together,
which changes the character's proportions on purpose. `exports/casual-parts-relaxed-v2b-raw.png` is the second
candidate, before keying.

## Provenance

- `docs/avatar/reference-sheet.png`: generated chibi reference sheet (front, 3/4, side, back, expressions, role variants). Likeness approval by the owner pending.
- `public/assets/avatar/casual-atlas-v1.png`: generated 4×4 pose sheet (idle, wave, reactions, walk row); the served character.
- `docs/avatar/exports/casual-rig.glb`: Meshy Image-to-3D via the Higgsfield connector, job `f8194414-ead6-436a-a728-7007188a387d`, from the atlas front pose, options texture + rig + animation `Idle` (action id 0), a-pose, 20k triangles. Source export (8.2 MB) kept outside the repo; optimised with gltf-transform: `resize --width 1024 --height 1024`, `webp --quality 85`, `meshopt --level medium`. Skeleton uses Mixamo-style bone names (Hips, Spine, LeftUpLeg, …), 24 joints.

## Adding clips

Each extra action is a separate GLB on the same rig, produced with the connector's `3d_rigging` model (`model_url` = the source export URL, `animation_action_id` from the `animation_actions` catalogue), then optimised the same way and listed in `manifest.json`:

```json
"clips": {
  "idle":  {"name": "Armature|Idle|baselayer", "loop": true},
  "wave":  {"file": "/assets/avatar/casual-wave.glb"},
  "poke":  {"file": "/assets/avatar/casual-poke.glb"},
  "think": {"file": "/assets/avatar/casual-think.glb"},
  "walk":  {"file": "/assets/avatar/casual-walk.glb", "loop": true}
}
```

Candidate ids: Casual_Walk 30, Big_Wave_Hello 28, Confused_Scratch 36 (think), Stand_Wave_and_Sit_Down 302. One-shots return to idle through the mixer's finished event.

## Remaining work against the Phase 2 brief

- Owner approval of the likeness (reference sheet and 3D model).
- Purchase and wire wave, poke, think, stretch and walk clips.
- Movement: walk between anchors along a clear lane using `pathClear`; feet-anchored travel matched to the walk cycle. Currently parked only.
- Pointer attention (occasional look toward the cursor) and expression overlays.
- Role outfits and props (developer, photographer, mechanic) with role hints on cards; `setRole` is a no-op.
- Mobile: parked companion sizing review; performance comparison against the site with the avatar disabled.
- Turn the query-string gate into the `experience.avatarEnabled` flag once the above is accepted.

## QA

`npm test` covers scheduler priorities, cooldowns, interrupted reactions, hero hysteresis, blocked layouts, path intersections, viewport bounds and manifest validation for both renderers. Browser checks: enabled and disabled URLs, hero return, menu, rapid React, links beneath the companion, direct project visits, hide and restore, reduced motion, mobile, tour navigation.

## Current placement and animation update

The companion now appears on page load by default, parked bottom-right above navigation on every route. `?avatar=off` disables it. Hide/Pause preferences still apply. Hero eligibility and roaming are no longer used by AvatarHost. Rendering is explicitly Canvas 2D; GLB sources remain on disk but are not imported by the host. Atlas frames are alpha-trimmed in memory and aligned at the feet at a common scale. The hand-switching wave frame and abrupt crouch are excluded; idle uses a stable neutral/blink cycle. This remains limited frame animation, not a Spine rig. No Higgsfield service is required for runtime playback.

## Current renderer: layered 2D cutout (September 20, 2026)

This section supersedes the placeholder/frame-atlas descriptions above. The active manifest selects `cutout-2d`, with `casual-parts-v1.png` (1,143,308 bytes). Built-in ImageGen produced the parts sheet using `reference-sheet.png`; the exact prompt is in `layered-art-prompt.txt`. The source output is retained at `/Users/shrestha/.codex/generated_images/01a0bcac-6a96-7c13-9120-e65cba60f04c/exec-18dbba9f-a765-4310-ab6e-031cef6a5d81.png`. The workspace asset is `apps/web/public/assets/avatar/casual-parts-v1.png`. Generated artwork is a first-pass derivative of the supplied reference, not human-authored layered illustration or a Spine project.

The custom Canvas 2D rig draws independent torso, head/expression, sleeve segments, hands and planted legs. Sleeve parts overlap at elbow pivots; all joints are driven by continuous easing. Existing frame-atlas and GLB implementations are retained but not selected. No Spine runtime or license purchase was made. Face expressions currently replace aligned head variants; eyebrows, pupils and mouths are not individually rigged yet. Legs remain one standing part, so seated routines require new artwork.

Current behavior: subtle breathing/weight shift, irregular 2.8–8-second blinks, brief nearby-pointer head glances with 5-second attention cooldown, arrival/requested wave, smiling poke reaction, thinking and stretching. Autonomous decisions wait 20–45 seconds and avoid immediate repeats; waves no longer recur autonomously. Frame drawing is capped around 30fps; hidden tabs, Pause and reduced motion stop animation. Hide/unmount disposes the frame callback and pointer listener. The Wave action allows explicit review.

Verification: production build and 23 tests passed, including rest-pose recovery, bidirectional wrist movement, finite/bounded joint transforms, existing behavior/assets and hero checks. Visually inspected the assembled rig in a mobile-width local browser; checked Wave, Pause/Resume and focus restoration. Full device performance profiling and final artist approval remain outstanding. The active parts download is below the initial 2 MB raw-asset target; this is not a claim about total page transfer or measured frame performance.

`SCENE_IDEAS.md` records couch rest/nap, couch phone scrolling, studying, and the rare chair near-fall as future scenes with required parts and interruption rules. These furniture scenes are not implemented yet.
