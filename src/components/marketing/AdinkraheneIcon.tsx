/**
 * AdinkraheneIcon — decorative Adinkrahene motif (concentric circles, no background rect).
 * Used as a watermark / decorative element throughout the marketing site.
 */

interface AdinkraheneIconProps {
  size?: number
  /** Primary ring color */
  ringColor?: string
  /** Gap color — should match the background it sits on */
  gapColor?: string
  className?: string
  opacity?: number
}

export function AdinkraheneIcon({
  size = 120,
  ringColor = '#D4AF5C',
  gapColor = '#0F1B33',
  className,
  opacity = 1,
}: AdinkraheneIconProps) {
  const half = size / 2
  // radii as fractions of size (outermost → center)
  const radii = [0.46, 0.36, 0.26, 0.16, 0.07].map((f) => f * size)
  // painter's algorithm: large ring (gold) → gap (bg color) → smaller ring (gold) → gap → center dot (gold)
  const fills = [ringColor, gapColor, ringColor, gapColor, ringColor]

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    >
      {radii.map((r, i) => (
        <circle key={i} cx={half} cy={half} r={r} fill={fills[i]} />
      ))}
    </svg>
  )
}

/**
 * AdinkraheneWatermark — large, very faint Adinkrahene for section backgrounds.
 */
export function AdinkraheneWatermark({
  size = 400,
  color = '#D4AF5C',
  bgColor = '#0F1B33',
  className,
}: {
  size?: number
  color?: string
  bgColor?: string
  className?: string
}) {
  return (
    <AdinkraheneIcon
      size={size}
      ringColor={color}
      gapColor={bgColor}
      opacity={0.06}
      className={className}
    />
  )
}
