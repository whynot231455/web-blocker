'use client';

export const ALL_DAYS: number[] = [0, 1, 2, 3, 4, 5, 6];

// Index matches Date#getDay(): 0 = Sunday.
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SELECTED_FILL = '#FF4141';
const UNSELECTED_FILL = '#FFFFFF';
const STROKE = '#000000';

// A circle drawn on a coarse pixel grid so its edge is stair-stepped like the
// rest of the pixel UI. Cells on the rim are the black stroke, the rest the body.
const GRID = 13;
const RADIUS = GRID / 2;

const PIXEL_CIRCLE = (() => {
  const filled = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) return false;
    const dx = x + 0.5 - RADIUS;
    const dy = y + 0.5 - RADIUS;
    return dx * dx + dy * dy <= RADIUS * RADIUS;
  };

  const rim: Array<[number, number]> = [];
  const body: Array<[number, number]> = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (!filled(x, y)) continue;
      const isRim = !filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1);
      (isRim ? rim : body).push([x, y]);
    }
  }
  return { rim, body };
})();

function PixelCircle({ fill }: { fill: string }) {
  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      aria-hidden="true"
      shapeRendering="crispEdges"
      className="absolute inset-0 h-full w-full"
    >
      {PIXEL_CIRCLE.body.map(([x, y]) => (
        <rect key={`b${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />
      ))}
      {PIXEL_CIRCLE.rim.map(([x, y]) => (
        <rect key={`r${x}-${y}`} x={x} y={y} width="1" height="1" fill={STROKE} />
      ))}
    </svg>
  );
}

type DayPickerProps = {
  value: number[];
  onChange: (days: number[]) => void;
  label?: string;
  disabled?: boolean;
};

export function DayPicker({ value, onChange, label = 'Block on days', disabled = false }: DayPickerProps) {
  const selected = new Set(value);

  const toggle = (day: number) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(day)) {
      // A window needs at least one day, otherwise it could never block.
      if (next.size === 1) return;
      next.delete(day);
    } else {
      next.add(day);
    }
    onChange(ALL_DAYS.filter((d) => next.has(d)));
  };

  return (
    <div className="grid gap-2" role="group" aria-label={label}>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-2">
        {DAY_LETTERS.map((letter, day) => {
          const isSelected = selected.has(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={DAY_NAMES[day]}
              title={DAY_NAMES[day]}
              className="relative h-10 w-10 shrink-0 cursor-pointer select-none disabled:cursor-wait transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <PixelCircle fill={isSelected ? SELECTED_FILL : UNSELECTED_FILL} />
              <span
                className="relative flex h-full w-full items-center justify-center text-[10px] font-black leading-none"
                style={{ color: isSelected ? '#FFFFFF' : '#000000' }}
              >
                {letter}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
