import * as React from "react";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";
import { RotateCcw } from "@/lib/icons";

/* -------------------------------------------------------------------------- */
/* Profile context                                                            */
/* -------------------------------------------------------------------------- */

/** The reader's answers: `{ [questionId]: optionValue }`. */
export type Profile = Record<string, string>;

interface ProfileContextValue {
  profile: Profile;
  /** Whether the reader has answered at least one question. */
  answered: boolean;
  /** Commit a full set of answers (replaces the profile) and persist. */
  commit: (answers: Profile) => void;
  /** Clear the profile and persistence. */
  reset: () => void;
}

const noop = () => {};
const ProfileContext = React.createContext<ProfileContextValue>({
  profile: {},
  answered: false,
  commit: noop,
  reset: noop,
});

export interface ProfileProviderProps {
  children: React.ReactNode;
  /**
   * localStorage key for persistence. Omit to keep the profile in memory only
   * (e.g. previews). Give each dispensa its own key so profiles don't collide.
   */
  storageKey?: string;
}

function readStored(storageKey?: string): Profile {
  if (!storageKey || typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Profile) : {};
  } catch {
    return {};
  }
}

/**
 * ProfileProvider — holds the reader's profile for everything underneath (a
 * ProfileQuiz writes it; ProfileGate reads it). Mirrors how GlossaryProvider
 * shares terms across a whole course. Persists to localStorage when `storageKey`
 * is set, so the tailored view survives reloads.
 */
export function ProfileProvider({ children, storageKey }: ProfileProviderProps) {
  const [profile, setProfile] = React.useState<Profile>(() =>
    readStored(storageKey),
  );

  const commit = React.useCallback(
    (answers: Profile) => {
      setProfile(answers);
      if (storageKey && typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(answers));
        } catch {
          /* storage unavailable — keep the in-memory profile */
        }
      }
    },
    [storageKey],
  );

  const reset = React.useCallback(() => {
    setProfile({});
    if (storageKey && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    }
  }, [storageKey]);

  const value = React.useMemo<ProfileContextValue>(
    () => ({
      profile,
      answered: Object.keys(profile).length > 0,
      commit,
      reset,
    }),
    [profile, commit, reset],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  return React.useContext(ProfileContext);
}

/* -------------------------------------------------------------------------- */
/* ProfileGate (the show_if / data-show-if equivalent)                        */
/* -------------------------------------------------------------------------- */

/** Condition: `{ questionId: [acceptedValues] }`. */
export type ProfileCondition = Record<string, string[]>;

/** Does the profile satisfy the condition? Lenient on unanswered keys. */
export function profileMatches(
  condition: ProfileCondition,
  profile: Profile,
): boolean {
  return Object.entries(condition).every(
    ([key, values]) => !profile[key] || values.includes(profile[key]),
  );
}

export interface ProfileGateProps {
  /** Show children only when the profile matches, e.g. `{ level: ["beginner"] }`. */
  when: ProfileCondition;
  children: React.ReactNode;
  /** Optional content to render while the gate is closed. Default: nothing. */
  fallback?: React.ReactNode;
}

/**
 * ProfileGate — conditionally reveals its children based on the reader's
 * profile. The composable equivalent of dispensa's `show_if` / `data-show-if`:
 * untagged content is always visible; gated content stays hidden until the
 * ProfileQuiz has been answered and the profile matches. Lenient on unanswered
 * keys, so a partial profile never blanks the page.
 */
export function ProfileGate({ when, children, fallback = null }: ProfileGateProps) {
  const { profile, answered } = useProfile();
  const visible = answered && profileMatches(when, profile);
  return <>{visible ? children : fallback}</>;
}

ProfileGate.displayName = "ProfileGate";

/* -------------------------------------------------------------------------- */
/* ProfileQuiz                                                                */
/* -------------------------------------------------------------------------- */

export interface ProfileOption {
  /** Stored in the profile and matched by ProfileGate. */
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
}

export interface ProfileQuestion {
  /** Stable id used as the profile key and in ProfileGate conditions. */
  id: string;
  question: React.ReactNode;
  options: ProfileOption[];
}

export interface ProfileQuizLabels {
  /** Step indicator, e.g. "1 / 3". */
  step: (current: number, total: number) => React.ReactNode;
  /** Summary line after answering, given the joined choice labels. */
  summary: (choices: string) => React.ReactNode;
  /** Reset / re-answer control. */
  reset: React.ReactNode;
}

export const DEFAULT_PROFILE_QUIZ_LABELS: ProfileQuizLabels = {
  step: (current, total) => `${current} / ${total}`,
  summary: (choices) => `Tailored to you: ${choices}`,
  reset: "Change my answers",
};

export interface ProfileQuizProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** The 2-3 onboarding questions that tailor the rest of the page. */
  questions: ProfileQuestion[];
  /** Optional intro shown above the first question. */
  intro?: React.ReactNode;
  /** Customizable / translatable strings. */
  labels?: Partial<ProfileQuizLabels>;
}

function choiceLabels(questions: ProfileQuestion[], profile: Profile): string {
  return questions
    .map((q) => {
      const opt = q.options.find((o) => o.value === profile[q.id]);
      return opt && typeof opt.label === "string" ? opt.label : undefined;
    })
    .filter(Boolean)
    .join(" · ");
}

/**
 * ProfileQuiz — the signature personalization artifact: a short onboarding quiz
 * (one question at a time) that writes a profile to the surrounding
 * ProfileProvider. Pair it with ProfileGate blocks to tailor the rest of a
 * dispensa to the reader. Untagged content always shows, so the page still works
 * if the quiz is skipped. All copy is customizable/translatable via `labels`.
 */
export function ProfileQuiz({
  questions,
  intro,
  labels,
  className,
  ...props
}: ProfileQuizProps) {
  const l = useLabels("profileQuiz", DEFAULT_PROFILE_QUIZ_LABELS, labels);
  const { profile, answered, commit, reset } = useProfile();
  const [index, setIndex] = React.useState(0);
  const pending = React.useRef<Profile>({});

  // Returning readers (profile already set) land on the summary.
  const showSummary = answered;

  function pick(question: ProfileQuestion, value: string) {
    pending.current = { ...pending.current, [question.id]: value };
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      commit(pending.current);
    }
  }

  function handleReset() {
    pending.current = {};
    setIndex(0);
    reset();
  }

  return (
    <div
      data-slot="profile-quiz"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground shadow-wgt sm:p-6",
        className,
      )}
      {...props}
    >
      {showSummary ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {l.summary(choiceLabels(questions, profile))}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-input px-3 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3.5" />
            {l.reset}
          </button>
        </div>
      ) : (
        questions.map((q, qi) =>
          qi === index ? (
            <div key={q.id} className="motion-safe:animate-wgt-fade-up">
              {intro != null && qi === 0 && (
                <p className="mb-3 text-sm text-muted-foreground">{intro}</p>
              )}
              <p className="flex items-baseline gap-2 font-display text-lg font-semibold leading-snug">
                <span className="font-mono text-xs font-bold uppercase tracking-wide text-primary">
                  {l.step(qi + 1, questions.length)}
                </span>
                {q.question}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {q.options.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => pick(q, o.value)}
                    className="flex min-h-11 w-full flex-col items-start gap-0.5 rounded-md border border-input bg-background px-4 py-2.5 text-left text-sm transition-colors outline-none hover:border-ring hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    <span className="font-medium text-foreground">{o.label}</span>
                    {o.description != null && (
                      <span className="text-muted-foreground">
                        {o.description}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : null,
        )
      )}
    </div>
  );
}

ProfileQuiz.displayName = "ProfileQuiz";
