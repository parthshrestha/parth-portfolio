/**
 * Line arrow drawn as SVG. The text glyphs (↗ in particular) render as colour emoji on iOS, so every arrow
 * on the site uses this instead. Sized in em and stroked with currentColor, so it follows the text it sits in.
 */
const rotation = {'up-right': 0, right: 45, 'down-right': 90, down: 135, left: 225, up: 315} as const;

export function Arrow({direction = 'up-right', className = ''}: {direction?: keyof typeof rotation; className?: string}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`arrow inline-block shrink-0 align-[-0.125em] ${className}`}
      style={{transform: `rotate(${rotation[direction]}deg)`}}
    >
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" />
    </svg>
  );
}
