import type { ReactNode } from "react";
import {
  AudioClip,
  CalloutBox,
  Checklist,
  CodeTranslation,
  CompareSlider,
  Cta,
  DataChart,
  DecisionTree,
  DragAndDrop,
  Figure,
  FillInTheBlanks,
  Flashcards,
  FlowDiagram,
  FrameStepper,
  GlossaryProvider,
  GlossaryTerm,
  GlossaryText,
  GroupChat,
  Hotspots,
  Icon,
  Infographic,
  MermaidDiagram,
  PatternCard,
  PredictOutput,
  ProfileCard,
  ProfileGate,
  ProfileProvider,
  ProfileQuiz,
  PromptTemplate,
  Prose,
  Quiz,
  Quote,
  renderWidget,
  ResourceList,
  Scrubber,
  SectionHeader,
  SpotTheBug,
  StepCards,
  Surprise,
  KeywordGate,
  TangleText,
  TerminalSim,
  Timeline,
  useLocale,
  VideoClip,
  type WidgetNode,
} from "@webreactiva/widgetron";

// A scrollytelling composition authored entirely as JSON — exactly what an LLM
// would generate. renderWidget() turns it into the live composition, which
// orchestrates section-header + flow-diagram + callout-box widgets per step.
const requestScrolly: WidgetNode = {
  type: "scrollytelling",
  version: 1,
  props: {
    steps: [
      {
        content: {
          type: "section-header",
          props: {
            eyebrow: "Step 1",
            title: "You hit Enter",
            description:
              "The browser turns the URL into an HTTP request and sends it across the network.",
          },
        },
        sticky: {
          type: "flow-diagram",
          props: {
            nodes: [
              { label: "Browser", active: true },
              { label: "Server" },
              { label: "Database" },
            ],
          },
        },
      },
      {
        content: {
          type: "section-header",
          props: {
            eyebrow: "Step 2",
            title: "The server takes over",
            description:
              "It routes the request, runs the business logic, and decides what data it needs.",
          },
        },
        sticky: {
          type: "flow-diagram",
          props: {
            nodes: [
              { label: "Browser" },
              { label: "Server", active: true },
              { label: "Database" },
            ],
          },
        },
      },
      {
        content: {
          type: "section-header",
          props: {
            eyebrow: "Step 3",
            title: "The database answers",
            description: "A query runs and the matching rows travel back to the server.",
          },
        },
        sticky: {
          type: "flow-diagram",
          props: {
            nodes: [
              { label: "Browser" },
              { label: "Server" },
              { label: "Database", active: true },
            ],
          },
        },
      },
      {
        content: {
          type: "callout-box",
          props: {
            variant: "aha",
            children:
              "Every page load is this same round trip — request out, response back. Once you see it, the web stops being magic.",
          },
        },
        sticky: {
          type: "flow-diagram",
          props: {
            nodes: [
              { label: "Browser", active: true },
              { label: "Server" },
              { label: "Database" },
            ],
          },
        },
      },
    ],
  },
};

// A Surprise authored as JSON, wrapping a prompt-template node — proof that the
// reveal payload is any widget node, resolved by renderWidget()'s `adapt`.
const surpriseReveal: WidgetNode = {
  type: "surprise",
  version: 1,
  props: {
    teaser: "You reached the end. Here's a prompt to take with you.",
    content: {
      type: "prompt-template",
      props: {
        template:
          "Act as a patient tutor for {{topic}}.\n" +
          "Explain it to me as if I'm {{level}}, using one concrete example.\n" +
          "Then quiz me with a single question.",
        note: "Copy it, paste it into your AI.",
      },
    },
    // Variable reward: the reveal picks ONE of content + variants at random.
    variants: [
      {
        type: "quote",
        props: {
          children: "The best way to predict the future is to invent it.",
          attribution: "Alan Kay",
        },
      },
    ],
  },
};

export interface CatalogEntry {
  id: string;
  name: string;
  summary: string;
  demos: { label: string; node: ReactNode }[];
}

/** Sidebar grouping (order matters). */
export const categories: { title: string; ids: string[] }[] = [
  {
    title: "Text & layout",
    ids: [
      "section-header",
      "prose",
      "glossary-text",
      "glossary-term",
      "callout-box",
      "quote",
      "step-cards",
      "profile-card",
      "timeline",
      "pattern-card",
      "code-translation",
      "resource-list",
    ],
  },
  {
    title: "Interactive",
    ids: [
      "quiz",
      "flashcards",
      "checklist",
      "spot-the-bug",
      "decision-tree",
      "fill-in-the-blanks",
      "predict-output",
      "drag-and-drop",
      "surprise",
      "keyword-gate",
    ],
  },
  {
    title: "Reactive",
    ids: [
      "tangle-text",
      "scrubber",
      "frame-stepper",
      "terminal-sim",
      "group-chat",
    ],
  },
  {
    title: "Diagrams & data",
    ids: [
      "flow-diagram",
      "data-chart",
      "infographic",
      "mermaid-diagram",
      "compare-slider",
      "hotspots",
    ],
  },
  { title: "Media", ids: ["audio-clip", "video-clip", "figure"] },
  {
    title: "AI & personalization",
    ids: ["prompt-template", "profile-quiz", "profile-provider", "profile-gate"],
  },
  { title: "Conversion", ids: ["cta"] },
  { title: "Foundations", ids: ["icon"] },
  { title: "Compositions", ids: ["storyline", "scrollytelling"] },
];

// A mini-dispensa authored as JSON — the dispensa reading flow (Storyline)
// assembling section headers, glossary text, a diagram, a callout and a quiz.
const courseStoryline: WidgetNode = {
  type: "storyline",
  version: 1,
  props: {
    glossary: {
      "explorable explanation":
        "A document you learn from by manipulating it and seeing the consequences (Bret Victor).",
      spec: "A written description of intent — what to build and why — before any code.",
      SDD: "Spec-Driven Development: write the spec first, then let it drive the code.",
      "vibe coding":
        "Coding by feel — describe what you want and let the AI improvise the details.",
    },
    modules: [
      {
        title: "A walk you can touch",
        subtitle: "How this dispensa works.",
        emoji: "🧭",
        outro: "You know the rules of the walk — next, the machinery under it.",
        screens: [
          { type: "section-header", props: { icon: "book", eyebrow: "Start here", title: "The tour begins" } },
          {
            type: "glossary-text",
            props: {
              text: "This dispensa blends a linear walkthrough with [[explorable explanation]] widgets. By the end you'll know when to write a [[spec]] and when to lean on [[vibe coding]].",
            },
          },
          {
            type: "callout-box",
            props: {
              variant: "aha",
              children:
                "Touching is allowed — click the diagrams and answer before you peek.",
            },
          },
        ],
      },
      {
        title: "The round trip",
        subtitle: "What happens between Enter and the page.",
        emoji: "🌐",
        outro: "You can follow a request end to end — time to prove it.",
        screens: [
          {
            type: "flow-diagram",
            props: {
              nodes: [
                { label: "Browser", active: true },
                { label: "Server" },
                { label: "Database" },
              ],
            },
          },
          {
            type: "glossary-text",
            props: {
              text: "Same as code: an [[SDD]] flow writes the intention down before generating a single line.",
            },
          },
        ],
      },
      {
        title: "Check yourself",
        subtitle: "One question before you go.",
        emoji: "🏆",
        screens: [
          {
            type: "quiz",
            props: {
              question: "An 8-second page load most likely comes from…",
              options: [
                { text: "Complex CSS", feedback: "Rarely seconds." },
                { text: "Slow backend / queries", correct: true, feedback: "Exactly — backend bottlenecks." },
                { text: "A slow framework", feedback: "Not by itself." },
              ],
            },
          },
        ],
      },
    ],
  },
};

// A locale-aware demo. The library ships aseptic and English-first; the Spanish
// copy is an opt-in override keyed off the active locale — toggle the playground
// language and the glossary content (both the terms and the prose) translates.
// The point is that the text lives outside the component, not baked into it.
function GlossaryTextDemo() {
  const es = (useLocale() ?? "").startsWith("es");
  const terms = es
    ? {
        guion:
          "El plan escrito de lo que vas a construir, antes de tocar el código.",
        spec: "Una descripción de la intención: qué construir y por qué.",
        "vibe coding":
          "Programar a ojo: describes lo que quieres y dejas que la IA improvise los detalles.",
      }
    : {
        script: "The written plan of what you'll build, before touching code.",
        spec: "A description of intent: what to build and why.",
        "vibe coding":
          "Coding by feel: you describe what you want and let the AI improvise the details.",
      };
  const text = es
    ? "Antes de rodar se escribe el [[guion]]. En código, ese guion es una [[spec]]: deja la intención por escrito antes de generar nada. Lo contrario es el [[vibe coding]]."
    : "Before the shoot, you write the [[script]]. In code, that script is a [[spec]]: put the intent in writing before generating anything. The opposite is [[vibe coding]].";
  return (
    <GlossaryProvider terms={terms}>
      <GlossaryText text={text} />
    </GlossaryProvider>
  );
}

// ProfileQuiz is a personalization SYSTEM (provider + quiz + gates), so the demo
// composes them: answering the quiz writes a profile that the gates below read,
// and the tailored callouts appear. Untagged content would always show.
// Minimal profile family, in-memory (no storageKey): the provider is the
// context boundary; the gate shows its fallback until the quiz writes a match.
function ProfileFamilyDemo({ withFallback }: { withFallback?: boolean }) {
  return (
    <ProfileProvider>
      <div className="flex flex-col gap-4">
        <ProfileQuiz
          intro="One question — the block below reacts. In-memory only: reload and it forgets."
          questions={[
            {
              id: "role",
              question: "What describes you best?",
              options: [
                { value: "backend", label: "Backend" },
                { value: "frontend", label: "Frontend" },
              ],
            },
          ]}
        />
        <ProfileGate
          when={{ role: ["backend"] }}
          fallback={
            withFallback ? (
              <CalloutBox variant="info">
                <strong>Fallback content.</strong> Shown until the profile
                matches — answer "Backend" above to swap me out.
              </CalloutBox>
            ) : undefined
          }
        >
          <CalloutBox variant="aha">
            <strong>Backend track.</strong> This block only exists for backend
            people — the gate read the profile the quiz just wrote.
          </CalloutBox>
        </ProfileGate>
      </div>
    </ProfileProvider>
  );
}

function ProfileQuizDemo() {
  return (
    <ProfileProvider storageKey="widgetron-demo-profile">
      <div className="flex flex-col gap-4">
        <ProfileQuiz
          intro="Answer a couple of questions and the content below adapts to you."
          questions={[
            {
              id: "level",
              question: "How comfortable are you with code?",
              options: [
                { value: "beginner", label: "New to it", description: "I mostly use no-code / AI tools." },
                { value: "some", label: "Some experience", description: "I can read and tweak code." },
                { value: "pro", label: "I write code daily", description: "Give me the deep end." },
              ],
            },
            {
              id: "goal",
              question: "What do you want most?",
              options: [
                { value: "ship", label: "Ship a product" },
                { value: "learn", label: "Understand the fundamentals" },
                { value: "automate", label: "Automate my work" },
              ],
            },
          ]}
        />
        <ProfileGate when={{ level: ["beginner"] }}>
          <CalloutBox variant="info">
            <strong>Start with prompts, not syntax.</strong> We'll lean on AI to
            write the code while you steer the intent.
          </CalloutBox>
        </ProfileGate>
        <ProfileGate when={{ level: ["some"] }}>
          <CalloutBox variant="info">
            <strong>You'll pair with the AI.</strong> Expect to read generated
            code and correct it — the sweet spot.
          </CalloutBox>
        </ProfileGate>
        <ProfileGate when={{ level: ["pro"] }}>
          <CalloutBox variant="aha">
            <strong>Skipping the basics.</strong> Straight to architecture,
            evals, and agent orchestration.
          </CalloutBox>
        </ProfileGate>
        <ProfileGate when={{ goal: ["automate"] }}>
          <CalloutBox variant="warning">
            <strong>Automation track unlocked.</strong> We'll wire tools and
            agents to your existing workflow.
          </CalloutBox>
        </ProfileGate>
      </div>
    </ProfileProvider>
  );
}

export const catalog: CatalogEntry[] = [
  {
    id: "section-header",
    name: "SectionHeader",
    summary:
      "A section cabecera: optional eyebrow, a larger display title, and optional description / body text. All copy via props (translatable).",
    demos: [
      {
        label: "With eyebrow + description",
        node: (
          <SectionHeader
            icon="server"
            eyebrow="Module 02"
            title="How a request travels"
            description="From the browser to the database and back — the round trip every web app makes, step by step."
          />
        ),
      },
    ],
  },
  {
    id: "prose",
    name: "Prose",
    summary:
      "A static typographic container for free-form titles and descriptions (headings, paragraphs, lists, code, links). Pass children or trusted HTML.",
    demos: [
      {
        label: "Rich text",
        node: (
          <Prose>
            <h2>Why chunking?</h2>
            <p>
              When an API caps the request size, you split the input into{" "}
              <code>chunks</code>, process each independently, and merge the
              results. It keeps you within the limit without losing content.
            </p>
            <ul>
              <li>Each piece is processed on its own</li>
              <li>Results are combined at the end</li>
            </ul>
          </Prose>
        ),
      },
    ],
  },
  {
    id: "icon",
    name: "Icon (universal)",
    summary:
      "One component, any icon set indexed by Iconify (browse at icones.js.org): lucide, mdi, tabler, phosphor, simple-icons… by string name. Bare names resolve against the theme's icon set — toggle to Web Reactiva to see them switch to pixelarticons.",
    demos: [
      {
        label: "Theme icon set — bare names (toggle the theme)",
        node: (
          <div className="flex flex-wrap items-center gap-6 text-4xl text-primary">
            <Icon icon="home" />
            <Icon icon="server" />
            <Icon icon="database" />
            <Icon icon="code" />
            <Icon icon="lock" />
          </div>
        ),
      },
      {
        label: "Fully-qualified names from five different sets",
        node: (
          <div className="flex flex-wrap items-center gap-6 text-4xl text-primary">
            <Icon icon="lucide:rocket" />
            <Icon icon="mdi:database" />
            <Icon icon="tabler:brand-github" />
            <Icon icon="ph:lightbulb-duotone" />
            <Icon icon="simple-icons:react" />
          </div>
        ),
      },
    ],
  },
  {
    id: "quiz",
    name: "Quiz",
    summary:
      "Single-question, application-style assessment with instant per-option feedback and an optional celebration.",
    demos: [
      {
        label: "Multiple choice",
        node: (
          <Quiz
            question="A user reports the site takes 8 seconds to load. Where do you start investigating?"
            options={[
              {
                text: "Check whether the CSS is too complex",
                feedback:
                  "CSS rarely causes seconds-long load times. Think about what travels over the network and what is slow to respond.",
              },
              {
                text: "Inspect external API calls and database queries",
                correct: true,
                feedback:
                  "Exactly — 8 seconds almost always points to a backend bottleneck: slow third-party APIs, unindexed queries, or cascading requests.",
              },
              {
                text: "Switch to a faster framework",
                feedback:
                  "Changing frameworks doesn't fix network or backend problems.",
              },
            ]}
          />
        ),
      },
      {
        label: "Scenario",
        node: (
          <Quiz
            scenario="Your app processes 3-hour podcast transcripts. The AI API caps requests at 16,000 tokens. Users complain long podcasts only get partial summaries."
            question="How would you solve this?"
            options={[
              {
                text: "Ask the API provider to raise the limit",
                feedback: "You can't change the provider's limits.",
              },
              {
                text: "Split the transcript into chunks, process each, then merge",
                correct: true,
                feedback:
                  "Correct — this is 'chunking', a fundamental pattern when working with size limits.",
              },
              {
                text: "Truncate the transcript so it fits",
                feedback: "You'd lose the end of the podcast.",
              },
            ]}
          />
        ),
      },
      {
        label: "Long question + long options (mobile wrap stress)",
        node: (
          <Quiz
            question="Your team ships a new endpoint to production and a small fraction of requests start returning 500 errors, but only for users with very long usernames containing accented characters and emoji — the rest of the traffic is fine, the logs show a database error about an invalid byte sequence, and the fix that worked locally doesn't reproduce because your local database has a different default encoding. What is the most likely root cause?"
            options={[
              {
                text: "The database table is missing a primary key, which causes intermittent lock contention under write load and surfaces as a generic 500 for a subset of users.",
                feedback:
                  "Lock contention doesn't produce 'invalid byte sequence' errors, and it wouldn't correlate with username content.",
              },
              {
                text: "The application is not normalizing usernames to UTF-8 before inserting, and the production database is configured with a non-UTF8 encoding (e.g. LATIN1) that rejects multi-byte characters.",
                correct: true,
                feedback:
                  "Exactly — 'invalid byte sequence' plus correlation with accented/emoji usernames points to an encoding mismatch between the app (UTF-8) and the production database (non-UTF8). The local DB was UTF-8, which is why it never reproduced.",
              },
              {
                text: "The load balancer is dropping requests with payloads over a certain size, and usernames with emoji happen to be longer in bytes.",
                feedback:
                  "A dropped request at the load balancer returns a 4xx or a gateway error, not a 500 with a database error in the logs.",
              },
              {
                text: "The ORM is caching query plans and reusing a stale one that assumes ASCII-only column widths.",
                feedback:
                  "ORMs don't cache column-width assumptions; the error is coming from the database, not the ORM layer.",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "flashcards",
    name: "Flashcards",
    summary:
      "A flip deck for active recall. Reveal the answer, then grade yourself; controls stay thumb-reachable.",
    demos: [
      {
        label: "Deck",
        node: (
          <Flashcards
            cards={[
              {
                front: "What does a CDN do?",
                back: "Serves static assets from a server geographically close to the user, cutting latency.",
              },
              {
                front: "Idempotent HTTP method?",
                back: "A request you can repeat with the same effect — GET, PUT and DELETE are idempotent; POST is not.",
              },
              {
                front: "What is a database index?",
                back: "A structure that speeds up lookups on a column, at the cost of slower writes and extra storage.",
              },
            ]}
          />
        ),
      },
      {
        label: "Long-form cards (mobile flip stress)",
        node: (
          <Flashcards
            cards={[
              {
                front: "Why does a query that was fast in staging suddenly become slow in production, even though the schema and the query text are identical?",
                back: "Because the query planner picks execution plans from table statistics, and those statistics differ between environments — a staging table with a thousand rows will pick a seq scan that stays fast, while a production table with a hundred million rows and a stale analyze may pick the same seq scan and grind to a halt, or pick an index that's suddenly not selective. The fix is almost never the query; it's the statistics, the indexes, or the data shape.",
              },
              {
                front: "What is the difference between a cold start and a warm start in a serverless function, and why does it matter for latency budgets?",
                back: "A cold start is the full provisioning cycle: the platform allocates a container, downloads your code, boots the runtime, runs your initialization, and only then handles the request. A warm start reuses an already-initialized container and jumps straight to the handler. Cold starts can add hundreds of milliseconds to multiple seconds, so for latency-sensitive endpoints you either keep functions warm, move logic to the edge, or accept p99 latency that's dominated by cold-start outliers.",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "checklist",
    name: "Checklist",
    summary:
      "An actionable, persistent to-do list. Checked state is saved to localStorage so it survives reloads.",
    demos: [
      {
        label: "Deploy checklist",
        node: (
          <Checklist
            id="demo-deploy"
            items={[
              { text: "Set environment variables", hint: "DATABASE_URL, API_KEY" },
              { text: "Run the test suite" },
              { text: "Build the production bundle" },
              { text: "Point the domain at the host" },
              { text: "Verify the health-check endpoint" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "callout-box",
    name: "CalloutBox",
    summary:
      "Highlights information with an intent. The accent comes from theme tokens (neutral by default, mustard/lilac/terracotta under Web Reactiva).",
    demos: [
      {
        label: "Variants",
        node: (
          <div className="flex flex-col gap-3">
            <CalloutBox variant="aha">
              Every web framework does the same thing: take a request and return
              a response. Once you see that, they stop being intimidating.
            </CalloutBox>
            <CalloutBox variant="info">
              <code>set:html</code> is used when the code contains{" "}
              <code>{"{}"}</code> so the templating engine doesn't interpret it.
            </CalloutBox>
            <CalloutBox variant="warning">
              A <code>GET</code> request can't carry a body. Use{" "}
              <code>POST</code> when you need to send data.
            </CalloutBox>
          </div>
        ),
      },
      {
        label: "Long paragraph (mobile wrap stress)",
        node: (
          <CalloutBox variant="info">
            When a database receives a query, it first parses the SQL into an
            abstract syntax tree, then the planner explores multiple execution
            strategies — full table scan versus index lookup versus hash join —
            and estimates the cost of each based on table statistics gathered by
            the analyzer. The cheapest plan wins, but the statistics can be
            stale, and a plan that was optimal yesterday may degrade suddenly
            after a data skew, a vacuum, or an analyze that hasn't run yet. This
            is why "the query was fast in staging and slow in production" is
            rarely about the query itself and almost always about the
            statistics, the indexes, or the shape of the data — which differ
            between environments even when the schema is identical.
          </CalloutBox>
        ),
      },
    ],
  },
  {
    id: "step-cards",
    name: "StepCards",
    summary: "An ordered sequence of numbered steps.",
    demos: [
      {
        label: "Request lifecycle",
        node: (
          <StepCards
            steps={[
              { title: "Request", description: "The browser sends an HTTP request to the server." },
              { title: "Route", description: "The server finds which code handles that URL." },
              { title: "Process", description: "Business logic runs: query the database, transform data." },
              { title: "Response", description: "The server returns HTML, JSON, or an error." },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "pattern-card",
    name: "PatternCard",
    summary:
      "A responsive grid of icon + title + description cards. Auto-fits columns down to a single column.",
    demos: [
      {
        label: "The pieces of a web app",
        node: (
          <PatternCard
            cards={[
              { icon: <Icon icon="code" />, title: "Frontend", description: "What the user sees and interacts with." },
              { icon: <Icon icon="server" />, title: "Backend", description: "The logic that runs on the server." },
              { icon: <Icon icon="database" />, title: "Database", description: "Where data is stored permanently." },
              { icon: <Icon icon="globe" />, title: "External API", description: "Third-party services you consume." },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "flow-diagram",
    name: "FlowDiagram",
    summary:
      "A linear 'A → B → C' flow. Wraps on small screens; the active node uses the theme's primary accent. (Per-node detail panels are opt-in.)",
    demos: [
      {
        label: "Request path",
        node: (
          <FlowDiagram
            nodes={[
              { label: "User", active: true },
              { label: "CDN" },
              { label: "Server" },
              { label: "Cache" },
              { label: "Database" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "resource-list",
    name: "ResourceList",
    summary:
      "A titled list of external links — 'keep exploring', further reading, or references. Each item carries a kind icon, an optional source + qualifier eyebrow, and a blurb. The home for material that comes from outside the source content, so every item is a real outbound URL. Emits `resource_opened` on click.",
    demos: [
      {
        label: "Keep exploring (list)",
        node: (
          <ResourceList
            title="Keep exploring"
            items={[
              {
                label: "How the web loads a page",
                href: "https://example.com/round-trip",
                kind: "article",
                source: "Web Reactiva",
                meta: "8 min",
                description:
                  "The request/response round trip, from Enter to painted page.",
              },
              {
                label: "The episode this guide is based on",
                href: "https://example.com/episode-315",
                kind: "episode",
                source: "Web Reactiva Premium",
                meta: "Ep. 315",
              },
              {
                label: "OpenAPI specification",
                href: "https://spec.openapis.org/oas/latest.html",
                kind: "docs",
                source: "spec.openapis.org",
              },
            ]}
          />
        ),
      },
      {
        label: "References (cards)",
        node: (
          <ResourceList
            title="References"
            layout="cards"
            items={[
              {
                label: "Swagger Editor",
                href: "https://editor.swagger.io",
                kind: "tool",
                source: "swagger.io",
              },
              {
                label: "The repo with the examples",
                href: "https://github.com/example/repo",
                kind: "repo",
                source: "GitHub",
              },
              {
                label: "Watch the walkthrough",
                href: "https://example.com/video",
                kind: "video",
                meta: "12:34",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "code-translation",
    name: "CodeTranslation",
    summary:
      "Real code on one side, a plain-language explanation on the other. Stacks when narrow (container queries).",
    demos: [
      {
        label: "Reading a line of code",
        node: (
          <CodeTranslation
            code={`const greeting = "Hello, world!";\nconsole.log(greeting);\n// Output: Hello, world!`}
            translations={[
              'Store the text "Hello, world!" in a box named greeting.',
              "Show the contents of that box on the screen.",
              "This comment tells you what you'll see when the code runs.",
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "tangle-text",
    name: "TangleText",
    summary:
      "A reactive document (Bret Victor's 'Tangle'). Drag the underlined numbers and every dependent value recomputes live.",
    demos: [
      {
        label: "Reactive estimate",
        node: (
          <TangleText
            locale="en-US"
            text="A team of {users} developers, each saving {hours} hours a week at €{rate}/hour, frees up about {=savings} per year."
            variables={{
              users: { value: 8, min: 1, max: 50 },
              hours: { value: 5, min: 1, max: 40 },
              rate: { value: 50, min: 10, max: 150 },
            }}
            outputs={{
              savings: { formula: "users * hours * rate * 48", format: "currency" },
            }}
          />
        ),
      },
    ],
  },
  {
    id: "frame-stepper",
    name: "FrameStepper",
    summary:
      "A state-timeline scrubber. Step through discrete snapshots with prev/next or autoplay; the caption is announced to screen readers.",
    demos: [
      {
        label: "Request lifecycle",
        node: (
          <FrameStepper
            boxes={[
              { id: "browser", label: "Browser" },
              { id: "server", label: "Server" },
              { id: "db", label: "Database" },
            ]}
            frames={[
              { caption: "The browser sends a request.", active: ["browser"] },
              {
                caption: "The server receives it and queries the database.",
                active: ["server"],
                badges: { server: "POST /save" },
              },
              {
                caption: "The database returns the row.",
                active: ["server", "db"],
                badges: { db: "id: 42" },
              },
              {
                caption: "The server responds; the browser updates.",
                active: ["browser"],
                badges: { browser: "201" },
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "terminal-sim",
    name: "TerminalSim",
    summary:
      "A safe, simulated CLI. Commands type themselves and print their output; the learner drives the pace one command at a time.",
    demos: [
      {
        label: "Git flow",
        node: (
          <TerminalSim
            windowTitle="bash"
            commands={[
              {
                cmd: "git status",
                output: "On branch main\nnothing to commit, working tree clean",
              },
              {
                cmd: "git checkout -b feature",
                output: "Switched to a new branch 'feature'",
              },
              { cmd: "npm test", output: "✓ 7 tests passed" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "data-chart",
    name: "DataChart",
    summary:
      "Declarative bar / horizontal-bar / line charts as inline SVG, zero chart dependencies. Colors come from the theme's --chart-* palette; numbers are locale-formatted.",
    demos: [
      {
        label: "Vertical bar",
        node: (
          <DataChart
            chartType="bar"
            unit="ms"
            data={[
              { label: "p50", value: 120 },
              { label: "p90", value: 340 },
              { label: "p99", value: 820 },
            ]}
          />
        ),
      },
      {
        label: "Horizontal bar",
        node: (
          <DataChart
            chartType="hbar"
            unit="%"
            data={[
              { label: "Chrome", value: 64 },
              { label: "Safari", value: 19 },
              { label: "Firefox", value: 9 },
              { label: "Edge", value: 5 },
            ]}
          />
        ),
      },
      {
        label: "Line (two series)",
        node: (
          <DataChart
            chartType="line"
            labels={["W1", "W2", "W3", "W4", "W5"]}
            series={[
              { name: "Signups", values: [20, 35, 30, 55, 70] },
              { name: "Active", values: [12, 20, 25, 38, 52] },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "infographic",
    name: "Infographic",
    summary:
      "Napkin-style visual metaphors (funnel, pyramid, cycle, hub, target, matrix…) as inline SVG. Shape fills come from the theme palette; long text goes in a numbered legend.",
    demos: [
      {
        label: "Funnel",
        node: (
          <Infographic
            layout="funnel"
            items={[
              { label: "Visitors", description: "Everyone who lands on the page." },
              { label: "Sign-ups", description: "Created an account." },
              { label: "Active", description: "Came back within the first week." },
              { label: "Paying", description: "Upgraded to a paid plan." },
            ]}
          />
        ),
      },
      {
        label: "Hub",
        node: (
          <Infographic
            layout="hub"
            center="Core API"
            items={[
              { label: "Web" },
              { label: "Mobile" },
              { label: "CLI" },
              { label: "Webhooks" },
              { label: "Partners" },
            ]}
          />
        ),
      },
      {
        label: "Milestones (icons)",
        node: (
          <Infographic
            layout="milestones"
            items={[
              { icon: <Icon icon="book" />, label: "Literature review" },
              { icon: <Icon icon="edit" />, label: "Hypothesis" },
              { icon: <Icon icon="server" />, label: "Data collection" },
              { icon: <Icon icon="chart-bar" />, label: "Analysis" },
              { icon: <Icon icon="mail" />, label: "Submission" },
            ]}
          />
        ),
      },
      {
        label: "Chevrons (icons)",
        node: (
          <Infographic
            layout="chevrons"
            items={[
              { icon: <Icon icon="lightbulb" />, label: "Idea" },
              { icon: <Icon icon="code" />, label: "Build" },
              { icon: <Icon icon="check" />, label: "Test" },
              { icon: <Icon icon="upload" />, label: "Ship" },
            ]}
          />
        ),
      },
      {
        label: "Roadmap (icons)",
        node: (
          <Infographic
            layout="roadmap"
            items={[
              { icon: <Icon icon="map" />, label: "Kickoff" },
              { icon: <Icon icon="book" />, label: "Learn" },
              { icon: <Icon icon="code" />, label: "Prototype" },
              { icon: <Icon icon="users" />, label: "Feedback" },
              { icon: <Icon icon="redo" />, label: "Iterate" },
              { icon: <Icon icon="trophy" />, label: "Launch" },
            ]}
          />
        ),
      },
      {
        label: "Pillars (icons)",
        node: (
          <Infographic
            layout="pillars"
            items={[
              { icon: <Icon icon="lock" />, label: "Security" },
              { icon: <Icon icon="zap" />, label: "Performance" },
              { icon: <Icon icon="users" />, label: "Community" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "mermaid-diagram",
    name: "MermaidDiagram",
    summary:
      "Interactive Mermaid diagrams: rendered client-side, theme-aware colors, optional zoom/pan, and click-a-node detail panels.",
    demos: [
      {
        label: "Flowchart (zoomable, click nodes)",
        node: (
          <MermaidDiagram
            zoomable
            chart={`graph LR
  U[User] --> CDN[CDN]
  CDN --> S[Server]
  S --> C[Cache]
  S --> DB[(Database)]`}
            details={[
              { id: "U", title: "User", description: "Makes an HTTP request from the browser." },
              { id: "S", title: "Server", description: "Runs business logic; decides cache vs. database." },
              { id: "DB", title: "Database", description: "Persistent store for the system's data." },
            ]}
          />
        ),
      },
      {
        label: "Sequence diagram",
        node: (
          <MermaidDiagram
            chart={`sequenceDiagram
  actor User
  participant API
  participant DB as Database
  User->>API: POST /save
  API->>DB: INSERT
  DB-->>API: id 42
  API-->>User: 201 Created`}
          />
        ),
      },
    ],
  },
  {
    id: "scrubber",
    name: "Scrubber",
    summary:
      "A control-panel explorable: drag sliders for the inputs and watch computed outputs update live (numbers + bars). The panel sibling of TangleText.",
    demos: [
      {
        label: "Unit economics",
        node: (
          <Scrubber
            locale="en-US"
            variables={{
              users: { label: "Active users", value: 1200, min: 0, max: 10000, step: 100 },
              arpu: { label: "Revenue per user", value: 12, min: 0, max: 100, unit: "€" },
              churn: { label: "Monthly churn", value: 4, min: 0, max: 30, unit: "%" },
            }}
            outputs={{
              mrr: { label: "MRR", formula: "users * arpu", format: "currency", max: 1000000 },
              lost: { label: "Users lost / month", formula: "users * churn / 100", max: 3000 },
            }}
          />
        ),
      },
    ],
  },
  {
    id: "spot-the-bug",
    name: "SpotTheBug",
    summary:
      "Click the line you think has the bug; the right one reveals why. Wrong guesses nudge you to keep looking — debugging as active recall.",
    demos: [
      {
        label: "fetch() bug",
        node: (
          <SpotTheBug
            lines={[
              { code: "async function saveData(data) {" },
              { code: "  const res = await fetch('/api/save', {" },
              {
                code: "    method: 'GET',",
                buggy: true,
                explanation:
                  "A GET request can't carry a body — saving data needs POST (or PUT).",
              },
              { code: "    body: JSON.stringify(data)" },
              { code: "  });" },
              { code: "}" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "decision-tree",
    name: "DecisionTree",
    summary:
      "A branching 'choose-your-path' explorable: make a choice, follow the branch, reach an outcome. Great for troubleshooting flows.",
    demos: [
      {
        label: "Why is my page slow?",
        node: (
          <DecisionTree
            start="q1"
            nodes={{
              q1: {
                prompt: "Is the slowness on first load, or on interaction?",
                options: [
                  { label: "First load", to: "load" },
                  { label: "Interaction", to: "interaction" },
                ],
              },
              load: {
                prompt: "Is the network tab dominated by JavaScript or by images?",
                options: [
                  { label: "JavaScript", to: "js" },
                  { label: "Images", to: "img" },
                ],
              },
              interaction: {
                prompt: "Interaction is the bottleneck.",
                outcome:
                  "Profile the main thread — long tasks and unnecessary re-renders are the usual culprits.",
              },
              js: {
                prompt: "JavaScript is the bottleneck.",
                outcome:
                  "Code-split and defer non-critical JS; ship less to the client.",
              },
              img: {
                prompt: "Images are the bottleneck.",
                outcome:
                  "Serve responsive, compressed images (AVIF/WebP) and lazy-load below the fold.",
              },
            }}
          />
        ),
      },
      {
        label: "Long prompts + long outcomes (mobile branch stress)",
        node: (
          <DecisionTree
            start="start"
            nodes={{
              start: {
                prompt:
                  "Your p99 endpoint latency jumped from 180ms to 4 seconds overnight. There was no deploy, no traffic spike, and the dashboard shows the CPU graph is flat. Where do you look first?",
                options: [
                  { label: "Database / queries", to: "db" },
                  { label: "External API calls", to: "api" },
                  { label: "GC / memory pressure", to: "gc" },
                ],
              },
              db: {
                prompt:
                  "The slow spans all end in a database call. The query text hasn't changed. What's the next thing you check?",
                options: [
                  { label: "Row counts and statistics", to: "dbstats" },
                  { label: "Locks and blocking", to: "dblocks" },
                ],
              },
              dbstats: {
                prompt: "Statistics it is.",
                outcome:
                  "Run ANALYZE (or the equivalent) and check the last-analyzed timestamp on the affected tables. A large overnight import or a bulk delete can leave the planner working from stale statistics, and it will pick a plan that was correct yesterday and catastrophic today — a seq scan over a table that's now a hundred million rows, or an index that's no longer selective. Re-running ANALYZE usually restores the plan within minutes, but the underlying fix is automating ANALYZE on a schedule tied to data-volume changes, not just a nightly cron.",
              },
              dblocks: {
                prompt: "Locks it is.",
                outcome:
                  "Query pg_locks (or the equivalent) for blocked PIDs and the blocking chain. A long-running transaction — often a forgotten analytical query, a manual psql session someone left open in a screen, or a migration that took a lock and stalled — will block everything downstream that touches the same rows. Kill the blocker and the latency drops immediately; the structural fix is statement timeouts on read-only connections and a lock monitor that alerts on wait times over a threshold.",
              },
              api: {
                prompt: "External API it is.",
                outcome:
                  "Add per-downstream-service timeout and circuit-breaker metrics. The most common silent killer is a third-party endpoint that started returning 200s with a 3-second TTFB instead of failing fast — your retry and timeout configuration determines whether one slow dependency drags the whole fleet down or fails open. Look at the downstream's status page last; it's almost never the outage, it's the slow-degradation that the status page never mentions.",
              },
              gc: {
                prompt: "GC it is.",
                outcome:
                  "Capture a heap dump and a GC log covering the slow window. A flat CPU graph with rising latency is a classic sign of a memory leak that hasn't OOMed yet — the runtime is spending increasing time in GC pauses trying to keep up, and the process is still technically 'up' so the health check passes. The fix is finding what's holding references (a cache without a bound, a listener that wasn't removed, a queue that grows under backpressure), but the operational fix is a memory limit and an alert on GC time, not on CPU.",
              },
            }}
          />
        ),
      },
    ],
  },
  {
    id: "fill-in-the-blanks",
    name: "FillInTheBlanks",
    summary:
      "Prose with dropdown blanks the reader fills, then checks — applying knowledge in context.",
    demos: [
      {
        label: "HTTP methods",
        node: (
          <FillInTheBlanks
            text="In HTTP, a {{read}} request reads data without side effects, while a {{write}} request sends a body to create something new."
            blanks={{
              read: { options: ["GET", "POST", "DELETE"], answer: "GET" },
              write: { options: ["GET", "POST", "HEAD"], answer: "POST" },
            }}
          />
        ),
      },
    ],
  },
  {
    id: "timeline",
    name: "Timeline",
    summary:
      "A vertical sequence of milestones the reader clicks to expand. Ideal for histories, roadmaps, and processes over time.",
    demos: [
      {
        label: "A short history of the web",
        node: (
          <Timeline
            defaultOpen={0}
            items={[
              { time: "1991", title: "The Web is born", description: "Tim Berners-Lee publishes the first website at CERN." },
              { time: "1995", title: "JavaScript", description: "Brendan Eich writes the first version in ten days." },
              { time: "2015", title: "ES2015", description: "Modules, classes, arrow functions and promises — modern JS begins." },
              { time: "2020s", title: "Edge & islands", description: "Rendering moves to the edge; partial hydration takes off." },
            ]}
          />
        ),
      },
      {
        label: "Long descriptions (mobile expand stress)",
        node: (
          <Timeline
            defaultOpen={0}
            items={[
              {
                time: "1991",
                title: "The Web is born",
                description:
                  "Tim Berners-Lee, working at CERN, publishes the first website at info.cern.ch — a single page describing the World Wide Web project, hosted on a NeXT workstation, written in HTML and served over HTTP. The first browser was also the first editor, and the whole thing was designed so physicists could share documents without a central server. The simplicity of the original design — stateless requests, a single address space, plain-text formats — is exactly why it scaled to billions of pages.",
              },
              {
                time: "1995",
                title: "JavaScript",
                description:
                  "Brendan Eich, hired at Netscape on a tight deadline, writes the first version of JavaScript in ten days. It was originally called Mocha, then LiveScript, and the name 'Java' was bolted on as a marketing decision — there is almost nothing in common between Java and JavaScript. Despite the rush, the prototype-based object model and first-class functions were good instincts that the language is still leveraging thirty years later.",
              },
              {
                time: "2015",
                title: "ES2015",
                description:
                  "After a decade of stalled evolution, the spec jumps from ES5 to ES2015 and brings modules, classes, arrow functions, let/const, destructuring, default parameters, template literals, promises, Maps and Sets, and a standardized module system. This is the moment 'modern JavaScript' starts — and the moment the language moves to yearly releases instead of decade-long gaps.",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "compare-slider",
    name: "CompareSlider",
    summary:
      "Before/after comparison with a draggable divider the reader sweeps. Perfect for refactors, optimizations, and design changes.",
    demos: [
      {
        label: "Callbacks → async/await",
        node: (
          <CompareSlider
            className="h-72"
            labels={{ before: "Callbacks", after: "async/await" }}
            before={
              <pre className="m-0 grid h-full w-full place-items-center bg-[var(--wgt-code-bg)] p-4 font-mono text-xs leading-relaxed text-[var(--wgt-code-fg)]">{`fetchUser(id, function (u) {
  fetchPosts(u, function (p) {
    render(p)
  })
})`}</pre>
            }
            after={
              <pre className="m-0 grid h-full w-full place-items-center bg-[var(--wgt-code-bg)] p-4 font-mono text-xs leading-relaxed text-[var(--wgt-code-fg)]">{`const u = await fetchUser(id)
const p = await fetchPosts(u)
render(p)`}</pre>
            }
          />
        ),
      },
      {
        label: "Images (grayscale → color)",
        node: (
          <CompareSlider
            className="aspect-video"
            labels={{ before: "Original", after: "Graded" }}
            beforeSrc="https://picsum.photos/seed/widgetron/960/540?grayscale"
            afterSrc="https://picsum.photos/seed/widgetron/960/540"
            alt="Sample photo before and after colour grading"
          />
        ),
      },
    ],
  },
  {
    id: "predict-output",
    name: "PredictOutput",
    summary:
      "Show code, let the reader predict what it prints, then reveal the actual output — active recall for execution models.",
    demos: [
      {
        label: "The event loop",
        node: (
          <PredictOutput
            code={`console.log("A");
setTimeout(() => console.log("B"), 0);
console.log("C");`}
            output={`A\nC\nB`}
            options={[
              {
                text: "A, B, C",
                feedback:
                  "setTimeout(…, 0) doesn't run immediately — synchronous code finishes first.",
              },
              {
                text: "A, C, B",
                correct: true,
                feedback:
                  "Right — the callback waits for the call stack to clear (the event loop).",
              },
              {
                text: "C, A, B",
                feedback: "JavaScript runs top to bottom, so A logs first.",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "drag-and-drop",
    name: "DragAndDrop",
    summary:
      "Categorize by placing each item in its zone — tap an item then its target, or drag it. Touch- and keyboard-friendly.",
    demos: [
      {
        label: "Sort the stack",
        node: (
          <DragAndDrop
            items={[
              { id: "react", label: "React", target: "frontend" },
              { id: "postgres", label: "PostgreSQL", target: "database" },
              { id: "express", label: "Express", target: "backend" },
              { id: "css", label: "CSS", target: "frontend" },
            ]}
            targets={[
              { id: "frontend", label: "Frontend" },
              { id: "backend", label: "Backend" },
              { id: "database", label: "Database" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "hotspots",
    name: "Hotspots",
    summary:
      "Clickable points overlaid on a figure reveal explanations — explore a diagram, screenshot, or UI by touching its parts.",
    demos: [
      {
        label: "Request lifecycle",
        node: (
          <Hotspots
            hotspots={[
              { x: 18, y: 24, title: "Browser", description: "Sends an HTTP request and renders the response." },
              { x: 50, y: 24, title: "Server", description: "Runs the business logic and talks to the database." },
              { x: 82, y: 24, title: "Database", description: "Stores and returns the system's data." },
            ]}
          >
            <div className="flex h-48 items-stretch gap-3 bg-muted/40 p-4">
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Browser</div>
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Server</div>
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Database</div>
            </div>
          </Hotspots>
        ),
      },
      {
        label: "Long descriptions (mobile panel stress)",
        node: (
          <Hotspots
            hotspots={[
              {
                x: 18,
                y: 24,
                title: "Browser",
                description:
                  "The browser is the user agent: it takes the URL you type, resolves it through DNS, opens a TCP/TLS connection to the server, sends an HTTP request, and once the response arrives it parses the HTML, builds the DOM, requests sub-resources, applies CSS, and executes JavaScript to produce the interactive page the user sees.",
              },
              {
                x: 50,
                y: 24,
                title: "Server",
                description:
                  "The server receives the request, routes it to the correct handler (often through middleware that adds auth, logging, rate limiting and error handling), runs the business logic, talks to one or more databases or downstream services, serializes the result into HTML or JSON, and sends the response back with an appropriate status code and cache headers.",
              },
              {
                x: 82,
                y: 24,
                title: "Database",
                description:
                  "The database persists the system's state across requests. It receives queries, uses its planner to pick an execution strategy based on indexes and table statistics, fetches and joins the rows, and returns them — or, on writes, applies the transaction, updates indexes, and flushes to durable storage before acknowledging.",
              },
            ]}
          >
            <div className="flex h-48 items-stretch gap-3 bg-muted/40 p-4">
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Browser</div>
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Server</div>
              <div className="grid flex-1 place-items-center rounded-md border bg-card font-medium">Database</div>
            </div>
          </Hotspots>
        ),
      },
    ],
  },
  {
    id: "group-chat",
    name: "GroupChat",
    summary:
      "An animated, reader-paced conversation — explain a flow as a dialogue between actors, revealed message by message.",
    demos: [
      {
        label: "What happens on Save",
        node: (
          <GroupChat
            title="What happens on Save"
            messages={[
              { from: "Browser", text: "POST /api/save with the form data", side: "right" },
              { from: "Server", text: "Validating… then writing to the database.", side: "left" },
              { from: "Database", text: "Row inserted — id 42.", side: "left" },
              { from: "Server", text: "201 Created 👍", side: "left" },
              { from: "Browser", text: "Show the success toast.", side: "right" },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "audio-clip",
    name: "AudioClip",
    summary:
      "An audio player with a synced transcript. Custom play/seek controls, a volume control and a speed cycle (both remembered), optional cover art, and a sticky corner mini-player once you scroll past it while it plays. If a transcript is present, each cue highlights as it plays (karaoke) and clicking a cue seeks there. Pass cues inline or fetch them from a URL (JSON / .vtt / .srt). Only one clip on a page plays at a time.",
    demos: [
      {
        label: "With a synced transcript",
        node: (
          <AudioClip
            title="Why write a spec first"
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            transcript={[
              { start: 0, text: "A spec is the plan you write before any code." },
              { start: 5, text: "It captures the intent: what to build, and why." },
              { start: 11, text: "Then the spec drives the implementation." },
              { start: 17, text: "The model fills in details — you own the direction." },
              { start: 24, text: "Click any line to jump straight to that moment." },
            ]}
          />
        ),
      },
      {
        label: "Audio only (no transcript)",
        node: (
          <AudioClip
            title="A short clip"
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
          />
        ),
      },
      {
        label: "With cover art (poster from the feed)",
        node: (
          <AudioClip
            title="Episode cover pulled from the RSS feed"
            poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
          />
        ),
      },
    ],
  },
  {
    id: "video-clip",
    name: "VideoClip",
    summary:
      "A responsive 16:9 video embed. Plays a direct video file with native controls, or lazy-loads a privacy-friendly YouTube/Vimeo iframe behind a click-to-play poster (no third-party scripts until the learner opts in).",
    demos: [
      {
        label: "YouTube (click-to-load)",
        node: (
          <VideoClip
            youtube="aqz-KE-bpKQ"
            title="Big Buck Bunny"
            poster="https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg"
          />
        ),
      },
      {
        label: "Direct video file",
        node: (
          <VideoClip
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
            title="Big Buck Bunny (MP4)"
          />
        ),
      },
    ],
  },
  {
    id: "figure",
    name: "Figure",
    summary:
      "A standalone image with an optional caption and source credit. References the image by URL, lazy-loads it, and renders a real <figure>/<figcaption>. Crop to a fixed ratio with `aspect`, or leave it to keep the image's natural size; add `href` to link back to the source.",
    demos: [
      {
        label: "Captioned, cropped to 16:9 with a credit",
        node: (
          <Figure
            src="https://picsum.photos/seed/widgetron-figure/1200/675"
            alt="An abstract placeholder illustration"
            caption="The round trip every page load makes — request out, response back."
            credit="Source: **Web Reactiva**"
            aspect="16/9"
          />
        ),
      },
      {
        label: "Natural ratio, linked to its source",
        node: (
          <Figure
            src="https://picsum.photos/seed/widgetron-natural/900/520"
            alt="A wide placeholder illustration"
            caption="Click the image to open where it came from."
            href="https://picsum.photos"
          />
        ),
      },
    ],
  },
  {
    id: "prompt-template",
    name: "PromptTemplate",
    summary:
      "A copy-ready AI prompt with inline-editable {{slots}}. The dispensa teaches a concept AND hands over the exact prompt to use — edit the slots, hit copy, paste into your AI. Copy is customizable/translatable.",
    demos: [
      {
        label: "Code-review prompt",
        node: (
          <PromptTemplate
            template={
              "Act as a senior {{language}} engineer.\n" +
              "Review the code below for {{focus}} and suggest concrete, minimal changes.\n" +
              "Explain each change in one sentence.\n\n" +
              "{{paste your code here}}"
            }
            note="Tip: keep the role specific."
          />
        ),
      },
    ],
  },
  {
    id: "profile-quiz",
    name: "ProfileQuiz",
    summary:
      "The signature personalization artifact: a short onboarding quiz writes a profile (ProfileProvider), and ProfileGate blocks tailor the rest of the page to it (dispensa's show_if). Answer below and watch the callouts adapt. State persists in localStorage.",
    demos: [
      {
        label: "Onboarding + gated content",
        node: <ProfileQuizDemo />,
      },
    ],
  },
  {
    id: "glossary-text",
    name: "GlossaryText",
    summary:
      "Prose where [[terms]] hide their definition behind a dotted underline — hover, focus, or tap to reveal. The signature dispensa reading affordance.",
    demos: [
      {
        label: "The script before the shoot",
        node: <GlossaryTextDemo />,
      },
      {
        label: "Long prose with long definitions (mobile tooltip stress)",
        node: (
          <GlossaryProvider
            terms={{
              "edge function":
                "A small piece of code that runs on a server close to the user (often at a CDN edge node) instead of in a single central region, so latency is lower and the cold-start cost is amortized across many geographies.",
              "hydration":
                "The process by which a browser-side framework attaches interactivity to HTML that was already rendered on the server, turning a static document into an interactive application without re-rendering the whole tree from scratch.",
              "island":
                "A self-contained interactive region embedded in an otherwise static page — the 'islands' architecture ships zero JS for the static shell and only hydrates the islands that actually need interactivity.",
              "progressive enhancement":
                "Building the core functionality so it works with plain HTML first, then layering JS and CSS on top to enrich the experience where the capabilities exist — the page degrades gracefully where they don't.",
            }}
          >
            <GlossaryText text="A modern framework can render the page on the server, ship raw HTML to the browser, and then run [[hydration]] only where needed. If most of the page is static, you can ship it as [[island]] widgets inside an HTML shell served by an [[edge function]] close to the user. The whole approach is a form of [[progressive enhancement]]: the content arrives as readable HTML first, and interactivity is layered on top only for the parts that truly need it." />
          </GlossaryProvider>
        ),
      },
    ],
  },
  {
    id: "profile-card",
    name: "ProfileCard",
    summary:
      "People cards: avatar (image or auto-initials on a theme accent), name, role and bio. Several people stack into container-aware columns; 'list' keeps one horizontal card per row.",
    demos: [
      {
        label: "Team grid (initials + one photo)",
        node: (
          <ProfileCard
            people={[
              {
                name: "Ada Lovelace",
                role: "Episode guest",
                bio: "Wrote the first published algorithm — a century before hardware could run it.",
                href: "https://es.wikipedia.org/wiki/Ada_Lovelace",
              },
              {
                name: "Grace Hopper",
                role: "Compiler pioneer",
                avatar:
                  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Commodore_Grace_M._Hopper%2C_USN_%28covered%29.jpg/256px-Commodore_Grace_M._Hopper%2C_USN_%28covered%29.jpg",
                bio: "Believed programming should read like language, then built the tools to prove it.",
              },
              {
                name: "Margaret Hamilton",
                role: "Software engineering",
                bio: "Coined the term while writing the code that landed on the Moon.",
              },
            ]}
          />
        ),
      },
      {
        label: "Single host (list layout)",
        node: (
          <ProfileCard
            layout="list"
            people={[
              {
                name: "Alan Turing",
                role: "Host",
                bio: "Asked whether machines can think, and gave us the vocabulary to keep arguing about it. This layout gives longer bios a full row to breathe.",
              },
            ]}
          />
        ),
      },
    ],
  },
  {
    id: "glossary-term",
    name: "GlossaryTerm",
    summary:
      "A single inline term with a dotted-underline definition tooltip — the one-off sibling of GlossaryText for definitions that aren't in the shared glossary.",
    demos: [
      {
        label: "Inline definition (no provider)",
        node: (
          <Prose>
            <p>
              Behind every fast page there is a well-placed{" "}
              <GlossaryTerm
                term="cache"
                definition="A copy of already-computed work kept close by, so the next request skips the slow path entirely."
              />{" "}
              and a short round trip to the{" "}
              <GlossaryTerm
                term="origin"
                definition="The server that owns the canonical data — the place every cache is ultimately trying to avoid bothering."
              />
              .
            </p>
          </Prose>
        ),
      },
    ],
  },
  {
    id: "profile-provider",
    name: "ProfileProvider",
    summary:
      "The context boundary of the profile family: wraps a section so ProfileQuiz (writer) and ProfileGate (readers) share one profile. Pass storageKey to persist; omit it for in-memory previews. Storyline's `profile` prop adds this for you.",
    demos: [
      {
        label: "In-memory boundary (no persistence)",
        node: <ProfileFamilyDemo />,
      },
    ],
  },
  {
    id: "profile-gate",
    name: "ProfileGate",
    summary:
      "The reader half of the profile family: wraps content that only appears when the profile matches its `when` condition, with an optional fallback for everyone else.",
    demos: [
      {
        label: "Gate with fallback",
        node: <ProfileFamilyDemo withFallback />,
      },
    ],
  },
  {
    id: "storyline",
    name: "Storyline",
    summary:
      "The dispensa reading composition (ported from ../dispensa): a scroll-driven document of modules — progress bar, module dots, alternating sections, scroll-reveals, and glossary terms. This whole demo is one JSON tree rendered with renderWidget(). Best seen in Mobile/Tablet (real device scroll).",
    demos: [
      {
        label: "A mini-dispensa (JSON-driven)",
        node: renderWidget(courseStoryline),
      },
      {
        label: "Thread mode (experimental) — same JSON, tap-through",
        node: renderWidget({
          ...courseStoryline,
          props: {
            ...courseStoryline.props,
            title: "A walk you can tap",
            description: "The same module tree, one screen at a time.",
            variant: "thread",
          },
        }),
      },
      {
        label: "Challenge mode — a themed meter fed by the interactions",
        node: renderWidget({
          ...courseStoryline,
          props: { ...courseStoryline.props, challenge: "Your tour score" },
        }),
      },
      {
        label: "Game mode (game format) — lives on the line: miss a quiz, lose a heart",
        node: renderWidget({
          ...courseStoryline,
          props: {
            ...courseStoryline.props,
            challenge: "Your run",
            lives: { total: 3, label: "Vidas" },
          },
        }),
      },
    ],
  },
  {
    id: "scrollytelling",
    name: "Scrollytelling",
    summary:
      "A composition (not an atomic widget): the sticky-graphic pattern. As you scroll the steps, a pinned graphic updates. This whole demo is authored as JSON and rendered with renderWidget() — the AI-generation target. Best seen in the Mobile/Tablet frames (fixed device height = real scroll).",
    demos: [
      {
        label: "How an HTTP request travels (JSON-driven)",
        node: renderWidget(requestScrolly),
      },
    ],
  },
  {
    id: "quote",
    name: "Quote",
    summary:
      "A highlighted pull-quote / testimonial that attributes words to a person. Semantic figure/blockquote/figcaption; the accent comes from the theme. No chrome to translate — the words come from children.",
    demos: [
      {
        label: "Podcast pull-quote",
        node: (
          <Quote attribution="Grace Hopper" role="Episode guest">
            The most dangerous phrase in the language is: we've always done it
            this way.
          </Quote>
        ),
      },
      {
        label: "No attribution",
        node: (
          <Quote>
            Ship the smallest thing that teaches you something real.
          </Quote>
        ),
      },
    ],
  },
  {
    id: "surprise",
    name: "Surprise",
    summary:
      "A reveal wrapper: keeps a payload hidden until the reader opens it, with a small reveal moment. Perfect for a delight at the end of a guide — a bonus prompt, a quote, a video. Usable as a storyline screen.",
    demos: [
      {
        label: "Reveal a copy-ready prompt (JSON-driven)",
        node: renderWidget(surpriseReveal),
      },
      {
        label: "Reveal a quote",
        node: (
          <Surprise
            teaser="One line that stuck with us this episode."
            content={
              <Quote attribution="Ada Lovelace" role="Episode guest">
                The best code is the code you never had to write. Delete before
                you optimize.
              </Quote>
            }
          />
        ),
      },
    ],
  },
  {
    id: "keyword-gate",
    name: "KeywordGate",
    summary:
      "A gate that reveals a reward once the reader types the guide's keyword from memory — active recall, the strongest retention move. Idle → hint → ghost so nobody stalls; an optional skip opens it for a cold reader (preceded by an invite). Emits `keyword_attempt`, the guide's recall metric. Usable as a storyline screen.",
    demos: [
      {
        label: "Type the word to unlock (JSON-driven reward)",
        node: renderWidget({
          type: "keyword-gate",
          version: 1,
          props: {
            prompt: "The episode left one word behind. **Type it.**",
            answer: "the smoke",
            hint: "Starts with S — it's what you fought in the final boss.",
            skipLabel: "I haven't heard it",
            reward: {
              type: "callout-box",
              props: {
                variant: "aha",
                children:
                  "You typed it from memory — that's the episode consolidated. See you in the next one.",
              },
            },
          },
        } as WidgetNode),
      },
      {
        label: "Hint appears after 3s idle, then a ghost",
        node: (
          <KeywordGate
            prompt="What was the word?"
            answer="momentum"
            hintAfterSeconds={3}
            hint="It's what a free plan cuts right when you had it."
            reward={<p className="text-sm">Nice — that's the one.</p>}
            celebrate={false}
          />
        ),
      },
    ],
  },
  {
    id: "cta",
    name: "Cta",
    summary:
      "The single conversion moment of a guide (usually the last screen). The 'link' variant sends the reader to an external destination; 'email-form' captures an address behind a required privacy-consent checkbox and POSTs it as JSON. Copy is customizable/translatable.",
    demos: [
      {
        label: "Link variant",
        node: (
          <Cta
            variant="link"
            title="Keep going"
            description="The full course picks up right where this guide ends."
            buttonLabel="Start the course"
            url="https://example.com/course"
          />
        ),
      },
      {
        label: "Email capture (with privacy consent)",
        node: (
          <Cta
            variant="email-form"
            title="Get the next guide"
            description="One email when the next explorable ships. No spam, unsubscribe anytime."
            privacyUrl="https://example.com/privacy"
            submitEndpoint="https://example.com/subscribe"
          />
        ),
      },
    ],
  },
];
