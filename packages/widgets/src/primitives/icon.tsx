import { Icon as IconifyIcon, type IconProps as IconifyProps } from "@iconify/react";

import { cn } from "@/lib/utils";
import { useIconSet } from "@/lib/i18n";

export interface IconProps extends IconifyProps {
  /** Override the theme's default icon collection for a bare icon name. */
  set?: string;
}

/**
 * Icon — the universal icon component. Render ANY icon from ANY set indexed by
 * Iconify (browse them at https://icones.js.org): `lucide:*`, `mdi:*`,
 * `tabler:*`, `ph:*`, `pixelarticons:*`, and 150+ more — by string name, with
 * no per-icon imports.
 *
 *   <Icon icon="mdi:database" />            // fully-qualified, used as-is
 *   <Icon icon="home" />                    // bare name → resolved against the
 *                                           // theme's icon set (lucide by
 *                                           // default, pixelarticons for the
 *                                           // Web Reactiva theme)
 *
 * Sizes to 1em by default (inherits font-size); override with `size-*` or
 * width/height. For fully offline/SSR use, register icon data via
 * `@iconify/react`'s `addIcon` / `addCollection`.
 */
export function Icon({ icon, set, className, ...props }: IconProps) {
  const iconSet = useIconSet(set);
  const resolved =
    typeof icon === "string" && !icon.includes(":") ? `${iconSet}:${icon}` : icon;
  return (
    <IconifyIcon
      icon={resolved}
      className={cn("inline-block size-[1em] shrink-0", className)}
      {...props}
    />
  );
}

Icon.displayName = "Icon";
