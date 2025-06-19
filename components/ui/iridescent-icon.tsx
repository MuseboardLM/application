"use client";

import { useId, SVGProps, ComponentType } from "react";

/** Any Lucide React icon type */
type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface IridescentIconProps extends SVGProps<SVGSVGElement> {
  icon: LucideIcon;
}

/**
 * Wraps a Lucide icon in a reusable “Hologram-Noise” stroke gradient.
 * Usage: <IridescentIcon icon={Crop} className="h-6 w-6" />
 */
export default function IridescentIcon({
  icon: Icon,
  className = "",
  ...rest
}: IridescentIconProps) {
  const gradId = useId(); // guarantees a unique <defs> ID per instance

  return (
    <Icon
      {...rest}
      className={className}
      stroke={`url(#${gradId})`} /* replace currentColor */
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(88% 0.50 330)" />
          <stop offset="50%" stopColor="oklch(88% 0.50 270)" />
          <stop offset="100%" stopColor="oklch(88% 0.50 210)" />
        </linearGradient>
      </defs>
    </Icon>
  );
}
