/**
 * Node-safe engine surface: everything here runs in the Vite dev-server
 * plugin, the CLI and the browser alike — no widgetron (React) imports.
 * Full tree validation, which needs the widget registry, is in ./validate.
 */
export {
  storyDocumentSchema,
  ctaSettingsSchema,
  surprisesSettingsSchema,
  nodeSchema,
  validateEnvelope,
  type StoryDocument,
  type CtaSettings,
  type WidgetNode,
  type EnvelopeValidation,
} from "./schema";
export { resolveStory } from "./resolve";
export { parseSrt, parseTimestamp, cutRange, applyFixes, type Cue } from "./srt";
export {
  parseDesign,
  compileTheme,
  compileDesignMarkdown,
  KNOWN_TOKENS,
  type ThemeDesign,
  type CompiledTheme,
} from "./theme";
