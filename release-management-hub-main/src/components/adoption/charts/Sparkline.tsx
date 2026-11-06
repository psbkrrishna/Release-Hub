import { T } from '@/styles/zerra';

/* A trend in the space of a word: one line, no axes, the last point marked.
   Decorative next to a number that says the same thing, so hidden from
   assistive tech - the change % beside it is the accessible reading. */
const Sparkline = ({
  values,
  width = 80,
  height = 24,
}: {
  values: number[];
  width?: number;
  height?: number;
}) => {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const flat = max === min;
  const pad = 3;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => (flat ? height / 2 : pad + (1 - (v - min) / (max - min)) * (height - pad * 2));
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = values.length - 1;
  const stroke = max === 0 ? T.tx5 : T.brand;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" style={{ display: 'block' }}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r={2.5} fill={stroke} />
    </svg>
  );
};

export default Sparkline;
