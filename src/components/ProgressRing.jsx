// Small circular progress indicator, e.g. "2 of 3 tasks done" on a branch.
export default function ProgressRing({ done, total, size = 22 }) {
  const pct = total ? done / total : 0;
  const r = (size - 4) / 2;
  const c = 2 * Math.PI * r;
  const complete = done === total;
  return (
    <span className={`ring${complete ? ' is-complete' : ''}`} title={`${done} of ${total} tasks done`} aria-label={`${done} of ${total} tasks done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring__track" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring__value"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring__text">{Math.round(pct * 100)}%</span>
    </span>
  );
}
