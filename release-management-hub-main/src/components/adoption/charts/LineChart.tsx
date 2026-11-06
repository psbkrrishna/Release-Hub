import { useEffect, useRef, useState } from 'react';
import { RADIUS, T } from '@/styles/zerra';

/* ---------------------------------------------------------------------------
   One series over time, drawn in SVG.

   No chart library: the page needs one line, a recessive grid, release
   markers and a hover readout, and that is less code than configuring one.
   Single series, so no legend - the panel title names it. Brand blue line at
   2px, gridlines in --bd, axis text in --tx4 with tabular figures. Hover is a
   crosshair plus a dark tooltip, snapped to the nearest point, with a hit area
   the full height of the plot so nobody has to find a 2px line.
   --------------------------------------------------------------------------- */

export interface ChartPoint {
  label: string;
  value: number;
}

export interface ChartMarker {
  index: number;
  label: string;
}

const HEIGHT = 220;
const M = { top: 24, right: 16, bottom: 28, left: 44 };

/** Round-number ticks from zero, about four of them. */
const ticksFor = (max: number) => {
  if (max <= 0) return [0, 1];
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) out.push(v);
  if (out[out.length - 1] < max) out.push(out[out.length - 1] + step);
  return out;
};

const fmt = (v: number) =>
  v >= 10_000 ? `${(v / 1000).toFixed(0)}k` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;

const LineChart = ({
  points,
  markers = [],
  name,
}: {
  points: ChartPoint[];
  markers?: ChartMarker[];
  /** What the values are, for the tooltip and the accessible label. */
  name: string;
}) => {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = points.length;
  const ticks = ticksFor(Math.max(0, ...points.map((p) => p.value)));
  const top = ticks[ticks.length - 1];
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const x = (i: number) => M.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => M.top + (1 - v / top) * plotH;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');

  /* About six date labels, whatever the width. */
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(plotW / 96))));

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round((px / rect.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const h = hover !== null ? points[hover] : null;

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%' }}>
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${name}: ${points.map((p) => `${p.label} ${Math.round(p.value)}`).join(', ')}`}
        style={{ display: 'block', fontVariantNumeric: 'tabular-nums' }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={T.bd} strokeWidth={1} />
            <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={T.tx4}>
              {fmt(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) =>
          // Every `every`th date, plus the last - unless it would crowd the last.
          (i % every === 0 && n - 1 - i >= every * 0.6) || i === n - 1 ? (
            <text
              key={p.label + i}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              fontSize={11}
              fill={T.tx4}
            >
              {p.label}
            </text>
          ) : null,
        )}

        {markers.filter((m) => m.index >= 0).map((m) => (
          <g key={m.label}>
            <line
              x1={x(m.index)}
              x2={x(m.index)}
              y1={M.top}
              y2={M.top + plotH}
              stroke={T.tx5}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text x={x(m.index) + 4} y={M.top - 8} fontSize={11} fontWeight={600} fill={T.tx3}>
              {m.label}
            </text>
          </g>
        ))}

        <path d={path} fill="none" stroke={T.brand} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

        {h && hover !== null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke={T.tx5} strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.value)} r={5} fill={T.brand} stroke={T.card} strokeWidth={2} />
          </g>
        )}

        <rect
          x={M.left}
          y={M.top}
          width={plotW}
          height={plotH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>

      {h && hover !== null && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            top: Math.max(0, y(h.value) - 56),
            left: Math.min(Math.max(x(hover), 80), width - 80),
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            background: T.neutralStrong,
            color: '#FFFFFF',
            borderRadius: RADIUS.tag,
            padding: '6px 8px',
            fontSize: 12,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            animation: 'scrimIn 120ms ease',
          }}
        >
          <div style={{ opacity: 0.8 }}>{h.label}</div>
          <div style={{ fontWeight: 600 }}>
            {Math.round(h.value).toLocaleString()} {name.toLowerCase()}
          </div>
        </div>
      )}
    </div>
  );
};

export default LineChart;
