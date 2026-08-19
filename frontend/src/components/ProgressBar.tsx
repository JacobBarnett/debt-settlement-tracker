interface ProgressBarProps {
  percentage: number;
  compact?: boolean;
}

export function ProgressBar({ percentage, compact = false }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percentage));

  return (
    <div className={compact ? "progress progress--compact" : "progress"}>
      <div className="progress__track">
        <div
          className="progress__fill"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="progress__label">{clamped.toFixed(1)}%</span>
    </div>
  );
}
