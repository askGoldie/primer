/**
 * Narrative Content for Demo Walkthrough
 *
 * Contains industry-specific vocabulary and role-specific framing
 * for Hans Ruber's 6-part walkthrough of the Primer framework.
 *
 * All user-facing strings are referenced by i18n key and resolved at
 * render time via the `t()` helper. This allows the walkthrough to be
 * displayed in any supported locale.
 *
 * @see /docs/demo-site-user-journeys.md
 */

import { t } from "$lib/i18n/index.js";
import type {
  Industry,
  Locale,
  VisitorRole,
  TierLevel,
} from "$lib/types/index.js";

/**
 * Industry-specific character definitions
 */
export interface IndustryCharacters {
  companyName: string;
  companyType: string;
  marcus: {
    title: string;
    focus: string;
  };
  rachel: {
    title: string;
    focus: string;
  };
  james: {
    title: string;
    focus: string;
  };
  nina: {
    title: string;
    focus: string;
  };
  coreMetrics: string[];
}

/**
 * Get locale-aware character and company definitions for a given industry.
 *
 * Character names remain in English (they are proper names), but titles,
 * focus areas, and company descriptions are looked up from locale files.
 *
 * @param industry - The selected industry variant
 * @param locale - BCP 47 locale code (e.g. "en", "es", "zh")
 */
export function getIndustryCharacters(
  industry: Industry,
  locale: Locale,
): IndustryCharacters {
  const coreMetricsByIndustry: Record<Industry, string[]> = {
    construction: [
      "schedule adherence",
      "budget variance",
      "win rate",
      "incident frequency rate",
    ],
    healthcare: [
      "patient throughput",
      "cost per adjusted discharge",
      "contract renewal rate",
      "readmission rate",
    ],
    professional_services: [
      "project margin",
      "utilization rate",
      "win rate",
      "voluntary turnover",
    ],
    manufacturing: [
      "on-time delivery",
      "cost of quality",
      "win rate",
      "OSHA recordable incident rate",
    ],
    retail: [
      "same-store sales growth",
      "shrink rate",
      "labor cost percentage",
      "employee retention",
    ],
  };

  return {
    companyName: t(locale, `narrative.character.${industry}.company_name`),
    companyType: t(locale, `narrative.character.${industry}.company_type`),
    marcus: {
      title: t(locale, `narrative.character.${industry}.marcus.title`),
      focus: t(locale, `narrative.character.${industry}.marcus.focus`),
    },
    rachel: {
      title: t(locale, `narrative.character.${industry}.rachel.title`),
      focus: t(locale, `narrative.character.${industry}.rachel.focus`),
    },
    james: {
      title: t(locale, `narrative.character.${industry}.james.title`),
      focus: t(locale, `narrative.character.${industry}.james.focus`),
    },
    nina: {
      title: t(locale, `narrative.character.${industry}.nina.title`),
      focus: t(locale, `narrative.character.${industry}.nina.focus`),
    },
    coreMetrics: coreMetricsByIndustry[industry],
  };
}

/**
 * Role-specific framing text for each part
 */
export interface RoleFraming {
  intro: string;
  outro: string;
}

/**
 * Part content with role-specific framing.
 * Stores i18n key references rather than raw English strings.
 */
export interface NarrativePart {
  id: number;
  /** i18n key for the part title */
  titleKey: string;
  /** i18n key for the part subtitle */
  subtitleKey: string;
  /** i18n keys for main narrative content paragraphs */
  contentKeys: string[];
  /** What Hans shows the visitor in this part */
  visuals: string[];
  /** i18n key prefixes for role-specific framing */
  framingKeyPrefix: string;
}

/**
 * Hans's metric stack for display
 */
export interface HansMetric {
  name: string;
  tier: TierLevel;
  weight: number;
  threshold: {
    alarm: string;
    concern: string;
    content: string;
    effective: string;
    optimized: string;
  };
}

/**
 * Get Hans's metrics by industry.
 * Threshold descriptions are kept in English as they are quantitative/technical
 * reference data used for demo calibration examples.
 */
export function getHansMetrics(industry: Industry): HansMetric[] {
  // Industry-specific threshold definitions
  const thresholdsByIndustry: Record<Industry, HansMetric[]> = {
    construction: [
      {
        name: "Schedule Adherence",
        tier: "effective",
        weight: 30,
        threshold: {
          alarm: "Projects running 15%+ behind schedule",
          concern: "Projects running 8-15% behind schedule",
          content: "Projects within 5% of schedule",
          effective: "Projects consistently meeting or beating schedule",
          optimized: "Schedule buffer allows for scope additions without risk",
        },
      },
      {
        name: "Budget Variance",
        tier: "concern",
        weight: 25,
        threshold: {
          alarm: "Cost overruns exceeding 10%",
          concern: "Cost overruns between 5-10%",
          content: "Costs within 3% of budget",
          effective: "Consistent cost savings of 2-5%",
          optimized: "Systematic margin improvement quarter over quarter",
        },
      },
      {
        name: "Win Rate",
        tier: "effective",
        weight: 25,
        threshold: {
          alarm: "Win rate below 15%",
          concern: "Win rate between 15-25%",
          content: "Win rate between 25-35%",
          effective: "Win rate between 35-45%",
          optimized: "Win rate above 45% with selective bidding",
        },
      },
      {
        name: "Cash Position",
        tier: "concern",
        weight: 20,
        threshold: {
          alarm: "Less than 30 days operating capital",
          concern: "30-60 days operating capital",
          content: "60-90 days operating capital",
          effective: "90-120 days operating capital",
          optimized: "120+ days with investment optionality",
        },
      },
    ],
    healthcare: [
      {
        name: "Patient Throughput",
        tier: "content",
        weight: 25,
        threshold: {
          alarm: "Wait times exceeding 45 minutes consistently",
          concern: "Wait times between 30-45 minutes",
          content: "Wait times under 20 minutes",
          effective: "Same-day appointments available",
          optimized: "Predictive scheduling with minimal patient friction",
        },
      },
      {
        name: "Cost per Adjusted Discharge",
        tier: "effective",
        weight: 30,
        threshold: {
          alarm: "15%+ above regional benchmark",
          concern: "5-15% above regional benchmark",
          content: "Within 5% of regional benchmark",
          effective: "Below regional benchmark",
          optimized:
            "Top quartile cost efficiency with quality metrics maintained",
        },
      },
      {
        name: "Contract Renewal Rate",
        tier: "effective",
        weight: 25,
        threshold: {
          alarm: "Renewal rate below 70%",
          concern: "Renewal rate 70-80%",
          content: "Renewal rate 80-90%",
          effective: "Renewal rate above 90%",
          optimized: "Multi-year extensions with rate increases",
        },
      },
      {
        name: "Readmission Rate",
        tier: "concern",
        weight: 20,
        threshold: {
          alarm: "30-day readmission above 18%",
          concern: "30-day readmission 12-18%",
          content: "30-day readmission 8-12%",
          effective: "30-day readmission below 8%",
          optimized: "Readmission rate top decile with care coordination",
        },
      },
    ],
    professional_services: [
      {
        name: "Project Margin",
        tier: "effective",
        weight: 35,
        threshold: {
          alarm: "Average margin below 20%",
          concern: "Average margin 20-30%",
          content: "Average margin 30-40%",
          effective: "Average margin 40-50%",
          optimized: "Consistent 50%+ margin with premium positioning",
        },
      },
      {
        name: "Utilization Rate",
        tier: "concern",
        weight: 25,
        threshold: {
          alarm: "Billable utilization below 60%",
          concern: "Billable utilization 60-70%",
          content: "Billable utilization 70-80%",
          effective: "Billable utilization 80-85%",
          optimized: "Sustainable 85%+ with no burnout indicators",
        },
      },
      {
        name: "Win Rate",
        tier: "content",
        weight: 20,
        threshold: {
          alarm: "Proposal win rate below 20%",
          concern: "Proposal win rate 20-30%",
          content: "Proposal win rate 30-40%",
          effective: "Proposal win rate 40-50%",
          optimized: "Selective proposals with 50%+ conversion",
        },
      },
      {
        name: "Voluntary Turnover",
        tier: "effective",
        weight: 20,
        threshold: {
          alarm: "Annual turnover above 25%",
          concern: "Annual turnover 18-25%",
          content: "Annual turnover 12-18%",
          effective: "Annual turnover below 12%",
          optimized: "Turnover below 8% with intentional exits only",
        },
      },
    ],
    manufacturing: [
      {
        name: "On-Time Delivery",
        tier: "effective",
        weight: 30,
        threshold: {
          alarm: "OTD below 85%",
          concern: "OTD 85-92%",
          content: "OTD 92-96%",
          effective: "OTD 96-99%",
          optimized: "OTD 99%+ with buffer for rush orders",
        },
      },
      {
        name: "Cost of Quality",
        tier: "concern",
        weight: 25,
        threshold: {
          alarm: "CoQ above 4% of revenue",
          concern: "CoQ 2.5-4% of revenue",
          content: "CoQ 1.5-2.5% of revenue",
          effective: "CoQ below 1.5% of revenue",
          optimized: "Near-zero defects with proactive quality systems",
        },
      },
      {
        name: "Win Rate",
        tier: "content",
        weight: 20,
        threshold: {
          alarm: "Quote conversion below 25%",
          concern: "Quote conversion 25-35%",
          content: "Quote conversion 35-45%",
          effective: "Quote conversion 45-55%",
          optimized: "Selective quoting with 55%+ conversion",
        },
      },
      {
        name: "OSHA Recordable Rate",
        tier: "effective",
        weight: 25,
        threshold: {
          alarm: "TRIR above industry average",
          concern: "TRIR at industry average",
          content: "TRIR 20% below industry average",
          effective: "TRIR 50% below industry average",
          optimized: "Zero recordables for 12+ months",
        },
      },
    ],
    retail: [
      {
        name: "Same-Store Sales Growth",
        tier: "content",
        weight: 30,
        threshold: {
          alarm: "Comp sales declining 5%+",
          concern: "Comp sales flat to -5%",
          content: "Comp sales growth 0-3%",
          effective: "Comp sales growth 3-7%",
          optimized: "Comp sales growth 7%+ with margin expansion",
        },
      },
      {
        name: "Shrink Rate",
        tier: "effective",
        weight: 20,
        threshold: {
          alarm: "Shrink above 2.5% of sales",
          concern: "Shrink 1.5-2.5% of sales",
          content: "Shrink 1-1.5% of sales",
          effective: "Shrink below 1% of sales",
          optimized: "Shrink below 0.5% with systematic prevention",
        },
      },
      {
        name: "Labor Cost Percentage",
        tier: "concern",
        weight: 25,
        threshold: {
          alarm: "Labor above 22% of sales",
          concern: "Labor 19-22% of sales",
          content: "Labor 16-19% of sales",
          effective: "Labor 13-16% of sales",
          optimized: "Labor below 13% with service scores maintained",
        },
      },
      {
        name: "Employee Retention",
        tier: "effective",
        weight: 25,
        threshold: {
          alarm: "Annual turnover above 80%",
          concern: "Annual turnover 60-80%",
          content: "Annual turnover 40-60%",
          effective: "Annual turnover below 40%",
          optimized: "Turnover below 25% with career progression",
        },
      },
    ],
  };

  return thresholdsByIndustry[industry];
}

/**
 * The 6 parts of Hans's walkthrough, using i18n key references.
 */
export const NARRATIVE_PARTS: NarrativePart[] = [
  {
    id: 1,
    titleKey: "narrative.part.1.title",
    subtitleKey: "narrative.part.1.subtitle",
    contentKeys: [
      "narrative.part.1.content.0",
      "narrative.part.1.content.1",
      "narrative.part.1.content.2",
      "narrative.part.1.content.3",
    ],
    visuals: [
      "Hans's current composite score: 3.6 (Effective)",
      "Full metric stack with all five thresholds calibrated",
      "Two metrics showing Concern status with clear threshold definitions",
      "Weight distribution across all metrics",
    ],
    framingKeyPrefix: "narrative.part.1.framing",
  },
  {
    id: 2,
    titleKey: "narrative.part.2.title",
    subtitleKey: "narrative.part.2.subtitle",
    contentKeys: [
      "narrative.part.2.content.0",
      "narrative.part.2.content.1",
      "narrative.part.2.content.2",
      "narrative.part.2.content.3",
    ],
    visuals: [
      "Marcus's stack: two metrics fully calibrated, three in progress",
      "The threshold conversation captured in documentation",
      "Before/after: vague concerns vs. specific definitions",
    ],
    framingKeyPrefix: "narrative.part.2.framing",
  },
  {
    id: 3,
    titleKey: "narrative.part.3.title",
    subtitleKey: "narrative.part.3.subtitle",
    contentKeys: [
      "narrative.part.3.content.0",
      "narrative.part.3.content.1",
      "narrative.part.3.content.2",
      "narrative.part.3.content.3",
    ],
    visuals: [
      "Rachel's stack before: 50% weight on budget variance",
      "Rachel's stack after: rebalanced weights",
      "The recalculated composite score",
      "Documentation showing the weight change rationale",
    ],
    framingKeyPrefix: "narrative.part.3.framing",
  },
  {
    id: 4,
    titleKey: "narrative.part.4.title",
    subtitleKey: "narrative.part.4.subtitle",
    contentKeys: [
      "narrative.part.4.content.0",
      "narrative.part.4.content.1",
      "narrative.part.4.content.2",
      "narrative.part.4.content.3",
    ],
    visuals: [
      "Nina's score history: Concern for two cycles, then Content",
      "The self-inquiry filing with full rationale",
      "Before/after threshold definitions",
      "The approval record",
    ],
    framingKeyPrefix: "narrative.part.4.framing",
  },
  {
    id: 5,
    titleKey: "narrative.part.5.title",
    subtitleKey: "narrative.part.5.subtitle",
    contentKeys: [
      "narrative.part.5.content.0",
      "narrative.part.5.content.1",
      "narrative.part.5.content.2",
      "narrative.part.5.content.3",
    ],
    visuals: [
      "The peer inquiry filing with full documentation",
      "The metric dependency: lead quality → win rate",
      "Both possible resolutions explained",
      "The final resolution record",
    ],
    framingKeyPrefix: "narrative.part.5.framing",
  },
  {
    id: 6,
    titleKey: "narrative.part.6.title",
    subtitleKey: "narrative.part.6.subtitle",
    contentKeys: [
      "narrative.part.6.content.0",
      "narrative.part.6.content.1",
      "narrative.part.6.content.2",
      "narrative.part.6.content.3",
    ],
    visuals: [
      "Full dashboard view with all four leaders",
      "Composite scores and current tier designations",
      "Open inquiries and their status",
      "Score trends over the past two cycles",
    ],
    framingKeyPrefix: "narrative.part.6.framing",
  },
  {
    id: 7,
    titleKey: "narrative.part.7.title",
    subtitleKey: "narrative.part.7.subtitle",
    contentKeys: [
      "narrative.part.7.content.0",
      "narrative.part.7.content.1",
      "narrative.part.7.content.2",
      "narrative.part.7.content.3",
    ],
    visuals: [
      "Perpetual license explanation",
      "Source code delivery and infrastructure ownership",
      "Platform demonstration with 69-person org",
    ],
    framingKeyPrefix: "narrative.part.7.framing",
  },
];

/**
 * Get translated content paragraphs for a narrative part, with industry-specific
 * tokens substituted in.
 *
 * @param part - The narrative part definition
 * @param industry - The visitor's selected industry
 * @param locale - BCP 47 locale code
 * @returns Array of translated paragraph strings
 */
export function getPartContent(
  part: NarrativePart,
  industry: Industry,
  locale: Locale,
): string[] {
  const chars = getIndustryCharacters(industry, locale);
  const metrics = getHansMetrics(industry);

  // Find concern metrics for Hans's stack
  const concernMetrics = metrics.filter((m) => m.tier === "concern");
  const metric_concern_1 =
    concernMetrics[0]?.name.toLowerCase() || "first concern metric";
  const metric_concern_2 =
    concernMetrics[1]?.name.toLowerCase() || "second concern metric";

  const marcus_metrics = t(locale, `narrative.marcus_metrics.${industry}`);
  const nina_metric = t(locale, `narrative.nina_metric.${industry}`);

  return part.contentKeys.map((key) =>
    t(locale, key, {
      metric_concern_1,
      metric_concern_2,
      marcus_metrics,
      nina_metric,
      company_name: chars.companyName,
      company_type: chars.companyType,
    }),
  );
}

/**
 * Get role-specific framing text (intro and outro) for a narrative part.
 *
 * @param part - The narrative part definition
 * @param role - The visitor's selected role
 * @param locale - BCP 47 locale code
 * @returns Translated intro and outro framing strings
 */
export function getPartFraming(
  part: NarrativePart,
  role: VisitorRole,
  locale: Locale,
): RoleFraming {
  return {
    intro: t(locale, `${part.framingKeyPrefix}.${role}.intro`),
    outro: t(locale, `${part.framingKeyPrefix}.${role}.outro`),
  };
}
