interface Props {
  className?: string;
  size?: number;
}

export default function VaultLogo({ className = "", size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Glow behind door */}
      <defs>
        <radialGradient id="vaultGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="doorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Vault body */}
      <rect x="4" y="6" width="40" height="34" rx="4" fill="url(#doorGrad)" stroke="currentColor" strokeWidth="2.5" />

      {/* Gold glow from inside (door ajar effect) */}
      <ellipse cx="24" cy="23" rx="12" ry="12" fill="url(#vaultGlow)" />

      {/* V letter integrated into dial */}
      <circle cx="24" cy="23" r="12" stroke="currentColor" strokeWidth="2" />
      <circle cx="24" cy="23" r="8.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />

      {/* V shape inside dial */}
      <path d="M18 16 L24 30 L30 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Dial tick marks */}
      <line x1="24" y1="11" x2="24" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="36" y1="23" x2="33" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24" y1="35" x2="24" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="23" x2="15" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />

      {/* Small dot at center */}
      <circle cx="24" cy="23" r="2" fill="currentColor" />

      {/* Handle bar right */}
      <rect x="38" y="17" width="3" height="12" rx="1.5" fill="currentColor" opacity="0.7" />

      {/* Hinges left */}
      <rect x="4" y="13" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="4" y="29" width="2" height="4" rx="1" fill="currentColor" opacity="0.4" />

      {/* Legs */}
      <rect x="9" y="40" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.4" />
      <rect x="33" y="40" width="6" height="4" rx="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
