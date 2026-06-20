import * as React from "react";

/**
 * Internal, dependency-free control icons (inline SVG). The library does NOT
 * depend on any icon package: these power the built-in widget chrome
 * (chevrons, check, play…). For CONTENT icons, consumers use the universal
 * `Icon` component (Iconify) and can pass any icon from any set as a ReactNode.
 *
 * Each icon inherits `currentColor` and is sized by `className` (e.g. `size-4`),
 * matching how lucide-style icons behave.
 */

export type IconProps = React.SVGProps<SVGSVGElement>;

function makeIcon(name: string, paths: React.ReactNode) {
  function IconComponent({ className, ...props }: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
        {...props}
      >
        {paths}
      </svg>
    );
  }
  IconComponent.displayName = name;
  return IconComponent;
}

export const Check = makeIcon("Check", <path d="M20 6 9 17l-5-5" />);

export const X = makeIcon(
  "X",
  <>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </>,
);

export const ChevronLeft = makeIcon("ChevronLeft", <path d="m15 18-6-6 6-6" />);

export const ChevronRight = makeIcon("ChevronRight", <path d="m9 18 6-6-6-6" />);

export const ArrowRight = makeIcon(
  "ArrowRight",
  <>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </>,
);

export const Play = makeIcon(
  "Play",
  <polygon points="6 3 20 12 6 21 6 3" />,
);

export const Pause = makeIcon(
  "Pause",
  <>
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </>,
);

export const RotateCcw = makeIcon(
  "RotateCcw",
  <>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </>,
);

export const Lightbulb = makeIcon(
  "Lightbulb",
  <>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
    <path d="M9 18h6" />
    <path d="M10 22h4" />
  </>,
);

export const Info = makeIcon(
  "Info",
  <>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </>,
);

export const Copy = makeIcon(
  "Copy",
  <>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </>,
);

export const AlertTriangle = makeIcon(
  "AlertTriangle",
  <>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </>,
);
