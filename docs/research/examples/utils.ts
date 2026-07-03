// SOURCE (verbatim, fetched 2026-06-20):
// https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/lib/utils.ts
//
// The cn() helper every shadcn component depends on.
//   clsx       -> builds a conditional class string from strings/objects/arrays
//   twMerge    -> resolves conflicting Tailwind classes so the LAST one wins
//                 (e.g. "px-2 px-4" -> "px-4"), letting caller className override defaults.
// Registry item type: registry:lib  |  npm deps: ["clsx", "tailwind-merge"]

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
