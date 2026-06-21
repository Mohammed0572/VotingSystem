type Props = { size?: number; className?: string; spin?: boolean };

export function Chakra({ size = 96, className = "", spin = false }: Props) {
  const spokes = Array.from({ length: 24 });
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${spin ? "ashoka-spin" : ""} ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="6" fill="currentColor" />
      {spokes.map((_, i) => (
        <line
          key={i}
          x1="50"
          y1="50"
          x2="50"
          y2="6"
          stroke="currentColor"
          strokeWidth="1.2"
          transform={`rotate(${(i * 360) / 24} 50 50)`}
        />
      ))}
    </svg>
  );
}
