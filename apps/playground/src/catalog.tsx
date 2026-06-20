import type { ReactNode } from "react";
import {
  AudioClip,
  CalloutBox,
  Checklist,
  CodeTranslation,
  CompareSlider,
  DataChart,
  DecisionTree,
  DragAndDrop,
  FillInTheBlanks,
  Flashcards,
  FlowDiagram,
  FrameStepper,
  GlossaryProvider,
  GlossaryText,
  GroupChat,
  Hotspots,
  Icon,
  Infographic,
  MermaidDiagram,
  PatternCard,
  PredictOutput,
  ProfileGate,
  ProfileProvider,
  ProfileQuiz,
  PromptTemplate,
  Prose,
  Quiz,
  renderWidget,
  Scrubber,
  SectionHeader,
  SpotTheBug,
  StepCards,
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
      "callout-box",
      "step-cards",
      "timeline",
      "pattern-card",
      "code-translation",
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
  { title: "Media", ids: ["audio-clip", "video-clip"] },
  {
    title: "AI & personalization",
    ids: ["prompt-template", "profile-quiz"],
  },
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
      "An audio player with a synced transcript. Custom play/seek controls; if a transcript is present, each cue highlights as it plays (karaoke) and clicking a cue seeks there. Pass cues inline or fetch them from a URL (JSON / .vtt / .srt).",
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
];
