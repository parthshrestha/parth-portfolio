import {useEffect, useRef, type RefObject} from 'react';
import {experience, particle, schedule, smooth} from '../../experience/timeline';
import {samplePortrait, type PortraitSample} from './sampler';

interface Props {
  portrait: RefObject<HTMLImageElement | null>;
  onReady: () => void;
  onError: (reason: string) => void;
}

/** A regular canvas keeps the portrait interactive even when browser GPU rendering is unavailable. */
export default function Particles({portrait, onReady, onError}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({onReady, onError});
  callbacks.current = {onReady, onError};

  useEffect(() => {
    const surface = canvas.current;
    if (!surface) return;
    const ctx = surface.getContext('2d');
    if (!ctx) {
      callbacks.current.onError('Canvas rendering unavailable');
      return;
    }
    let sample: PortraitSample | undefined;
    let sourceSize = 1;
    let frame = 0;
    let live = true;
    let announced = false;
    let width = 0, height = 0, side = 1, cx = 0, cy = 0;
    let bounds = surface.getBoundingClientRect();
    let cursorX = -10000, cursorY = -10000, strength = 0, targetStrength = 0;
    let burstX = 0, burstY = 0, burstAt = -10;
    let previous = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const wake = () => {
      if (live && !frame && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const measure = () => {
      bounds = surface.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const imageBounds = portrait.current?.getBoundingClientRect();
      if (imageBounds) {
        side = Math.max(imageBounds.width, imageBounds.height);
        cx = imageBounds.left + imageBounds.width / 2 - bounds.left;
        cy = imageBounds.top + imageBounds.height / 2 - bounds.top;
      }
      wake();
    };

    function draw(now: number) {
      frame = 0;
      if (!live || !sample || !width || !height) return;
      const time = now / 1000;
      const dt = Math.min((now - previous) / 1000 || 1 / 60, 0.05);
      previous = now;
      strength += (targetStrength - strength) * (1 - Math.exp(-12 * dt));
      ctx!.clearRect(0, 0, width, height);
      const p = experience.progress;
      if (p < schedule.fadeEnd) {
        const scale = side / sourceSize;
        // Preserve the fine stipple shading at rest; release it before the main dispersal.
        const detail = 1 - smooth(0.08, 0.32, p);
        ctx!.globalAlpha = detail * 0.78;
        const imageWidth = side * image.naturalWidth / Math.max(image.naturalWidth, image.naturalHeight);
        const imageHeight = side * image.naturalHeight / Math.max(image.naturalWidth, image.naturalHeight);
        ctx!.drawImage(image, cx - imageWidth / 2, cy - imageHeight / 2, imageWidth, imageHeight);
        ctx!.globalAlpha = 1;
        // Batch by opacity: thousands of dots, only eight fill calls per frame.
        const paths = Array.from({length: 8}, () => new Path2D());
        for (let i = 0; i < sample.count; i++) {
          const px = sample.positions[i * 3], py = sample.positions[i * 3 + 1];
          const a = sample.seeds[i * 4], b = sample.seeds[i * 4 + 1];
          const c = sample.seeds[i * 4 + 2], d = sample.seeds[i * 4 + 3];
          const state = particle(p, sample.order[i], a, b);
          if (state.alpha < 0.02) continue;
          const flight = state.flight, phase = a * Math.PI * 2;
          const distance = (0.4 + d * 1.3) * side * Math.pow(flight, 1.7);
          const slope = (c - 0.5) * 0.6;
          const norm = Math.sqrt(1 + slope * slope);
          let x = cx + px * side - distance / norm;
          let y = cy - py * side - distance * slope / norm;
          const k = 3 + b * 4;
          x += Math.cos(phase * 1.3 + flight * k * 0.7) * 0.03 * side * flight;
          y -= Math.sin(phase + flight * k) * 0.06 * side * flight;
          const drift = (0.2 + d * 0.4) * (1 + flight * 5);
          x += (Math.sin(time * 1.1 + px * 9 + py * 4) * 0.35 + Math.sin(time * 1.3 + phase) * drift) * (1 + flight * 1.5);
          y -= (Math.cos(time * 0.8 + py * 7 - px * 3) * 0.35 + Math.cos(time * 1.7 + b * Math.PI * 2) * drift) * (1 + flight * 1.5);
          const dx = x - cursorX, dy = y - cursorY;
          const dist = Math.max(Math.hypot(dx, dy), 0.001);
          const influence = 1 - smooth(0, side * 0.12, dist);
          const push = influence * influence * strength * (1 - flight * 0.7);
          x += (dx - dy / 3) / dist * side * 0.025 * push;
          y += (dy + dx / 3) / dist * side * 0.025 * push;
          const age = time - burstAt;
          let ring = 0;
          if (age >= 0 && age < 1.5) {
            const bx = x - burstX, by = y - burstY;
            const bd = Math.max(Math.hypot(bx, by), 0.001);
            const q = (bd - age * 0.9 * side) / (0.06 * side);
            ring = Math.exp(-q * q) * (1 - age / 1.5) * (1 - flight * 0.5);
            x += bx / bd * ring * 0.035 * side;
            y += by / bd * ring * 0.035 * side;
          }
          if (x < -5 || x > width + 5 || y < -5 || y > height + 5) continue;
          const radius = Math.max(0.35, sample.sizes[i] * scale * 0.8 * (1 + 0.35 * flight) * (1 + 0.6 * push + 0.5 * ring));
          const alpha = Math.min(1, state.alpha * (1 - detail * 0.5) * (0.94 + 0.06 * Math.sin(time * 1.3 + phase * 2)));
          const path = paths[Math.min(7, Math.floor(alpha * 8))];
          path.moveTo(x + radius, y);
          path.arc(x, y, radius, 0, Math.PI * 2);
        }
        ctx!.fillStyle = '#e8dfcd';
        paths.forEach((path, i) => {
          ctx!.globalAlpha = (i + 1) / 8;
          ctx!.fill(path);
        });
        ctx!.globalAlpha = 1;
        experience.frames++;
      }
      // Announce only after actual drawing, so the static portrait never vanishes prematurely.
      if (!announced) {
        announced = true;
        callbacks.current.onReady();
      }
      if (p < schedule.fadeEnd) wake();
    }

    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      bounds = surface.getBoundingClientRect();
      cursorX = event.clientX - bounds.left;
      cursorY = event.clientY - bounds.top;
      targetStrength = 1;
      wake();
    };
    const leave = (event?: PointerEvent) => {
      if (event?.relatedTarget) return;
      targetStrength = 0;
    };
    const blur = () => leave();
    const click = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest('a, button, input, select, textarea')) return;
      bounds = surface.getBoundingClientRect();
      burstX = event.clientX - bounds.left;
      burstY = event.clientY - bounds.top;
      burstAt = performance.now() / 1000;
      wake();
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else wake();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    if (portrait.current) observer.observe(portrait.current);
    experience.invalidate = wake;
    window.addEventListener('pointermove', move, {passive: true});
    window.addEventListener('pointerout', leave);
    window.addEventListener('blur', blur);
    window.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);

    const image = new Image();
    image.onload = () => {
      if (!live) return;
      try {
        const ratio = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
        const w = Math.round(image.naturalWidth * ratio), h = Math.round(image.naturalHeight * ratio);
        const source = document.createElement('canvas');
        source.width = w; source.height = h;
        const sourceContext = source.getContext('2d', {willReadFrequently: true});
        if (!sourceContext) throw Error('Portrait sampling unavailable');
        sourceContext.fillStyle = '#000';
        sourceContext.fillRect(0, 0, w, h);
        sourceContext.drawImage(image, 0, 0, w, h);
        const rgba = sourceContext.getImageData(0, 0, w, h).data;
        const gray = new Uint8Array(w * h);
        for (let i = 0; i < gray.length; i++) gray[i] = rgba[i * 4] * 0.299 + rgba[i * 4 + 1] * 0.587 + rgba[i * 4 + 2] * 0.114;
        sample = samplePortrait(gray, w, h);
        if (!sample.count) throw Error('No portrait dots found');
        sourceSize = Math.max(w, h);
        measure();
      } catch (error) {
        callbacks.current.onError(error instanceof Error ? error.message : 'Portrait loading failed');
      }
    };
    image.onerror = () => { if (live) callbacks.current.onError('Portrait image failed to load'); };
    image.src = '/assets/hero/portrait-fallback.webp';
    measure();
    return () => {
      live = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      experience.invalidate = () => {};
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', blur);
      window.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [portrait]);

  return <canvas ref={canvas} className="h-full w-full" style={{display: 'block', pointerEvents: 'none'}} />;
}
