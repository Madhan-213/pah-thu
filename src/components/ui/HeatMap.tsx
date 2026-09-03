// ============================================================
// HeatMap — 7×7 grid heat overlay
// ============================================================

interface HeatMapProps {
  cells: number[][]; // 7x7, values 0-100
  color?: string;
  size?: number;
  showLabels?: boolean;
}

export function HeatMap({ cells, color = '#e74c3c', size = 224, showLabels = true }: HeatMapProps) {
  const cellSize = size / 7;
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const rows = [7, 6, 5, 4, 3, 2, 1];

  function hexWithOpacity(baseColor: string, opacity: number): string {
    // Convert hex to rgb with opacity
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  }

  return (
    <svg width={size + (showLabels ? 20 : 0)} height={size + (showLabels ? 20 : 0)}>
      <g transform={showLabels ? 'translate(20,0)' : ''}>
        {/* Column labels */}
        {showLabels && cols.map((c, i) => (
          <text
            key={c}
            x={i * cellSize + cellSize / 2}
            y={size + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#8a8070"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {c}
          </text>
        ))}

        {/* Row labels */}
        {showLabels && rows.map((r, i) => (
          <text
            key={r}
            x={-6}
            y={i * cellSize + cellSize / 2 + 1}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="9"
            fill="#8a8070"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {r}
          </text>
        ))}

        {/* Grid cells */}
        {cells.map((row, ri) =>
          row.map((value, ci) => (
            <g key={`${ri}-${ci}`}>
              <rect
                x={ci * cellSize}
                y={ri * cellSize}
                width={cellSize - 1}
                height={cellSize - 1}
                rx={2}
                fill={hexWithOpacity(color, value / 100)}
                stroke="#e2ddd5"
                strokeWidth="0.5"
              />
              {value >= 50 && (
                <text
                  x={ci * cellSize + cellSize / 2}
                  y={ri * cellSize + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="7"
                  fill={value >= 75 ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)'}
                  fontFamily="Inter, sans-serif"
                >
                  {value}
                </text>
              )}
            </g>
          ))
        )}

        {/* Board border */}
        <rect
          x={0} y={0}
          width={size} height={size}
          fill="none"
          stroke="#d4c4b0"
          strokeWidth="1.5"
          rx={2}
        />
      </g>
    </svg>
  );
}
