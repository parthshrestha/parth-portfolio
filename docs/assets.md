# Asset provenance

- `portrait-fallback.png`: master portrait, generated once with the built-in image-generation tool from the owner's supplied photo and dotted visual mockup. Intended as artistic likeness; approval pending. Source private photograph is not included in the published source. RGB on a near-black background; not served.
- `portrait-fallback.webp`: the served copy, derived from the PNG with a transparent background so it sits on any page colour without a visible square. Alpha comes from luminance (background level 16 subtracted) and colours are un-premultiplied. Regenerate after replacing the PNG:

  ```sh
  cd apps/web/public/assets/hero
  ffmpeg -i portrait-fallback.png -filter_complex "[0:v]format=rgb24,split=2[c][l];[l]format=gray,geq=lum='clip((p(X,Y)-16)*255/(255-16),0,255)'[a];[c]geq=r='min(255,r(X,Y)*255/max(0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y),1))':g='min(255,g(X,Y)*255/max(0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y),1))':b='min(255,b(X,Y)*255/max(0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y),1))'[c2];[c2][a]alphamerge,format=rgba" -pix_fmt rgba /tmp/portrait-alpha.png
  cwebp -q 80 -alpha_q 100 -m 6 /tmp/portrait-alpha.png -o portrait-fallback.webp
  ```

  The particle sampler composites the image over black before reading it, so a black-background replacement also works.
- `violin.webp`: generated editorial illustration of a violin in a workshop. Not an actual project screenshot. **No longer referenced** — The Luthier's Library card now uses the real site logo. Kept in the repo in case the editorial cover is wanted back.
- `luthiers-library-logo.webp`, `lenshive-logo.webp`, `shrestha-media-logo.webp`: the owner's own site logos, downloaded 2026-10-04 from `luthierslibrary.click`, `lenshive.net` and `shresthamedia.co` respectively. Each was trimmed to the mark's bounding box and converted with `cwebp -q 90 -alpha_q 100`. The Shrestha Media source was an opaque PNG on white; its background was cleared by flood-filling near-white **from the edges only**, so the white `SM` lettering enclosed by the camera body is preserved. All three are logos designed for light backgrounds, so project cards render them with `image.fit: "contain"` on a `--color-paper` plate rather than as full-bleed cover art.
- `300zx.webp`: generated editorial illustration of a burgundy 1991 Nissan 300ZX. Not a photograph of the owner's car.
- `assets/garage/300zx-*.webp`: **real photographs of the owner's car and garage**, supplied by the owner 2026-10-06. Six frames — `dusk-front`, `dusk-rear`, `bay-stripped`, `engine-hoist`, `engine-drop`, `timing` — each exported at two sizes: the full name (1500px long edge, `cwebp -q 78`) for the story page and `-sm` (760px long edge, `cwebp -q 72`) for the drifting collage on the home page. Sources were HEIC and JPEG originals outside the repo; originals are not committed. `engine-hoist` shows the owner. Regenerate with:

  ```sh
  sips -s format png -Z 1500 <source> --out /tmp/<name>-lg.png
  sips -s format png -Z 760  <source> --out /tmp/<name>-sm.png
  cwebp -q 78 -m 6 /tmp/<name>-lg.png -o apps/web/public/assets/garage/<name>.webp
  cwebp -q 72 -m 6 /tmp/<name>-sm.png -o apps/web/public/assets/garage/<name>-sm.webp
  ```

  `sips` carries the source's EXIF orientation through to the PNG instead of baking it in, and `cwebp` drops that metadata — so a photo shot in portrait can land sideways in the `.webp`. `300zx-timing` hit this and needed `sips --rotate 90` on both PNGs before the `cwebp` step. Check the output's pixel dimensions against the orientation you expect before committing.
- `assets/reel/*.mp4` + `*-poster.webp`: **the owner's own behind-the-scenes footage**, supplied 2026-10-06. Seven ~4-second cuts taken from seven long `.MOV` originals (4K/60 iPhone and 30fps camera files, 20 MB–390 MB each) that live outside the repo and are not committed. Each clip is **silent by design** — encoded with `-an`, so the files carry no audio stream at all rather than relying on the player's `muted` attribute. H.264, 560px tall (the one landscape cut is 720px wide), 30fps, `-crf 31`, `+faststart`; ~1.6 MB for the whole set including posters. The posters are the clip's first frame and are what the page shows when motion is reduced, so no video is fetched at all in that mode. Re-cut with:

  ```sh
  ffmpeg -ss <start> -i <source.MOV> -t 4 -an -sn -dn \
    -vf "scale=-2:560,fps=30,format=yuv420p" -c:v libx264 -profile:v high -crf 31 -preset slow \
    -movflags +faststart apps/web/public/assets/reel/<name>.mp4
  ffmpeg -ss <start> -i <source.MOV> -frames:v 1 -vf "scale=-2:560" /tmp/<name>.png
  cwebp -q 70 -m 6 /tmp/<name>.png -o apps/web/public/assets/reel/<name>-poster.webp
  ```

  **The four iPhone sources are HDR and must be tone-mapped, not just scaled.** `IMG_7891`, `IMG_5617`, `IMG_6112` and `IMG_6099` are 10-bit `yuv420p10le`, BT.2020 primaries, `arib-std-b67` (HLG) transfer, with a Dolby Vision configuration record. A plain `scale` + `format=yuv420p` decodes the HLG signal and hands it to x264 unconverted — the output is 8-bit SDR pixels still tagged `bt2020nc`/`arib-std-b67`, and every browser reads it as BT.709. HLG places midtones much lower in its curve, so the result is visibly washed out: measured mean luma 151 against 124 for a correct conversion of the same frame, about 22% too bright.

  This build of ffmpeg has no `libzimg`, so the usual `zscale=t=linear,tonemap=...` chain is unavailable. macOS's own `avconvert` tone-maps correctly and can trim in the same pass, which also matches what the owner sees opening the originals in QuickTime:

  ```sh
  avconvert --source IMG_6112.MOV --preset Preset1920x1080 --start 3.8 --duration 4 --output /tmp/sdr.mov --replace
  # then the ffmpeg encode above, from /tmp/sdr.mov instead of the original
  ```

  Check `color_transfer` on any new clip before encoding: `arib-std-b67` or `smpte2084` means HDR and needs this step. The three `singular_display` sources are already `bt709` and go straight through ffmpeg.

  `ffmpeg` applies each source's rotation metadata on decode, so these did not hit the sideways problem the stills did. `celebration.mp4` shows guests at a private family event; the rest show clients at portrait shoots — check before publishing that everyone pictured is happy to appear.
- `assets/studio/*.webp`: four stills for the Shrestha Media story page, pulled as single frames out of the same behind-the-scenes `.MOV` originals as the reel clips (`camera-back` from IMG_6112 at 4.7s, `field-shoot` from IMG_5617 at 1.2s, `celebration` from od_video-575 at 130s, `capitol` from IMG_7891 at 6.3s). All but `celebration` come from HDR sources and are cut from the tone-mapped `avconvert` intermediates described above, not the raw `.MOV`. 1500px long edge at `cwebp -q 80`, plus a `-sm` 760px copy. They are video frames, not shutter-captured stills, so they are softer than the `garage` photographs — swap in real exports if any exist.

  ```sh
  ffmpeg -ss <time> -i <source.MOV> -frames:v 1 -vf "scale=-2:1500" /tmp/<name>.png
  cwebp -q 80 -m 6 /tmp/<name>.png -o apps/web/public/assets/studio/<name>.webp
  ```

  `celebration.webp` shows guests at a private family event, and `camera-back.webp` shows a portrait client — same consent check as the reel clips applies before this goes public.
- `assets/diagrams/*.webp`: the owner's own architecture diagrams, supplied 2026-10-06, one per project. All three render on a `--color-paper` plate (the exports have white backgrounds) and link to themselves so the full-size version opens in a new tab.
  - `shrestha-media-architecture.webp` arrived as an 1800×1150 PNG and was converted with `cwebp -lossless -m 6` — both smaller (15 KB vs 78 KB) and sharper than lossy for flat-colour diagrams with text. A second, re-compressed PNG export of the same diagram was supplied later and is pixel-identical (verified with an ffmpeg difference blend, `YMAX=0`), so the asset was left alone.
  - `lenshive-architecture.webp` (1639×959) and `luthiers-library-architecture.webp` (1586×992) arrived already encoded as lossy WebP and were **copied byte-for-byte**, not re-encoded — re-encoding lossy source only degrades it, and lossless would have inflated it. Verified by SHA-256 against the originals.
  - Prefer `cwebp -lossless` for any new diagram supplied as PNG/SVG; copy as-is if it is already a reasonably sized WebP.

  Each project's `caseStudy.architecture` prose was rewritten to describe exactly the components and edges its diagram shows, so **if a diagram is replaced, the prose has to move with it.** Two known mismatches were resolved in the diagram's favour: Shrestha Media's case study previously described a static site with no backend, and The Luthier's Library's previously claimed Aurora RDS and EC2 hosting, which its diagram does not show (it says MySQL via SQLAlchemy, and its footer states deployment hosting is not specified).
- `assets/brand/logo-full.webp`, `favicon-32.png`, `apple-touch-icon.png`, `icon-512.png`: the owner's own PS monogram logo, supplied 2026-10-07 as a 1254×1254 PNG. The source is **RGBA with a transparent background and a black glyph** — not black on white as it appears in a viewer, so `format=gray` composites it to solid black and loses the artwork. Work from the alpha channel. Content bounds in the source: full logo at x=308 y=340 638×610, monogram alone at x=404 y=340 453×509, wordmark at y=903.

  The site is dark, so the glyph is recoloured to `--color-paper` while the supplied alpha is kept:

  ```sh
  ffmpeg -i logo.png -filter_complex \
    "[0:v]crop=638:610:308:340,scale=760:-1,format=rgba,geq=r='238':g='233':b='223':a='alpha(X,Y)'" \
    -frames:v 1 /tmp/logo-full.png
  cwebp -q 92 -alpha_q 100 -m 6 /tmp/logo-full.png -o apps/web/public/assets/brand/logo-full.webp
  ```

  The icons are the monogram alone on a `--color-ink` tile at ~65% height, rendered at 512 and downscaled with lanczos to 180 and 32 — the wordmark is illegible at tab size, so it is cropped out. These replaced the earlier hand-drawn `favicon.svg`, which was deleted. A `logo-mark.webp` (monogram, paper, transparent) is not committed because nothing references it; regenerate it from the crop above if a standalone mark is wanted.
- Reference `.mov`: inspected locally at half-second intervals; not redistributed.
- No licensed third-party imagery downloaded.

Missing: true 3D head/hair asset, and original project screenshots (the three live sites are represented by their logos, not screenshots). The photography section now runs the `assets/reel` clips; a full stills gallery is still outstanding.
