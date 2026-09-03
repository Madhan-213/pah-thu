// ============================================================
// ProgressRing — Circular progress indicator
// ============================================================

interface ProgressRingProps {
  value: number;      // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 7,
  color = '#7d5230',
  trackColor = '#e8ddd0',
  label,
  sublabel,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {label !== undefined && (
          <div style={{ fontSize: size * 0.18, fontWeight: 700, color: '#3e2510', lineHeight: 1.1, fontFamily: 'Inter, sans-serif' }}>
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ fontSize: size * 0.13, color: '#8a8070', lineHeight: 1.2, fontFamily: 'Inter, sans-serif' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
