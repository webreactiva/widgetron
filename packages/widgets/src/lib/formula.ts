/**
 * Safe arithmetic expression evaluator — no eval(), no Function().
 *
 * Powers TangleText (Bret Victor's "reactive documents"): formulas are DATA,
 * interpreted by this tiny recursive-descent parser.
 *
 * Grammar:
 *   expression := term (('+' | '-') term)*
 *   term       := factor (('*' | '/' | '%') factor)*
 *   factor     := '-' factor | power
 *   power      := primary ('^' factor)?
 *   primary    := number | identifier | identifier '(' args ')' | '(' expression ')'
 */

const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
  sqrt: Math.sqrt,
  pow: Math.pow,
  log2: Math.log2,
  log10: Math.log10,
  clamp: (v, lo, hi) => Math.min(Math.max(v, lo), hi),
};

type Token =
  | { kind: "number"; value: number }
  | { kind: "ident"; name: string }
  | { kind: "op"; op: string };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9._]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ kind: "number", value: parseFloat(num.replace(/_/g, "")) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let name = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        name += expr[i];
        i++;
      }
      tokens.push({ kind: "ident", name });
      continue;
    }
    if ("+-*/%^(),".includes(ch)) {
      tokens.push({ kind: "op", op: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" in formula "${expr}"`);
  }
  return tokens;
}

export function evaluateFormula(
  expr: string,
  vars: Record<string, number>,
): number {
  const tokens = tokenize(expr);
  let pos = 0;

  const peek = (): Token | undefined => tokens[pos];
  const isOp = (op: string): boolean => {
    const t = peek();
    return t?.kind === "op" && t.op === op;
  };

  function expression(): number {
    let value = term();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[pos++] as { op: string }).op;
      const rhs = term();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function term(): number {
    let value = factor();
    while (isOp("*") || isOp("/") || isOp("%")) {
      const op = (tokens[pos++] as { op: string }).op;
      const rhs = factor();
      if (op === "*") value *= rhs;
      else if (op === "/") value /= rhs;
      else value %= rhs;
    }
    return value;
  }

  function factor(): number {
    if (isOp("-")) {
      pos++;
      return -factor();
    }
    return power();
  }

  function power(): number {
    const base = primary();
    if (isOp("^")) {
      pos++;
      return Math.pow(base, factor());
    }
    return base;
  }

  function primary(): number {
    const t = peek();
    if (!t) throw new Error(`Unexpected end of formula "${expr}"`);

    if (t.kind === "number") {
      pos++;
      return t.value;
    }

    if (t.kind === "ident") {
      pos++;
      if (isOp("(")) {
        // Object.hasOwn guards against prototype-chain lookups.
        const fn = Object.hasOwn(FUNCTIONS, t.name) ? FUNCTIONS[t.name] : undefined;
        if (!fn) throw new Error(`Unknown function "${t.name}" in formula "${expr}"`);
        pos++; // consume '('
        const args: number[] = [];
        if (!isOp(")")) {
          args.push(expression());
          while (isOp(",")) {
            pos++;
            args.push(expression());
          }
        }
        if (!isOp(")")) throw new Error(`Missing ")" in formula "${expr}"`);
        pos++; // consume ')'
        return fn(...args);
      }
      if (!Object.hasOwn(vars, t.name))
        throw new Error(`Unknown variable "${t.name}" in formula "${expr}"`);
      const value = vars[t.name];
      if (typeof value !== "number")
        throw new Error(`Variable "${t.name}" is not a number in formula "${expr}"`);
      return value;
    }

    if (t.kind === "op" && t.op === "(") {
      pos++;
      const value = expression();
      if (!isOp(")")) throw new Error(`Missing ")" in formula "${expr}"`);
      pos++;
      return value;
    }

    throw new Error(`Unexpected token in formula "${expr}"`);
  }

  const result = expression();
  if (pos < tokens.length) throw new Error(`Trailing tokens in formula "${expr}"`);
  return result;
}

export type NumberFormat =
  | "integer"
  | "decimal"
  | "currency"
  | "percent"
  | "compact";

/**
 * Format a numeric value for display. Locale-aware: pass a BCP-47 locale (via
 * the widget prop or WidgetronProvider) to localize grouping/decimals. Falls
 * back to the runtime's default locale.
 */
export function formatValue(
  value: number,
  format: string = "integer",
  locale?: string,
): string {
  if (!Number.isFinite(value)) return "—";
  switch (format) {
    case "decimal":
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(value);
    case "currency":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2,
      }).format(value);
    case "percent":
      return (
        new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value) +
        " %"
      );
    case "compact":
      return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
    case "integer":
    default:
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
        value,
      );
  }
}
