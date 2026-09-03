// ============================================================
// LineChart — Pure SVG line chart
// ============================================================

interface LineChartProps {
  dataA: number[];
  dataB?: number[];
  labelA?: string;
  labelB?: string;
  colorA?: string;
  colorB?: string;
  width?: number;
  height?: number;
  xLabels?: string[];
  yLabel?: string;
  showArea?: boolean;
}

export function LineChart({
  dataA,
  dataB,
  labelA = 'A',
  labelB = 'B',
  colorA = '#e74c3c',
  colorB = '#2980b9',
  width = 320,
  height = 160,
  xLabels,
  yLabel,
  showArea = true,
}: LineChartProps) {
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const allValues = [...dataA, ...(dataB ?? [])];
  const minVal = Math.min(0, ...allValues);
  const maxVal = Math.max(...allValues, 1);

  function toX(i: number) {
    return padLeft + (i / Math.max(dataA.length - 1, 1)) * chartW;
  }

  function toY(v: number) {
    return padTop + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  }

  function buildPath(data: number[]) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  }

  function buildArea(data: number[]) {
    const line = buildPath(data);
    const baseY = toY(minVal);
    return `${line} L${toX(data.length - 1).toFixed(1)},${baseY.toFixed(1)} L${padLeft},${baseY.toFixed(1)} Z`;
  }

  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal].map(v => Math.round(v));

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {/* Grid lines */}
      {yTicks.map((tick, i) => (
        <g key={i}>
          <line
            x1={padLeft} y1={toY(tick)}
            x2={padLeft + chartW} y2={toY(tick)}
            stroke="#e2ddd5" strokeWidth="1" strokeDasharray="3,3"
          />
          <text
            x={padLeft - 4} y={toY(tick)}
            textAnchor="end" dominantBaseline="middle"
            fontSize="8" fill="#a89e90" fontFamily="Inter, sans-serif"
          >
            {tick}
          </text>
        </g>
      ))}

      {/* Area fills */}
      {showArea && dataB && (
        <path d={buildArea(dataB)} fill={colorB} fillOpacity={0.08} />
      )}
      {showArea && (
        <path d={buildArea(dataA)} fill={colorA} fillOpacity={0.1} />
      )}

      {/* Lines */}
      {dataB && (
        <path d={buildPath(dataB)} fill="none" stroke={colorB} strokeWidth={2} strokeLinejoin="round" />
      )}
      <path d={buildPath(dataA)} fill="none" stroke={colorA} strokeWidth={2.5} strokeLinejoin="round" />

      {/* Data points */}
      {dataA.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={colorA} />
      ))}
      {dataB && dataB.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill={colorB} />
      ))}

      {/* X-axis labels */}
      {xLabels && xLabels.map((label, i) => (
        <text
          key={i}
          x={toX(i)} y={height - 6}
          textAnchor="middle"
          fontSize="8" fill="#a89e90" fontFamily="Inter, sans-serif"
        >
          {label}
        </text>
      ))}

      {/* Legend */}
      {dataB && (
        <g transform={`translate(${padLeft},${padTop - 2})`}>
          <rect x={0} y={0} width={8} height={8} fill={colorA} rx={1} />
          <text x={12} y={7} fontSize="8" fill="#6e6458" fontFamily="Inter, sans-serif">{labelA}</text>
          <rect x={60} y={0} width={8} height={8} fill={colorB} rx={1} />
          <text x={72} y={7} fontSize="8" fill="#6e6458" fontFamily="Inter, sans-serif">{labelB}</text>
        </g>
      )}

      {/* Axes */}
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#d4c4b0" strokeWidth="1.5" />
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#d4c4b0" strokeWidth="1.5" />
    </svg>
  );
}
