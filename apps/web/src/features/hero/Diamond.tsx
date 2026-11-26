import {Arrow} from '../../ui/Arrow';

/**
 * The explore menu: one diamond cut into four trapezoids around a smaller diamond that holds the mark.
 *
 * Geometry is in a 0..100 square, so the same numbers serve as SVG coordinates and as clip-path
 * percentages. The outer diamond's vertices are the midpoints of the square's sides; the inner one is the
 * same shape scaled by INNER about the centre. Each section runs between one outer edge and the parallel
 * inner edge, numbered clockwise from the top left. Sections are inset by GAP so a hairline of
 * background separates them.
 *
 * Each section is a band on a 45° diagonal, so its text runs along the band rather than across it: a
 * horizontal block would be clipped at the band's edges. Rotations are ±45°, which keeps all four
 * readable (the top pair leans outward, the bottom pair inward, none upside down).
 */
type Point = [number, number];

const INNER = 0.48;
const GAP = 0.9;

const outer: Point[] = [[50, 0], [100, 50], [50, 100], [0, 50]]; // top, right, bottom, left
const inner = outer.map(([x, y]): Point => [50 + (x - 50) * INNER, 50 + (y - 50) * INNER]);

/** Moves every edge of a convex polygon inward by `d` and returns the new corners. */
function inset(points: Point[], d: number): Point[] {
  const n = points.length;
  const area = points.reduce((s, [x, y], i) => s + x * points[(i + 1) % n][1] - points[(i + 1) % n][0] * y, 0);
  const sign = area > 0 ? 1 : -1;
  const lines = points.map(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % n];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = (-(y2 - y1) / len) * sign, ny = ((x2 - x1) / len) * sign; // inward normal
    return {x: x1 + nx * d, y: y1 + ny * d, dx: x2 - x1, dy: y2 - y1};
  });
  return lines.map((b, i) => {
    const a = lines[(i + n - 1) % n];
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / (a.dx * b.dy - a.dy * b.dx);
    return [a.x + a.dx * t, a.y + a.dy * t];
  });
}


const fmt = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
const clip = (points: Point[]) => `polygon(${points.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(', ')})`;

// Section i lies between outer edge (i-1 → i) and inner edge (i → i-1): 1 top-left, 2 top-right, 3 bottom-right, 4 bottom-left.
const sections = [3, 0, 1, 2].map((i, k) => {
  const j = (i + 1) % 4;
  const shape = inset([outer[i], outer[j], inner[j], inner[i]], GAP);
  // Text sits halfway between the midpoints of the outer and inner edges, i.e. on the band's centre line.
  const mid = (a: Point, b: Point) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Point;
  const centre = mid(mid(outer[i], outer[j]), mid(inner[i], inner[j]));
  return {shape, centre, angle: k % 2 ? 45 : -45};
});
const core = inset(inner, GAP);

export function Diamond({items}: {items: string[][]}) {
  return (
    <div className="diamond relative aspect-square">
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <polygon points={fmt(core)} className="diamond-core" vectorEffect="non-scaling-stroke" />
      </svg>
      <img
        src="/assets/brand/logo-full.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[21%] -translate-x-1/2 -translate-y-1/2"
      />
      {items.map(([n, label, id], i) => {
        const {shape, centre, angle} = sections[i];
        return (
          <a key={id} href={`#${id}`} className="diamond-section group absolute inset-0" style={{clipPath: clip(shape)}}>
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <polygon points={fmt(shape)} vectorEffect="non-scaling-stroke" />
            </svg>
            <span
              className="absolute flex flex-col items-center whitespace-nowrap text-center"
              style={{left: `${centre[0]}%`, top: `${centre[1]}%`, transform: `translate(-50%, -50%) rotate(${angle}deg)`}}
            >
              <span className="label text-[10px] text-muted sm:text-[11px]">
                {n}
                <span className="hidden sm:inline"> / Explore</span>
              </span>
              <span className="mt-1.5 flex items-center gap-2 text-[15px] leading-tight sm:text-lg md:text-xl">
                {label}
                <span className="text-amber"><Arrow direction="right" /></span>
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}
