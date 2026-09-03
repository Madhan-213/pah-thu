// ============================================================
// RadarChart — Pure SVG 6-axis radar chart
// ============================================================

interface RadarChartProps {
  labels: string[];
  valuesA: number[];
  valuesB: number[];
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
  size?: number;
}

export function RadarChart({
  labels,
  valuesA,
  valuesB,
  labelA,
  labelB,
  colorA = '#e74c3c',
  colorB = '#2980b9',
  size = 240,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const numAxes = labels.length;

  function polarToCartesian(value: number, axisIndex: number) {
    const angle = (Math.PI * 2 * axisIndex) / numAxes - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function getLabelPos(axisIndex: number) {
    const angle = (Math.PI * 2 * axisIndex) / numAxes - Math.PI / 2;
    const r = radius + 22;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function buildPath(values: number[]) {
    const points = values.map((v, i) => polarToCartesian(v, i));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
  }

  // Grid rings
  const rings = [20, 40, 60, 80, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {rings.map(ring => (
        <polygon
          key={ring}
          points={labels.map((_, i) => {
            const p = polarToCartesian(ring, i);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke="#e2ddd5"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const outer = polarToCartesian(100, i);
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="#d4c4b0"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon B (behind) */}
      <path
        d={buildPath(valuesB)}
        fill={colorB}
        fillOpacity={0.15}
        stroke={colorB}
        strokeWidth={2}
      />

      {/* Data polygon A */}
      <path
        d={buildPath(valuesA)}
        fill={colorA}
        fillOpacity={0.15}
        stroke={colorA}
        strokeWidth={2}
      />

      {/* Data points A */}
      {valuesA.map((v, i) => {
        const p = polarToCartesian(v, i);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorA} />;
      })}

      {/* Data points B */}
      {valuesB.map((v, i) => {
        const p = polarToCartesian(v, i);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={colorB} />;
      })}

      {/* Axis labels */}
      {labels.map((label, i) => {
        const pos = getLabelPos(i);
        return (
          <text
            key={i}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9"
            fill="#6e6458"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {label}
          </text>
        );
      })}

      {/* Legend */}
      <rect x={4} y={size - 32} width={10} height={10} fill={colorA} rx={2} />
      <text x={18} y={size - 22} fontSize="9" fill="#524a40" fontFamily="Inter, sans-serif">{labelA}</text>
      <rect x={4} y={size - 18} width={10} height={10} fill={colorB} rx={2} />
      <text x={18} y={size - 8} fontSize="9" fill="#524a40" fontFamily="Inter, sans-serif">{labelB}</text>
    </svg>
  );
}
