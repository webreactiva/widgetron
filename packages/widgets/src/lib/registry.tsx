import * as React from "react";
import { z } from "zod";

import type { WidgetMeta } from "@/lib/widget-meta";
import { Icon } from "@/primitives/icon";
import { quizMeta } from "@/widgets/quiz/quiz.meta";
import { calloutBoxMeta } from "@/widgets/callout-box/callout-box.meta";
import { surpriseMeta } from "@/widgets/surprise/surprise.meta";
import { quoteMeta } from "@/widgets/quote/quote.meta";
import { ctaMeta } from "@/widgets/cta/cta.meta";
import { promptTemplateMeta } from "@/widgets/prompt-template/prompt-template.meta";
import { storylineMeta } from "@/widgets/storyline/storyline.meta";
import { flashcardsMeta } from "@/widgets/flashcards/flashcards.meta";
import { checklistMeta } from "@/widgets/checklist/checklist.meta";
import { spotTheBugMeta } from "@/widgets/spot-the-bug/spot-the-bug.meta";
import { decisionTreeMeta } from "@/widgets/decision-tree/decision-tree.meta";
import { fillInTheBlanksMeta } from "@/widgets/fill-in-the-blanks/fill-in-the-blanks.meta";
import { predictOutputMeta } from "@/widgets/predict-output/predict-output.meta";
import { dragAndDropMeta } from "@/widgets/drag-and-drop/drag-and-drop.meta";
import { tangleTextMeta } from "@/widgets/tangle-text/tangle-text.meta";
import { scrubberMeta } from "@/widgets/scrubber/scrubber.meta";
import { frameStepperMeta } from "@/widgets/frame-stepper/frame-stepper.meta";
import { terminalSimMeta } from "@/widgets/terminal-sim/terminal-sim.meta";
import { groupChatMeta } from "@/widgets/group-chat/group-chat.meta";
import { flowDiagramMeta } from "@/widgets/flow-diagram/flow-diagram.meta";
import { dataChartMeta } from "@/widgets/data-chart/data-chart.meta";
import { infographicMeta } from "@/widgets/infographic/infographic.meta";
import { mermaidDiagramMeta } from "@/widgets/mermaid-diagram/mermaid-diagram.meta";
import { compareSliderMeta } from "@/widgets/compare-slider/compare-slider.meta";
import { hotspotsMeta } from "@/widgets/hotspots/hotspots.meta";
import { sectionHeaderMeta } from "@/widgets/section-header/section-header.meta";
import { proseMeta } from "@/widgets/prose/prose.meta";
import { stepCardsMeta } from "@/widgets/step-cards/step-cards.meta";
import { patternCardMeta } from "@/widgets/pattern-card/pattern-card.meta";
import { codeTranslationMeta } from "@/widgets/code-translation/code-translation.meta";
import { timelineMeta } from "@/widgets/timeline/timeline.meta";
import { audioClipMeta } from "@/widgets/audio-clip/audio-clip.meta";
import { videoClipMeta } from "@/widgets/video-clip/video-clip.meta";
import { glossaryTermMeta } from "@/widgets/glossary/glossary-term.meta";
import { glossaryTextMeta } from "@/widgets/glossary/glossary-text.meta";
import { profileQuizMeta } from "@/widgets/profile-quiz/profile-quiz.meta";
import { profileGateMeta } from "@/widgets/profile-quiz/profile-gate.meta";
import { profileProviderMeta } from "@/widgets/profile-quiz/profile-provider.meta";
import { iconMeta } from "@/primitives/icon.meta";
import { scrollytellingMeta } from "@/widgets/scrollytelling/scrollytelling.meta";
import { Quiz } from "@/widgets/quiz";
import { Flashcards } from "@/widgets/flashcards";
import { Checklist } from "@/widgets/checklist";
import { CalloutBox } from "@/widgets/callout-box";
import { Surprise } from "@/widgets/surprise";
import { Quote } from "@/widgets/quote";
import { Cta } from "@/widgets/cta";
import { StepCards } from "@/widgets/step-cards";
import { PatternCard } from "@/widgets/pattern-card";
import { FlowDiagram } from "@/widgets/flow-diagram";
import { CodeTranslation } from "@/widgets/code-translation";
import { TangleText } from "@/widgets/tangle-text";
import { FrameStepper } from "@/widgets/frame-stepper";
import { TerminalSim } from "@/widgets/terminal-sim";
import { SectionHeader } from "@/widgets/section-header";
import { Prose } from "@/widgets/prose";
import { DataChart } from "@/widgets/data-chart";
import { Infographic } from "@/widgets/infographic";
import { MermaidDiagram } from "@/widgets/mermaid-diagram";
import { Scrubber } from "@/widgets/scrubber";
import { SpotTheBug } from "@/widgets/spot-the-bug";
import { DecisionTree } from "@/widgets/decision-tree";
import { CompareSlider } from "@/widgets/compare-slider";
import { Timeline } from "@/widgets/timeline";
import { FillInTheBlanks } from "@/widgets/fill-in-the-blanks";
import { PredictOutput } from "@/widgets/predict-output";
import { DragAndDrop } from "@/widgets/drag-and-drop";
import { Hotspots } from "@/widgets/hotspots";
import { GroupChat } from "@/widgets/group-chat";
import { AudioClip } from "@/widgets/audio-clip";
import { VideoClip } from "@/widgets/video-clip";
import { PromptTemplate } from "@/widgets/prompt-template";
import {
  ProfileProvider,
  ProfileQuiz,
  ProfileGate,
} from "@/widgets/profile-quiz";
import { Scrollytelling } from "@/widgets/scrollytelling";
import { Storyline } from "@/widgets/storyline";
import { GlossaryTerm, GlossaryText } from "@/widgets/glossary";

/**
 * JSON config layer — the AI-generation target.
 *
 * A widget is described by a serializable node:
 *
 *   { "type": "quiz", "version": 1, "props": { ...JSON props } }
 *
 * `renderWidget(node)` resolves the type in the registry, migrates older
 * versions, adapts JSON-only props (icon names → <Icon>, nested nodes →
 * rendered widgets), and renders the React component. Because most widget props
 * are plain data and strings (a string IS a ReactNode), the JSON shape mirrors
 * the TypeScript props of each widget almost exactly — which is what makes the
 * whole library easy to author by hand or generate with an LLM.
 *
 * Versioning: every node carries (or defaults to) a `version`. When the
 * registry's current version is newer, the entry's `migrate` upgrades the props
 * before rendering, so old AI-generated JSON keeps working.
 */
export interface WidgetNode {
  type: string;
  /** Schema version of this node. Omitted = the registry's current version. */
  version?: number;
  props?: Record<string, unknown>;
}

type Props = Record<string, unknown>;

interface RegistryEntry extends Partial<WidgetMeta> {
  /** Current schema version for this widget. */
  version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  /** JSON props → component props (icons, nested nodes). Default: identity. */
  adapt?: (props: Props) => Props;
  /** Upgrade props authored for an older version to the current one. */
  migrate?: (props: Props, from: number) => Props;
}

/** Is this value a widget node (vs. a plain object / React element)? */
function isNode(value: unknown): value is WidgetNode {
  return (
    typeof value === "object" &&
    value !== null &&
    !React.isValidElement(value) &&
    typeof (value as { type?: unknown }).type === "string"
  );
}

/** Render nested widget nodes; pass anything else through unchanged. */
function asContent(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(asContent);
  if (isNode(value)) return renderWidget(value);
  return value;
}

/** Wrap an icon-name string in <Icon> (theme-aware); pass nodes through. */
function asIcon(value: unknown): unknown {
  return typeof value === "string" ? <Icon icon={value} /> : value;
}

/** Map an array prop, converting each item's icon-name field to <Icon>. */
function adaptIconList(field: string) {
  return (props: Props): Props => {
    const list = props[field];
    if (!Array.isArray(list)) return props;
    return {
      ...props,
      [field]: list.map((item) =>
        item && typeof item === "object" && "icon" in item
          ? { ...item, icon: asIcon((item as { icon: unknown }).icon) }
          : item,
      ),
    };
  };
}

export const widgetRegistry: Record<string, RegistryEntry> = {
  quiz: { ...quizMeta, component: Quiz },
  flashcards: { ...flashcardsMeta, component: Flashcards },
  checklist: { ...checklistMeta, component: Checklist },
  "callout-box": { ...calloutBoxMeta, component: CalloutBox },
  surprise: {
    ...surpriseMeta,
    component: Surprise,
    adapt: (p) => ({
      ...p,
      content: asContent(p.content),
      teaser: asContent(p.teaser),
    }),
  },
  quote: {
    ...quoteMeta,
    component: Quote,
    adapt: (p) => ({ ...p, children: asContent(p.children) }),
  },
  cta: {
    ...ctaMeta,
    component: Cta,
    adapt: (p) => ({
      ...p,
      title: asContent(p.title),
      description: asContent(p.description),
    }),
  },
  "step-cards": { ...stepCardsMeta, component: StepCards },
  "pattern-card": {
    ...patternCardMeta,
    component: PatternCard,
    adapt: adaptIconList("cards"),
  },
  "flow-diagram": { ...flowDiagramMeta, component: FlowDiagram },
  "code-translation": { ...codeTranslationMeta, component: CodeTranslation },
  "tangle-text": { ...tangleTextMeta, component: TangleText },
  "frame-stepper": {
    ...frameStepperMeta,
    component: FrameStepper,
    adapt: adaptIconList("boxes"),
  },
  "terminal-sim": { ...terminalSimMeta, component: TerminalSim },
  "section-header": { ...sectionHeaderMeta, component: SectionHeader },
  prose: { ...proseMeta, component: Prose },
  "data-chart": { ...dataChartMeta, component: DataChart },
  infographic: { ...infographicMeta, component: Infographic },
  "mermaid-diagram": { ...mermaidDiagramMeta, component: MermaidDiagram },
  scrubber: { ...scrubberMeta, component: Scrubber },
  "spot-the-bug": { ...spotTheBugMeta, component: SpotTheBug },
  "decision-tree": { ...decisionTreeMeta, component: DecisionTree },
  "compare-slider": {
    ...compareSliderMeta,
    component: CompareSlider,
    adapt: (p) => ({ ...p, before: asContent(p.before), after: asContent(p.after) }),
  },
  timeline: { ...timelineMeta, component: Timeline },
  "fill-in-the-blanks": { ...fillInTheBlanksMeta, component: FillInTheBlanks },
  "predict-output": { ...predictOutputMeta, component: PredictOutput },
  "drag-and-drop": { ...dragAndDropMeta, component: DragAndDrop },
  hotspots: {
    ...hotspotsMeta,
    component: Hotspots,
    adapt: (p) => ({ ...p, children: asContent(p.children) }),
  },
  "group-chat": { ...groupChatMeta, component: GroupChat },
  "audio-clip": { ...audioClipMeta, component: AudioClip },
  "video-clip": { ...videoClipMeta, component: VideoClip },
  "prompt-template": { ...promptTemplateMeta, component: PromptTemplate },
  "profile-quiz": { ...profileQuizMeta, component: ProfileQuiz },
  "profile-provider": {
    ...profileProviderMeta,
    component: ProfileProvider,
    adapt: (p) => ({ ...p, children: asContent(p.children) }),
  },
  "profile-gate": {
    ...profileGateMeta,
    component: ProfileGate,
    adapt: (p) => ({
      ...p,
      children: asContent(p.children),
      fallback: asContent(p.fallback),
    }),
  },
  "glossary-term": { ...glossaryTermMeta, component: GlossaryTerm },
  "glossary-text": { ...glossaryTextMeta, component: GlossaryText },
  icon: { ...iconMeta, component: Icon },
  scrollytelling: {
    ...scrollytellingMeta,
    component: Scrollytelling,
    adapt: (p) => ({
      ...p,
      sticky: asContent(p.sticky),
      steps: Array.isArray(p.steps)
        ? p.steps.map((s) =>
            s && typeof s === "object"
              ? {
                  ...s,
                  content: asContent((s as { content?: unknown }).content),
                  sticky: asContent((s as { sticky?: unknown }).sticky),
                }
              : s,
          )
        : p.steps,
    }),
  },
  storyline: {
    ...storylineMeta,
    component: Storyline,
    adapt: (p) => ({
      ...p,
      modules: Array.isArray(p.modules)
        ? p.modules.map((m) =>
            m && typeof m === "object"
              ? {
                  ...m,
                  title: asContent((m as { title?: unknown }).title),
                  subtitle: asContent((m as { subtitle?: unknown }).subtitle),
                  screens: asContent((m as { screens?: unknown }).screens),
                }
              : m,
          )
        : p.modules,
    }),
  },
};

/** Render a widget node to a React element. Unknown types render nothing. */
export function renderWidget(
  node: WidgetNode,
  key?: React.Key,
): React.ReactElement | null {
  const entry = widgetRegistry[node.type];
  if (!entry) {
    if (typeof console !== "undefined") {
      console.warn(`[widgetron] Unknown widget type: "${node.type}"`);
    }
    return null;
  }
  let props: Props = { ...(node.props ?? {}) };
  const from = node.version ?? entry.version;
  if (from < entry.version && entry.migrate) props = entry.migrate(props, from);
  if (entry.adapt) props = entry.adapt(props);
  const Component = entry.component;
  return <Component key={key} {...props} />;
}

/** Convenience component: render a node (or a list of nodes) declaratively. */
export function WidgetNodeView({
  node,
}: {
  node: WidgetNode | WidgetNode[];
}): React.ReactElement | null {
  if (Array.isArray(node)) {
    return <>{node.map((n, i) => renderWidget(n, i))}</>;
  }
  return renderWidget(node);
}

/* -------------------------------------------------------------------------- */
/* AI / MCP surface                                                           */
/* -------------------------------------------------------------------------- */

/** One enriched manifest record (the zod schema kept as a runtime object). */
export interface WidgetManifestEntry {
  type: string;
  version: number;
  category?: string;
  summary?: string;
  /** AI-oriented: WHEN to reach for this widget. */
  whenToUse?: string;
  schema?: z.ZodType;
  example?: WidgetNode;
}

/**
 * Enriched manifest: every registered type with the metadata an agent needs to
 * decide WHEN to use a widget and HOW to author it. This is the surface an MCP
 * server would expose (use `getWidgetManifestJSON()` for a serializable form).
 */
export const widgetManifest: WidgetManifestEntry[] = Object.entries(
  widgetRegistry,
).map(([type, entry]) => ({
  type,
  version: entry.version,
  category: entry.category,
  summary: entry.summary,
  whenToUse: entry.whenToUse,
  schema: entry.schema,
  example: entry.example,
}));

/** A fully serializable manifest (zod → JSON Schema) for an MCP / tool layer. */
export interface WidgetManifestJSON {
  type: string;
  version: number;
  category?: string;
  summary?: string;
  whenToUse?: string;
  /** JSON Schema of the widget's props. */
  schema?: unknown;
  example?: WidgetNode;
}

/** Serialize the manifest: zod schemas become JSON Schema. */
export function getWidgetManifestJSON(): WidgetManifestJSON[] {
  return widgetManifest.map((m) => ({
    type: m.type,
    version: m.version,
    category: m.category,
    summary: m.summary,
    whenToUse: m.whenToUse,
    schema: m.schema ? z.toJSONSchema(m.schema, { io: "input" }) : undefined,
    example: m.example,
  }));
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a node's props against its registered zod schema — the feedback an
 * agent needs to self-correct generated JSON. Unknown types and (when a schema
 * exists) malformed props are reported; types without a schema pass leniently.
 */
export function validateWidgetNode(node: WidgetNode): ValidationResult {
  const entry = widgetRegistry[node.type];
  if (!entry) {
    return { valid: false, errors: [`Unknown widget type: "${node.type}"`] };
  }
  if (!entry.schema) return { valid: true, errors: [] };
  const result = entry.schema.safeParse(node.props ?? {});
  if (result.success) return { valid: true, errors: [] };
  return {
    valid: false,
    errors: result.error.issues.map((i) => {
      const path = i.path.length ? `${i.path.join(".")}: ` : "";
      return `${path}${i.message}`;
    }),
  };
}

/**
 * Recursively validate a node and any nested widget nodes it contains (e.g. a
 * storyline's screens). Returns every error found, prefixed by its type path.
 */
export function validateWidgetTree(
  node: WidgetNode,
  path = node.type,
): ValidationResult {
  const errors = validateWidgetNode(node).errors.map((e) => `${path} → ${e}`);
  const visit = (value: unknown, childPath: string) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${childPath}[${i}]`));
    } else if (isNode(value)) {
      errors.push(
        ...validateWidgetTree(value, `${childPath}.${value.type}`).errors,
      );
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) visit(v, `${childPath}.${k}`);
    }
  };
  for (const [k, v] of Object.entries(node.props ?? {})) {
    visit(v, `${path}.${k}`);
  }
  return { valid: errors.length === 0, errors };
}
