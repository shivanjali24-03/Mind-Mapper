// The Mind Mapper logo mark, inline so it scales crisply and needs no extra request.
export default function Logo({ size = 32, title = 'Mind Mapper' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label={title}>
      <defs>
        <linearGradient id="mm-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="120" fill="url(#mm-logo-bg)" />
      <g fill="none" stroke="#fff" strokeWidth="26" strokeLinecap="round">
        <path d="M196 256 C 268 256 262 150 344 150" />
        <path d="M196 256 L 358 256" />
        <path d="M196 256 C 268 256 262 362 344 362" />
      </g>
      <circle cx="170" cy="256" r="66" fill="#fff" />
      <circle cx="170" cy="256" r="30" fill="#7c3aed" />
      <circle cx="362" cy="150" r="38" fill="#fff" />
      <circle cx="362" cy="150" r="17" fill="#ec4899" />
      <circle cx="380" cy="256" r="38" fill="#fff" />
      <circle cx="380" cy="256" r="17" fill="#f59e0b" />
      <circle cx="362" cy="362" r="38" fill="#fff" />
      <circle cx="362" cy="362" r="17" fill="#10b981" />
    </svg>
  );
}
