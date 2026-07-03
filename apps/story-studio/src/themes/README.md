# Story Studio themes — the `design.md` token contract

A widgetron theme is a `[data-theme="<name>"]` CSS block overriding the custom
properties widgets consume — no widget code is ever touched. Story Studio
compiles a theme from a markdown file:

```
pnpm --filter @webreactiva/story-studio story theme ./producto.design.md
```

The file needs a frontmatter with `name`, a `tokens:` section (light) and an
optional `dark:` section. Every key becomes `--<key>`. The body of the markdown
is yours — design notes, rationale, links; the compiler only reads the frontmatter.

## Tokens widgets consume

Semantic (shadcn): `background`, `foreground`, `card`, `card-foreground`,
`popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`,
`secondary-foreground`, `muted`, `muted-foreground`, `accent`,
`accent-foreground`, `destructive`, `destructive-foreground`, `border`,
`input`, `ring`.

States: `success`, `success-foreground`, `warning`, `warning-foreground`,
`info`, `info-foreground`.

Widget accents: `wgt-callout-aha`, `wgt-callout-info`, `wgt-callout-warning`,
`wgt-tint-surface`, `wgt-tint-border`.

Code surfaces: `wgt-code-bg`, `wgt-code-fg`, `wgt-code-keyword`,
`wgt-code-string`, `wgt-code-function`, `wgt-code-comment`,
`wgt-code-property`, `wgt-code-number`.

Charts: `chart-1` … `chart-5`. Brand palette: `brand-1` … `brand-5`.

Signature: `wgt-shadow-color`, `wgt-shadow`, `wgt-shadow-hover`.

Typography & shape: `font-sans`, `font-mono`, `font-display`, `radius`.

Unknown keys still compile (they may be intentional extras) but produce a
warning — treat warnings as probable typos.

Only override what differs from the aseptic base (`styles/tokens.css` in the
library): anything you omit falls through to the neutral default.
