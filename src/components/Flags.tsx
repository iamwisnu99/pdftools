import React from 'react';

export function FlagID({ className, size = 20 }: { className?: string; size?: number }) {
  const height = Math.round((size * 14) / 20);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 20 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        borderRadius: '3px',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <rect width="20" height="7" fill="#dc2626" />
      <rect y="7" width="20" height="7" fill="#ffffff" />
    </svg>
  );
}

export function FlagEN({ className, size = 20 }: { className?: string; size?: number }) {
  const height = Math.round((size * 14) / 20);
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 60 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        borderRadius: '3px',
        boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.15)',
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
    >
      <clipPath id="uk-flag-clip">
        <rect width="60" height="42" rx="0" />
      </clipPath>
      <g clipPath="url(#uk-flag-clip)">
        <rect width="60" height="42" fill="#012169" />
        <path d="M0 0L60 42M60 0L0 42" stroke="#ffffff" strokeWidth="8" />
        <path d="M0 0L60 42M60 0L0 42" stroke="#dc2626" strokeWidth="4" />
        <path d="M30 0V42M0 21H60" stroke="#ffffff" strokeWidth="12" />
        <path d="M30 0V42M0 21H60" stroke="#dc2626" strokeWidth="7" />
      </g>
    </svg>
  );
}
