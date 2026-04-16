interface CompassRoseProps {
  top?: number
}

export default function CompassRose({ top = 16 }: CompassRoseProps) {
  return (
    <div style={{
      position: 'absolute',
      top,
      right: 16,
      zIndex: 10,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.22))',
    }}>
      <svg
        width="84"
        height="84"
        viewBox="0 0 84 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="42" cy="42" r="41" fill="rgba(255,255,255,0.97)" stroke="rgba(0,0,0,0.1)" strokeWidth="1.5" />

        {/* Subtle inner ring */}
        <circle cx="42" cy="42" r="28" fill="none" stroke="#e8edf2" strokeWidth="1" />

        {/* Cardinal tick marks */}
        <line x1="42" y1="2"  x2="42" y2="14" stroke="#cbd5e1" strokeWidth="2"  strokeLinecap="round" />
        <line x1="42" y1="70" x2="42" y2="82" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2"  y1="42" x2="14" y2="42" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="70" y1="42" x2="82" y2="42" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

        {/* North arrow — blue filled triangle */}
        <polygon points="42,15 38,42 46,42" fill="#2563eb" />
        {/* South arrow — light gray filled triangle */}
        <polygon points="42,69 38,42 46,42" fill="#cbd5e1" />

        {/* Center hub */}
        <circle cx="42" cy="42" r="4.5" fill="#1e293b" stroke="white" strokeWidth="2" />

        {/* N label — blue, bold, largest */}
        <text
          x="42" y="13"
          textAnchor="middle"
          dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="14"
          fontWeight="800"
          fill="#2563eb"
          letterSpacing="-0.3"
        >N</text>

        {/* S label */}
        <text
          x="42" y="80"
          textAnchor="middle"
          dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
        >S</text>

        {/* E label */}
        <text
          x="80" y="46"
          textAnchor="middle"
          dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
        >E</text>

        {/* W label */}
        <text
          x="4" y="46"
          textAnchor="middle"
          dominantBaseline="auto"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="#94a3b8"
        >W</text>
      </svg>
    </div>
  )
}
