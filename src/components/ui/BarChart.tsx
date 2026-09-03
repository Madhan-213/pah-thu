// ============================================================
// BarChart — Pure SVG bar chart
// ============================================================

interface BarChartProps {
  data: Array<{ label: string; valueA: number; valueB?: number }>;
  labelA?: string;
  labelB?: string;
  colorA?: string;
  colorB?: string;
  width?: number;
  height?: number;
  horizontal?: boolean;
}

export function BarChart({
  data,
  labelA = 'A',
  labelB = 'B',
  colorA = '#e74c3c',
  colorB = '#2980b9',
  width = 320,
  height = 200,
  horizontal = false,
}: BarChartProps) {
  const padLeft = horizontal ? 64 : 28;
  const padRight = 12;
  const padTop = 24;
  const padBottom = horizontal ? 24 : 40;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const hasB = data.some(d => d.valueB !== undefined);
  const allValues = data.flatMap(d => [d.valueA, d.valueB ?? 0]);
  const maxVal = Math.max(...allValues, 1);

  const groupWidth = chartW / data.length;
  const barWidth = hasB ? groupWidth * 0.38 : groupWidth * 0.6;

  if (horizontal) {
    const barH = chartH / data.length * 0.6;
    return (
      <svg width={width} height={height}>
        {/* Legend */}
        <g transform={`translate(${padLeft},8)`}>
          <rect x={0} y={0} width={8} height={8} fill={colorA} rx={1} />
          <text x={12} y={7} fontSize="9" fill="#6e6458" fontFamily="Inter, sans-serif">{labelA}</text>
          {hasB && <>
            <rect x={60} y={0} width={8} height={8} fill={colorB} rx={1} />
            <text x={72} y={7} fontSize="9" fill="#6e6458" fontFamily="Inter, sans-serif">{labelB}</text>
          </>}
        </g>

        {data.map((d, i) => {
          const y = padTop + i * (chartH / data.length);
          const wA = (d.valueA / maxVal) * chartW;
          const wB = ((d.valueB ?? 0) / maxVal) * chartW;

          return (
            <g key={i}>
              <text x={padLeft - 4} y={y + barH / 2 + 1} textAnchor="end" dominantBaseline="middle"
                fontSize="9" fill="#8a8070" fontFamily="Inter, sans-serif">{d.label}</text>
              <rect x={padLeft} y={y} width={wA} height={barH * (hasB ? 0.5 : 1)} fill={colorA} rx={2} />
              {hasB && (
                <rect x={padLeft} y={y + barH * 0.52} width={wB} height={barH * 0.48} fill={colorB} rx={2} />
              )}
              <text x={padLeft + wA + 2} y={y + barH * (hasB ? 0.25 : 0.5)} dominantBaseline="middle"
                fontSize="8" fill={colorA} fontFamily="Inter, sans-serif" fontWeight="600">
                {d.valueA}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  return (
    <svg width={width} height={height}>
      {/* Legend */}
      <g transform={`translate(${padLeft},8)`}>
        <rect x={0} y={0} width={8} height={8} fill={colorA} rx={1} />
        <text x={12} y={7} fontSize="9" fill="#6e6458" fontFamily="Inter, sans-serif">{labelA}</text>
        {hasB && <>
          <rect x={60} y={0} width={8} height={8} fill={colorB} rx={1} />
          <text x={72} y={7} fontSize="9" fill="#6e6458" fontFamily="Inter, sans-serif">{labelB}</text>
        </>}
      </g>

      {/* Y gridlines */}
      {[0, 25, 50, 75, 100].filter(v => v <= maxVal).map(tick => {
        const y = padTop + chartH - (tick / maxVal) * chartH;
        return (
          <g key={tick}>
            <line x1={padLeft} y1={y} x2={padLeft + chartW} y2={y} stroke="#e2ddd5" strokeWidth="1" strokeDasharray="3,3" />
            <text x={padLeft - 4} y={y} textAnchor="end" dominantBaseline="middle"
              fontSize="8" fill="#a89e90" fontFamily="Inter, sans-serif">{tick}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = padLeft + i * groupWidth + groupWidth / 2;
        const hA = (d.valueA / maxVal) * chartH;
        const hB = ((d.valueB ?? 0) / maxVal) * chartH;

        return (
          <g key={i}>
            {hasB && (
              <rect
                x={x - barWidth - 1}
                y={padTop + chartH - hA}
                width={barWidth}
                height={hA}
                fill={colorA}
                rx={3}
              />
            )}
            {!hasB && (
              <rect
                x={x - barWidth / 2}
                y={padTop + chartH - hA}
                width={barWidth}
                height={hA}
                fill={colorA}
                rx={3}
              />
            )}
            {hasB && (
              <rect
                x={x + 1}
                y={padTop + chartH - hB}
                width={barWidth}
                height={hB}
                fill={colorB}
                rx={3}
              />
            )}
            <text
              x={x} y={padTop + chartH + 8}
              textAnchor="middle" fontSize="8" fill="#8a8070" fontFamily="Inter, sans-serif"
            >
              {d.label.length > 6 ? d.label.slice(0, 6) + '…' : d.label}
            </text>
          </g>
        );
      })}

      {/* Axes */}
      <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="#d4c4b0" strokeWidth="1.5" />
      <line x1={padLeft} y1={padTop + chartH} x2={padLeft + chartW} y2={padTop + chartH} stroke="#d4c4b0" strokeWidth="1.5" />
    </svg>
  );
}
