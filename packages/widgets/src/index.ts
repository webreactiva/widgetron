/* Widgetron — public entry point. */

// Shared utilities
export { cn } from "@/lib/utils";
export { evaluateFormula, formatValue, type NumberFormat } from "@/lib/formula";

// Internationalization (customizable + translatable copy)
export {
  WidgetronProvider,
  useWidgetronConfig,
  useLabels,
  useLocale,
  useIconSet,
  DEFAULT_ICON_SET,
  type WidgetronProviderProps,
  type WidgetronContextValue,
} from "@/lib/i18n";
export { esLabels } from "@/locales/es";

// Primitives (shadcn-compatible building blocks)
export * from "@/primitives";

// Widgets
export * from "@/widgets/quiz";
export * from "@/widgets/flashcards";
export * from "@/widgets/checklist";
export * from "@/widgets/callout-box";
export * from "@/widgets/step-cards";
export * from "@/widgets/pattern-card";
export * from "@/widgets/flow-diagram";
export * from "@/widgets/code-translation";
export * from "@/widgets/tangle-text";
export * from "@/widgets/frame-stepper";
export * from "@/widgets/terminal-sim";
export * from "@/widgets/section-header";
export * from "@/widgets/prose";
export * from "@/widgets/data-chart";
export * from "@/widgets/infographic";
export * from "@/widgets/mermaid-diagram";
export * from "@/widgets/scrubber";
export * from "@/widgets/spot-the-bug";
export * from "@/widgets/decision-tree";
export * from "@/widgets/compare-slider";
export * from "@/widgets/timeline";
export * from "@/widgets/fill-in-the-blanks";
export * from "@/widgets/predict-output";
export * from "@/widgets/drag-and-drop";
export * from "@/widgets/hotspots";
export * from "@/widgets/group-chat";

// Media embeds (audio with transcript karaoke, video)
export * from "@/widgets/audio-clip";
export * from "@/widgets/video-clip";

// AI-teaching artifacts (copy-ready prompt, profile personalization + gating)
export * from "@/widgets/prompt-template";
export * from "@/widgets/profile-quiz";

// Glossary (tooltip terms for the reading flow)
export * from "@/widgets/glossary";

// Compositions
export * from "@/widgets/scrollytelling";
export * from "@/widgets/storyline";

// JSON config layer (the AI-generation target): node format + registry + renderer
export {
  renderWidget,
  WidgetNodeView,
  widgetRegistry,
  widgetManifest,
  getWidgetManifestJSON,
  validateWidgetNode,
  validateWidgetTree,
  type WidgetNode,
  type WidgetManifestEntry,
  type WidgetManifestJSON,
  type ValidationResult,
} from "@/lib/registry";

// Widget metadata helpers (zod schemas + AI-oriented descriptions)
export {
  nodeSchema,
  content,
  optionalContent,
  type WidgetMeta,
} from "@/lib/widget-meta";
