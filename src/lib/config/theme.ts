/**
 * Theme Configuration for Primer
 *
 * This is the single configuration file that controls the entire visual identity.
 * License holders modify this file to rebrand the application.
 * One file change, one rebuild, full rebrand.
 *
 * @see /docs/primer-style-guide.md for complete documentation
 */

export const theme = {
  /**
   * Brand identity settings
   * - applicationName: The product name displayed throughout the UI
   * - descriptor: Tagline shown in formal contexts
   * - logoPath: SVG preferred, PNG accepted
   */
  brand: {
    applicationName: "Primer",
    companyName: "DavidPM",
    descriptor: "Your Goals. Your Code. Behind Your Firewall.",
    logoPath: "/logo.svg",
    faviconPath: "/favicon.ico",
  },

  /**
   * Typography settings
   * Primary: Inter (clean geometric sans-serif)
   * Monospace: JetBrains Mono (for scores, hex values, identifiers)
   */
  typography: {
    fontSans: "'Inter', system-ui, -apple-system, sans-serif",
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",
    fontImportUrl: "" /* fonts are self-hosted via @font-face in layout.css */,
  },

  /**
   * Color palette
   * Light mode base colors and accent colors
   */
  colors: {
    light: {
      // Base colors
      primary: "#22201C", // Headings, nav background, dominant text
      secondary: "#5C5044", // Body text, labels, subheadings
      surfaceLight: "#F2EDE4", // Page background
      surfaceMid: "#EDE6D9", // Cards, panels, inputs
      border: "#C8BFB0", // Dividers, outlines

      // Brand accents
      accent1: "#8B4E1E", // Cognac - primary CTA, active states, links
      accent1Light: "#D4A882", // Hover fills, tinted backgrounds
      accent2: "#3D5A3E", // Moss - tags, secondary highlights
      accent2Light: "#8FB890", // Tinted backgrounds
      accent3: "#2C4A6E", // Slate - editorial callouts, rare use
      accent3Light: "#8AAFD4", // Tinted backgrounds
    },

    /**
     * Dark mode surfaces and text
     */
    dark: {
      bg: "#1A1714", // Page background
      card: "#252118", // Cards, panels
      elevated: "#2E2A22", // Modals, dropdowns
      border: "#3D3830", // Dividers, outlines
      textPrimary: "#FFFFFF", // Headings, dominant text
      textSecondary: "#F0E8DC", // Body text, labels
    },

    /**
     * Tier state indicator colors
     * These are functional signals only - never use decoratively
     * Each color has a light mode and dark mode variant
     */
    indicators: {
      // Light mode values (WCAG AA compliant on surface colors)
      alarm: "#B03A2E",
      concern: "#7A4A00",
      content: "#6B6058",
      effective: "#2C6EA6",
      optimized: "#2A7A45",

      // Dark mode values (WCAG AA compliant on dark surfaces)
      alarmDark: "#F0877E",
      concernDark: "#F5A842",
      contentDark: "#A89E94",
      effectiveDark: "#6AAAD8",
      optimizedDark: "#5AAD78",
    },
  },

  /**
   * Tier labels (can be renamed by license holders)
   * These are the default English labels - translations are in i18n files
   */
  tierLabels: {
    alarm: "Alarm",
    concern: "Concern",
    content: "Content",
    effective: "Effective",
    optimized: "Optimized",
  },
} as const;

/**
 * Tier value mapping for composite score calculation
 * Alarm = 1, Concern = 2, Content = 3, Effective = 4, Optimized = 5
 */
export const TIER_VALUES = {
  alarm: 1,
  concern: 2,
  content: 3,
  effective: 4,
  optimized: 5,
} as const;

/**
 * Composite score ranges for determining overall tier
 */
export const COMPOSITE_RANGES = {
  alarm: { min: 1.0, max: 1.8 },
  concern: { min: 1.81, max: 2.6 },
  content: { min: 2.61, max: 3.4 },
  effective: { min: 3.41, max: 4.2 },
  optimized: { min: 4.21, max: 5.0 },
} as const;

/**
 * Type scale per style guide
 */
export const TYPE_SCALE = {
  hero: { size: "28px", weight: 500, tracking: "-0.02em" },
  pageHeading: { size: "22px", weight: 500, tracking: "-0.01em" },
  sectionHeading: { size: "18px", weight: 500, tracking: "0" },
  label: { size: "14px", weight: 500, tracking: "0" },
  body: { size: "14px", weight: 400, tracking: "0" },
  secondary: { size: "12px", weight: 400, tracking: "0" },
  eyebrow: { size: "10px", weight: 500, tracking: "0.08em" },
  mono: { size: "11px", weight: 400, tracking: "0" },
} as const;

export type TierName = keyof typeof TIER_VALUES;
export type Theme = typeof theme;
