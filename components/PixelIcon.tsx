import type { CSSProperties } from 'react';

/**
 * 8-bit icons. Each is a 12 × 12 bitmap: only the fill is drawn, and a 1-pixel ink outline is generated around the
 * outside, so a new icon needs just a silhouette. Digits are palette colours; "." is empty.
 *   1 ink   2 white   3 yellow   4 green   5 orange   6 red   7 sky   8 mist
 */
const COLOURS: Record<string, string> = { '1': '#1a1c2c', '2': '#f4f4f4', '3': '#ffcd75', '4': '#38b764', '5': '#ef7d57', '6': '#b13e53', '7': '#41a6f6', '8': '#94b0c2' };
const OUTLINE = '#1a1c2c';
const N = 12;

const BACK = ['............', '............', '.....33.....', '....33......', '...33.......', '..33........', '..33........', '...33.......', '....33......', '.....33.....', '............', '............'];

// The map is built from folded panels, offset up and down, with a pin on the middle one.
const MAP = Array.from({ length: N }, (_, r) => {
  const a = r >= 2 && r <= 10;
  const b = r >= 1 && r <= 9;
  const pin = r === 4 || r === 5;
  return (a ? '7777' : '....') + (a || b ? '1' : '.') + (b ? (pin ? '466' : '444') : '...') + (a || b ? '1' : '.') + (a ? '777' : '...');
});

export const ICON_BITMAPS: Record<string, string[]> = {
  plane: ['.....77.....', '....7227....', '....7777....', '...777777...', '..77777777..', '.7777777777.', '777777777777', '77..7777..77', '7...7777...7', '....7777....', '...777777...', '...77..77...'],
  bed: ['............', '............', '88..........', '88.55.......', '88.552222222', '884444444444', '884444444444', '884444444444', '88........88', '88........88', '............', '............'],
  calendar: ['.11......11.', '222222222222', '333333333333', '222222222222', '212121212122', '222222222222', '212121212122', '222222222222', '212121222222', '222222222222', '............', '............'],
  list: ['............', '33.22222222.', '33.22222222.', '............', '33.22222222.', '33.22222222.', '............', '33.22222222.', '33.22222222.', '............', '............', '............'],
  map: MAP,
  pin: ['............', '...666666...', '..66666666..', '..66622666..', '..66622666..', '..66666666..', '...666666...', '...666666...', '....6666....', '....6666....', '.....66.....', '.....66.....'],
  check: ['............', '............', '..........44', '.........444', '........444.', '44.....444..', '444...444...', '.444.444....', '..44444.....', '...444......', '....4.......', '............'],
  plus: ['............', '....3333....', '....3333....', '....3333....', '333333333333', '333333333333', '333333333333', '333333333333', '....3333....', '....3333....', '....3333....', '............'],
  back: BACK,
  forward: BACK.map((r) => r.split('').reverse().join('')),
  suitcase: ['....1111....', '....1..1....', '555555555555', '555555555555', '555555555555', '555255552555', '555555555555', '555555555555', '555555555555', '555555555555', '............', '............'],
  lock: ['...111111...', '..11....11..', '..11....11..', '..11....11..', '333333333333', '333333333333', '333311113333', '333311113333', '333331133333', '333331133333', '333333333333', '............'],
  close: ['............', '.66......66.', '..66....66..', '...66..66...', '....6666....', '.....66.....', '.....66.....', '....6666....', '...66..66...', '..66....66..', '.66......66.', '............'],
  external: ['............', '...4444444..', '...4444444..', '.........44.', '.......4.44.', '......44.44.', '.....44..44.', '....44......', '...44.......', '..44........', '............', '............'],
  gear: ['.....33.....', '.3..3333..3.', '..33333333..', '.3333..3333.', '.333....333.', '3333....3333', '3333....3333', '.333....333.', '.3333..3333.', '..33333333..', '.3..3333..3.', '.....33.....'],
};
for (const k of Object.keys(ICON_BITMAPS)) ICON_BITMAPS[k] = ICON_BITMAPS[k].map((r) => (r + '.'.repeat(N)).slice(0, N));

export type IconName = keyof typeof ICON_BITMAPS;
type Cell = { x: number; y: number; fill: string };
const cache = new Map<string, Cell[]>();

function cellsFor(name: string): Cell[] {
  const hit = cache.get(name);
  if (hit) return hit;
  const g = ICON_BITMAPS[name];
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && g[y][x] !== '.';
  // The outside = empty cells reachable from beyond the bitmap, so holes inside an icon are not outlined.
  const outside = Array.from({ length: N + 2 }, () => Array<boolean>(N + 2).fill(false));
  const stack: [number, number][] = [[-1, -1]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < -1 || y < -1 || x > N || y > N || outside[y + 1][x + 1] || filled(x, y)) continue;
    outside[y + 1][x + 1] = true;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  const cells: Cell[] = [];
  for (let y = -1; y <= N; y++)
    for (let x = -1; x <= N; x++) {
      if (filled(x, y)) cells.push({ x: x + 1, y: y + 1, fill: COLOURS[g[y][x]] });
      else if (outside[y + 1][x + 1] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) cells.push({ x: x + 1, y: y + 1, fill: OUTLINE });
    }
  cache.set(name, cells);
  return cells;
}

/** A pixel icon. `size` is in pixels and snaps to whole multiples of the 14-cell icon so it stays crisp. */
export function PixelIcon({ name, size = 28, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  const px = 14 * Math.max(1, Math.round(size / 14));
  return (
    <svg width={px} height={px} viewBox="0 0 14 14" shapeRendering="crispEdges" aria-hidden focusable="false" style={{ display: 'block', flex: 'none', ...style }}>
      {cellsFor(name).map((c) => (
        <rect key={`${c.x}-${c.y}`} x={c.x} y={c.y} width={1} height={1} fill={c.fill} />
      ))}
    </svg>
  );
}
