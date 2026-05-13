/**
 * Onboarding Path Definitions
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TO REMOVE THE ONBOARDING TAB ENTIRELY:
 *   1. Delete the folder  src/lib/components/onboarding/
 *   2. Delete the folder  src/routes/app/onboarding/
 *   3. Remove the nav entry in src/routes/app/+layout.svelte marked
 *      `// ── ONBOARDING NAV (removable) ──`
 *   4. Delete the `onboarding.*` keys from every file in src/lib/i18n/
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Primer onboarding is activation, not persuasion. By the time a user hits
 * this tab they've already signed in — they've seen the marketing pages and
 * decided to try Primer. The job of the paths below is to get them from
 * "I bought this" to "we're running it," and to model the core Primer
 * promise on every screen: everything here is a draft, and the source code
 * is yours.
 *
 * Three paths, each ending in an artifact:
 *
 *   1. "We're starting from scratch"
 *      → ends with three metrics drafted
 *
 *   2. "We've tried goals and they haven't stuck"
 *      (merges the "going through the motions" and "tried before, burned"
 *      personas — both have the same emotional shape: frustration + scars)
 *      → ends with a shorter, honest goal list and a 30-day reset plan
 *
 *   3. "I know what I'm doing — help me make this ours"
 *      (pivots away from persuasion; the user already bought in. Focuses
 *      on editability, composition with existing stacks, and exec comms.)
 *      → ends with something personalized and a shareable brief
 *
 * Every path converges on a shared "roll this out to your team" next-step
 * card — see ROLLOUT_NEXT_STEP below — because all three personas ask the
 * same question once they finish: "okay, now how do I get everyone else
 * doing this?"
 *
 * All strings are i18n keys; the copy lives in src/lib/i18n/*.json under
 * the `onboarding.*` namespace so it can be translated or rewritten in
 * the customer's own voice without touching component code.
 */

/** A single step inside an onboarding path. */
export interface OnboardingStep {
  /** i18n key for the step heading */
  titleKey: string;
  /** i18n key for the step body copy */
  bodyKey: string;
  /**
   * Optional call-to-action that deep-links into the app
   * (e.g. `/app/goals`). When set, the step renders a button
   * that navigates there after the user finishes reading.
   */
  ctaHref?: string;
  /** i18n key for the CTA button label. Required if ctaHref is set. */
  ctaLabelKey?: string;
}

/** A full onboarding path, displayed as a card on the landing view. */
export interface OnboardingPath {
  /** Stable identifier used as a svelte `{#each}` key */
  id: "scratch" | "tried-before" | "customize";
  /** i18n key for the path title shown on the selector card */
  titleKey: string;
  /** i18n key for the one-sentence description on the selector card */
  descriptionKey: string;
  /** i18n key for the selector card CTA button */
  ctaKey: string;
  /** i18n key for the duration + outcome hint (e.g. "~15 min · ends with drafted metrics") */
  durationKey: string;
  /** Steps the user walks through once they enter the path */
  steps: OnboardingStep[];
  /**
   * Tailwind accent class used to tint the selector card. Keeping this
   * in data (rather than inside the component) lets customers re-theme
   * each path without editing Svelte.
   */
  accentClass: string;
}

/**
 * Path 1 — "We're starting from scratch"
 *
 * Activation path for orgs rolling out any goal framework for the first
 * time. Four steps, fast, ends with three metrics drafted in the goal
 * builder. Emphasizes that the tier model, its labels, and even the
 * starter templates are all drafts the user is meant to edit.
 */
const scratchPath: OnboardingPath = {
  id: "scratch",
  titleKey: "onboarding.path1.title",
  descriptionKey: "onboarding.path1.description",
  ctaKey: "onboarding.path1.cta",
  durationKey: "onboarding.path1.duration",
  accentClass: "border-accent1/40 bg-accent1/5",
  steps: [
    {
      titleKey: "onboarding.path1.step1.title",
      bodyKey: "onboarding.path1.step1.body",
    },
    {
      titleKey: "onboarding.path1.step2.title",
      bodyKey: "onboarding.path1.step2.body",
      ctaHref: "/app/settings",
      ctaLabelKey: "onboarding.path1.step2.cta",
    },
    {
      titleKey: "onboarding.path1.step3.title",
      bodyKey: "onboarding.path1.step3.body",
      ctaHref: "/app/goals",
      ctaLabelKey: "onboarding.path1.step3.cta",
    },
    {
      titleKey: "onboarding.path1.step4.title",
      bodyKey: "onboarding.path1.step4.body",
    },
  ],
};

/**
 * Path 2 — "We've tried goals and they haven't stuck"
 *
 * Reset path for orgs with scars. Merges two personas the onboarding
 * previously split: "going through the motions" (disengagement) and
 * "tried before, it failed" (burned). Both have the same entry point —
 * frustration — and benefit from the same diagnosis-then-reset arc.
 * Ends with a deletion exercise and a 30-day plan.
 */
const triedBeforePath: OnboardingPath = {
  id: "tried-before",
  titleKey: "onboarding.path2.title",
  descriptionKey: "onboarding.path2.description",
  ctaKey: "onboarding.path2.cta",
  durationKey: "onboarding.path2.duration",
  accentClass: "border-amber-500/40 bg-amber-500/5",
  steps: [
    {
      titleKey: "onboarding.path2.step1.title",
      bodyKey: "onboarding.path2.step1.body",
    },
    {
      titleKey: "onboarding.path2.step2.title",
      bodyKey: "onboarding.path2.step2.body",
    },
    {
      titleKey: "onboarding.path2.step3.title",
      bodyKey: "onboarding.path2.step3.body",
      ctaHref: "/app/goals",
      ctaLabelKey: "onboarding.path2.step3.cta",
    },
    {
      titleKey: "onboarding.path2.step4.title",
      bodyKey: "onboarding.path2.step4.body",
    },
  ],
};

/**
 * Path 3 — "I know what I'm doing — help me make this ours"
 *
 * Power-user path. Pivots away from the old "why is this better" framing
 * (the user already bought in — persuasion is the marketing site's job)
 * to customization and exec communication. Ends with the user having
 * personalized at least one editable surface and holding a short brief
 * they can adapt for their leadership meeting.
 */
const customizePath: OnboardingPath = {
  id: "customize",
  titleKey: "onboarding.path3.title",
  descriptionKey: "onboarding.path3.description",
  ctaKey: "onboarding.path3.cta",
  durationKey: "onboarding.path3.duration",
  accentClass: "border-emerald-500/40 bg-emerald-500/5",
  steps: [
    {
      titleKey: "onboarding.path3.step1.title",
      bodyKey: "onboarding.path3.step1.body",
    },
    {
      titleKey: "onboarding.path3.step2.title",
      bodyKey: "onboarding.path3.step2.body",
    },
    {
      titleKey: "onboarding.path3.step3.title",
      bodyKey: "onboarding.path3.step3.body",
      ctaHref: "/app/settings",
      ctaLabelKey: "onboarding.path3.step3.cta",
    },
    {
      titleKey: "onboarding.path3.step4.title",
      bodyKey: "onboarding.path3.step4.body",
    },
  ],
};

/** Ordered list of all onboarding paths, consumed by the landing selector. */
export const ONBOARDING_PATHS: readonly OnboardingPath[] = [
  scratchPath,
  triedBeforePath,
  customizePath,
];

/**
 * Shared "next step" rendered at the end of every path.
 *
 * All three personas converge on the same question once the path is
 * finished: "how do I get everyone else doing this?". Rather than
 * duplicating that content across three step arrays, we render it once
 * on the completion screen in PathWalkthrough.
 */
export const ROLLOUT_NEXT_STEP = {
  titleKey: "onboarding.rollout.title",
  bodyKey: "onboarding.rollout.body",
  ctaHref: "/app/admin",
  ctaLabelKey: "onboarding.rollout.cta",
} as const;

/**
 * Look up a path by id. Returns `undefined` for unknown ids so callers
 * can decide whether to fall back to the selector view or render a 404.
 */
export function getOnboardingPath(id: string): OnboardingPath | undefined {
  return ONBOARDING_PATHS.find((p) => p.id === id);
}
