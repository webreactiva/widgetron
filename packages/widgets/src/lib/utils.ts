import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with clsx and resolve Tailwind conflicts with
 * tailwind-merge. The canonical shadcn `cn` helper — every widget uses it so
 * consumers can always override styling by passing `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
