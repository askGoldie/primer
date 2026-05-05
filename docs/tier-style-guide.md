# DavidPM Brand Style Guide

## Primer - Your Goals. Your Code. Behind Your Firewall.

Version 1.0

---

## Brand Identity

### Product name

**Primer**

The product is called Primer. One word, title case, no tagline required in logotype contexts.

### Full descriptor

**Your Goals. Your Code. Behind Your Firewall.**

### Why Primer

Most goal systems share a naming problem: they describe structure without describing philosophy. OKRs tell you the format. EOS tells you the operating model. Neither names the motivational premise at the center of the system.

---

## Typography

### Primary typeface: Inter

Inter is a clean geometric sans-serif with exceptional legibility at small sizes. It covers the full weight range the system requires and is available via Google Fonts.

```
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

Use weights **400 (regular)** and **500 (medium)** only. Weights 600 and above read heavy against the warm surfaces of this palette and should not be used.

### Monospace typeface: JetBrains Mono

Used for composite scores, hex values, metric identifiers, and code references. JetBrains Mono has a slight warmth that sits better against the palette than neutral options like Fira Code.

```
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### No serif typeface

The editorial register of this brand comes from color, spacing, and restraint -- not from a serif face. A second type system adds maintenance burden without proportional gain at this product's scale.

### Type scale

| Size      | Weight | Tracking | Usage                                                        |
| --------- | ------ | -------- | ------------------------------------------------------------ |
| 28px      | 500    | -0.02em  | Wordmark, hero display only                                  |
| 22px      | 500    | -0.01em  | Page headings                                                |
| 18px      | 500    | 0        | Section headings, card titles                                |
| 14px      | 500    | 0        | Labels, subheadings                                          |
| 14px      | 400    | 0        | Body text                                                    |
| 12px      | 400    | 0        | Secondary text, metadata                                     |
| 10px      | 500    | +0.08em  | Eyebrow labels, section markers. ALL CAPS only at this size. |
| 11px mono | 400    | 0        | Composite scores, hex values, identifiers                    |

### Type rules

Sentence case everywhere except 10px eyebrow labels, which use ALL CAPS with tracked spacing.

Never use bold (500) and regular (400) at the same size within the same visual block. Weight difference alone does not create sufficient hierarchy -- pair weight change with size change.

Line height for body text: 1.6. Line height for headings: 1.15.

---

## Color

### Design philosophy

The palette is built around one structural constraint: the five tier state indicator colors (Alarm through Optimized) are functional signals, not brand colors. They must never be used decoratively. The brand palette must be complete enough that no designer or developer reaches for red or green to add visual interest.

Each brand accent and each indicator color occupies a distinct hue family. Isolation is structural, not disciplinary.

---

### Light mode palette

#### Base

| Name          | Hex       | Usage                                                                              |
| ------------- | --------- | ---------------------------------------------------------------------------------- |
| Primary       | `#22201C` | Headings, nav background, dominant text                                            |
| Secondary     | `#5C5044` | Body text, labels, subheadings                                                     |
| Muted         | `#5C5044` | Same value as Secondary. Use for timestamps and metadata only. See contrast rules. |
| Surface light | `#F2EDE4` | Page background                                                                    |
| Surface mid   | `#EDE6D9` | Cards, panels, inputs                                                              |
| Border        | `#C8BFB0` | Dividers, outlines                                                                 |

Muted shares the Secondary value intentionally. The previous muted color (#6B6058) was restricted to large text only due to contrast limitations. Using Secondary as muted eliminates a color with restricted usage and simplifies the system without visual loss.

#### Brand accents

| Name              | Hex       | Usage                                                                                                                      |
| ----------------- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| Accent 1 / Cognac | `#8B4E1E` | Primary CTA, active states, links. Used most frequently.                                                                   |
| Cognac light      | `#D4A882` | Hover fills and tinted backgrounds behind Accent 1 elements. Background use only -- never as text color on light surfaces. |
| Accent 2 / Moss   | `#3D5A3E` | Tags, secondary highlights, supporting emphasis. Used regularly.                                                           |
| Moss light        | `#8FB890` | Tinted backgrounds behind Accent 2 elements. Background use only.                                                          |
| Accent 3 / Slate  | `#2C4A6E` | Editorial callouts, pull quotes, special moments. Rare use.                                                                |
| Slate light       | `#8AAFD4` | Tinted backgrounds behind Accent 3 elements. Background use only.                                                          |

Cognac was chosen over pure ochre as the dominant accent because ochre sits too close in hue to the Concern indicator (amber). Cognac is a deeper burnt orange that creates sufficient hue distance from the indicator while maintaining the leather executive planner warmth of Direction C.

Moss was chosen as Accent 2 because it reads as earthy and on-brand while occupying a completely different hue family from the Optimized green indicator. They share a green parent but Moss reads as a surface color, not a status signal.

Slate as Accent 3 is the rarest use. Its cool temperature creates considered contrast against the warm base palette and is reserved for moments where editorial weight is intentional.

---

### Dark mode palette

#### Surfaces

| Name          | Hex       | Usage              |
| ------------- | --------- | ------------------ |
| Dark bg       | `#1A1714` | Page background    |
| Dark card     | `#252118` | Cards, panels      |
| Dark elevated | `#2E2A22` | Modals, dropdowns  |
| Dark border   | `#3D3830` | Dividers, outlines |

#### Text

| Name           | Hex       | Usage                                                                    |
| -------------- | --------- | ------------------------------------------------------------------------ |
| Text primary   | `#FFFFFF` | Headings, dominant text on dark surfaces                                 |
| Text secondary | `#F0E8DC` | Body text, labels on dark surfaces                                       |
| Text muted     | `#F0E8DC` | Same value as Text secondary. Same restricted usage as light mode muted. |

White as primary text in dark mode was chosen over a tinted off-white because the contrast gain on the dark warm surfaces is significant and the cooler white creates useful visual tension against the warm backgrounds, reinforcing the editorial register.

#### Dark mode accent usage

The dark variants of the brand accents (Cognac #8B4E1E, Moss #3D5A3E, Slate #2C4A6E) all fail WCAG on dark surfaces. In dark mode, always use the light variants:

| Light mode accent | Dark mode equivalent   |
| ----------------- | ---------------------- |
| Cognac `#8B4E1E`  | Cognac light `#D4A882` |
| Moss `#3D5A3E`    | Moss light `#8FB890`   |
| Slate `#2C4A6E`   | Slate light `#8AAFD4`  |

---

### Tier state indicators

These colors are functional signals only. They may not be used for brand decoration, data visualization, or any purpose other than communicating tier state.

#### Light mode indicators

| Tier      | Hex       | WCAG on Surface light | WCAG on Surface mid |
| --------- | --------- | --------------------- | ------------------- |
| Alarm     | `#B03A2E` | AA (5.16)             | AA (4.85)           |
| Concern   | `#7A4A00` | AA (6.42)             | AA (6.03)           |
| Content   | `#6B6058` | AA (5.24)             | AA (4.92)           |
| Effective | `#2C6EA6` | AA (4.63)             | AA Large (4.35)     |
| Optimized | `#2A7A45` | AA (4.54)             | AA Large (4.26)     |

Note on Concern: amber is structurally difficult to pass full AA at readable saturation. The selected value (#7A4A00) shifts toward amber-brown to achieve AA on light surfaces. It reads clearly as a warning signal in context.

#### Dark mode indicators

| Tier      | Hex       | WCAG on Dark bg | WCAG on Dark card |
| --------- | --------- | --------------- | ----------------- |
| Alarm     | `#F0877E` | AAA (7.20)      | AA (6.47)         |
| Concern   | `#F5A842` | AAA (8.98)      | AAA (8.07)        |
| Content   | `#A89E94` | AA (6.79)       | AA (6.10)         |
| Effective | `#6AAAD8` | AAA (7.10)      | AA (6.38)         |
| Optimized | `#5AAD78` | AA (6.53)       | AA (5.87)         |

---

## Contrast rules for implementation

These rules address the most common errors in implementation. They are ordered by failure frequency.

### Rule 1: Never use dark accent colors as text on dark backgrounds

Cognac (#8B4E1E), Moss (#3D5A3E), and Slate (#2C4A6E) all fail WCAG on dark surfaces. In dark mode, switch to their light variants. This must be enforced at the Tailwind config level using CSS variable pairs so the override is automatic and cannot be forgotten at the component level.

```css
/* tailwind.config: define as paired CSS variables */
--color-cognac: #8b4e1e;
--color-cognac-on-dark: #d4a882;
```

```html
<!-- Component usage -->
<span class="text-[var(--color-cognac)] dark:text-[var(--color-cognac-on-dark)]"></span>
```

### Rule 2: Never use light accent colors as text on light backgrounds

Cognac light (#D4A882), Moss light (#8FB890), and Slate light (#8AAFD4) all fail WCAG as text colors on light surfaces. They exist as background fills only. When used as a background, pair exclusively with Primary text (#22201C).

```html
<!-- CORRECT: light accent as fill, dark text -->
<div class="bg-cognac-light text-primary">
	<!-- WRONG: light accent as text -->
	<div class="text-cognac-light"></div>
</div>
```

### Rule 3: Dark accent backgrounds require light text, never Primary

When Cognac (#8B4E1E), Moss (#3D5A3E), or Slate (#2C4A6E) are used as backgrounds (buttons, badges, tags), text must be Surface light (#F2EDE4) or white. Primary (#22201C) fails on all three accent backgrounds -- contrast drops below 2.5. This is the most common button label error.

```html
<!-- CORRECT -->
<button class="bg-cognac text-surface-light">View inquiry</button>

<!-- WRONG -->
<button class="bg-cognac text-primary">View inquiry</button>
```

### Rule 4: Indicator colors in dark mode require explicit dark: overrides

The saturated indicator values used in light mode all fail or barely pass on dark surfaces. Every indicator color reference in component code must include a dark mode override to its light variant. Define indicator pairs in the Tailwind config as CSS variables to make this automatic.

```css
--tier-alarm: #b03a2e;
--tier-alarm-dark: #f0877e;
--tier-concern: #7a4a00;
--tier-concern-dark: #f5a842;
--tier-content: #6b6058;
--tier-content-dark: #a89e94;
--tier-effective: #2c6ea6;
--tier-effective-dark: #6aaad8;
--tier-optimized: #2a7a45;
--tier-optimized-dark: #5aad78;
```

### Rule 5: Nav background only accepts inverse text

The Primary color (#22201C) is used as the nav background. On this background, use only Text primary inverse (#FFFFFF or #F0E8DC) or Cognac light (#D4A882). The dark accent colors all fail on the nav background. Cognac (#8B4E1E) has a contrast ratio of 2.48 against Primary -- it is invisible.

```html
<!-- CORRECT -->
<nav class="bg-primary">
	<span class="text-white">Dashboard</span>
	<span style="color: #B8A898">Leaders</span>

	<!-- WRONG -->
	<nav class="bg-primary">
		<span class="text-cognac">Active link</span>
	</nav>
</nav>
```

### Rule 6: Muted text is restricted usage

Muted shares the Secondary value (#5C5044 light, #F0E8DC dark). It is a semantic role, not a separate color. Reserve muted for timestamps, filing dates, and tertiary metadata. Never use it for body copy, error messages, or labels that carry operational meaning. If information is important enough to display, it warrants Secondary or Primary.

### Rule 7: Safe combinations reference

Memorize these. They never require contrast checking.

**Light mode**

| Text      | Background              | Ratio | Grade |
| --------- | ----------------------- | ----- | ----- |
| `#22201C` | `#F2EDE4` Surface light | 13.95 | AAA   |
| `#22201C` | `#EDE6D9` Surface mid   | 13.10 | AAA   |
| `#5C5044` | `#F2EDE4` Surface light | 6.70  | AA    |
| `#F2EDE4` | `#22201C` Primary/nav   | 13.95 | AAA   |
| `#F2EDE4` | `#8B4E1E` Cognac        | 5.62  | AA    |
| `#F2EDE4` | `#3D5A3E` Moss          | 6.60  | AA    |
| `#F2EDE4` | `#2C4A6E` Slate         | 7.79  | AAA   |

**Dark mode**

| Text                   | Background          | Ratio | Grade |
| ---------------------- | ------------------- | ----- | ----- |
| `#FFFFFF`              | `#1A1714` Dark bg   | 17.85 | AAA   |
| `#F0E8DC`              | `#1A1714` Dark bg   | 14.69 | AAA   |
| `#F0E8DC`              | `#252118` Dark card | 13.20 | AAA   |
| `#D4A882` Cognac light | `#1A1714` Dark bg   | 8.26  | AAA   |
| `#8FB890` Moss light   | `#1A1714` Dark bg   | 8.01  | AAA   |
| `#8AAFD4` Slate light  | `#1A1714` Dark bg   | 7.79  | AAA   |

---

## Voice and tone

The brand voice is how a trusted senior colleague speaks: direct, unhurried, operationally specific. It does not perform warmth and does not perform authority. It assumes the reader is intelligent and time-constrained.

No em dashes in customer-facing copy.

Sentence case everywhere except ALL CAPS eyebrow labels.

The default tier names (Alarm, Concern, Content, Effective, Optimized) are capitalized as proper nouns within the system's vocabulary. License holders who rename the tiers should apply the same capitalization convention to their chosen labels — they function as status designations, not adjectives.

---

## White-label theming for license holders

### The source code is yours. Modify what you don't like.

You could build this yourself. You're busy running your business. Primer is a starting point — a foundation you can adapt to fit your organization, your culture, and your vocabulary.

License holders purchase the source code and deploy it on their own infrastructure under their own brand. Everything documented in this guide is a default, not a mandate. Every color, typeface, product name, and tier label ships as a configurable value. The purchaser replaces values and rebuilds. No component code changes are required for a complete rebrand.

This section documents what is configurable, what the admin dashboard exposes, and what constraints the theming system enforces to prevent deployments from shipping broken UIs.

---

### The configuration file

All theme values live in `/config/theme.ts`. This is the only file a license holder needs to touch for a complete rebrand. The file is structured to mirror the sections of this style guide: brand identity, typography, base colors, accent colors, and indicator colors.

```ts
// /config/theme.ts

export const theme = {
	brand: {
		applicationName: 'Primer',
		descriptor: 'Your Goals. Your Code. Behind Your Firewall.',
		logoPath: '/static/logo.svg', // SVG preferred, PNG accepted
		faviconPath: '/static/favicon.ico'
	},

	typography: {
		fontSans: "'Inter', system-ui, -apple-system, sans-serif",
		fontMono: "'JetBrains Mono', 'Fira Code', monospace",
		// Google Fonts import URL -- replace with your chosen font's import
		fontImportUrl:
			'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono&display=swap'
	},

	colors: {
		light: {
			primary: '#22201C',
			secondary: '#5C5044',
			surfaceLight: '#F2EDE4',
			surfaceMid: '#EDE6D9',
			border: '#C8BFB0',
			accent1: '#8B4E1E', // Cognac -- dominant accent
			accent1Light: '#D4A882',
			accent2: '#3D5A3E', // Moss -- supporting accent
			accent2Light: '#8FB890',
			accent3: '#2C4A6E', // Slate -- rare accent
			accent3Light: '#8AAFD4'
		},
		dark: {
			bg: '#1A1714',
			card: '#252118',
			elevated: '#2E2A22',
			border: '#3D3830',
			textPrimary: '#FFFFFF',
			textSecondary: '#F0E8DC'
		},
		indicators: {
			// Light mode values
			alarm: '#B03A2E',
			concern: '#7A4A00',
			content: '#6B6058',
			effective: '#2C6EA6',
			optimized: '#2A7A45',
			// Dark mode values -- must be set as paired values
			alarmDark: '#F0877E',
			concernDark: '#F5A842',
			contentDark: '#A89E94',
			effectiveDark: '#6AAAD8',
			optimizedDark: '#5AAD78'
		}
	}
};
```

The build process reads this file, generates CSS custom properties, and injects them into the Tailwind config. One file change, one rebuild, full rebrand.

---

### Renaming the product

You can call your deployment whatever you want. "Primer" is a default label, not a brand requirement.

The `brand.applicationName` field in `theme.ts` controls the name displayed throughout the application. Set it to your organization's name, an internal project name, or any label that fits your culture. "Meridian Ops," "Leadership Health," "The Pulse" — whatever makes sense for your team.

The `brand.descriptor` field controls the subtitle that appears in formal contexts. Replace "Your Goals. Your Code. Behind Your Firewall." with your own framing or leave it blank.

---

### Renaming the tier labels

The five tier names — Alarm, Concern, Content, Effective, Optimized — are configurable strings in the locale files, not fixed product vocabulary.

If "Alarm" feels too clinical for your culture, rename it. If your team responds better to "Crisis / Caution / Stable / Strong / Peak" or "Red / Yellow / Neutral / Blue / Green" or any other vocabulary, change the labels in `/src/lib/i18n/en.json`:

```json
{
	"tier.alarm": "Crisis",
	"tier.concern": "Caution",
	"tier.content": "Stable",
	"tier.effective": "Strong",
	"tier.optimized": "Peak"
}
```

The five-tier structure and scoring logic remain fixed. The labels are yours to define.

When renaming tier labels, also update the indicator colors in `theme.ts` if your new vocabulary carries different color associations. "Red / Yellow / Neutral / Blue / Green" implies a traffic-light palette that differs from the defaults. The theming system does not enforce semantic alignment between labels and colors — that coherence is the license holder's responsibility.

---

### The admin dashboard

The admin dashboard exposes every value in `theme.ts` through a visual interface. It is intended for license holders who want to make branding changes without touching config files directly. Changes made in the dashboard write back to `theme.ts` and trigger a rebuild notification.

#### Dashboard sections

**Brand identity**

Fields: Application name, full descriptor, logo upload (SVG/PNG), favicon upload. The application name replaces every instance of "Primer" in the UI. The full descriptor replaces "Your Goals. Your Code. Behind Your Firewall." in the nav subtitle and any formal reference contexts.

**Typography**

Fields: Sans-serif font stack (free text), monospace font stack (free text), Google Fonts import URL. A live preview renders sample text in the selected fonts across all seven type scale sizes immediately on input. The dashboard does not validate that the font URL is reachable -- the license holder is responsible for ensuring their chosen fonts are available in their deployment environment.

**Base colors (light mode)**

Fields: one color picker per named token. Primary, Secondary, Surface light, Surface mid, Border. Each picker shows the hex value, a contrast preview against the two surface colors, and a WCAG grade badge. If a selected color would fail AA against its paired surface, the dashboard displays a warning and blocks save.

**Accent colors**

Fields: one color picker per accent pair (dark value and light value). Accent 1, Accent 2, Accent 3. The dashboard shows the dark value as a swatch on the light surface preview and the light value as a swatch on the dark surface preview. Contrast ratios are shown for both. The dashboard warns if the dark value fails on its dark surface or if the light value fails on its light surface.

The dashboard also checks accent colors against indicator hue families and warns -- but does not block -- if a chosen accent sits within 30 degrees of an indicator hue on the color wheel. This warning reads: "This accent color is close in hue to the [Concern/Alarm/Optimized] indicator. Review in context before deploying."

**Dark mode surfaces**

Fields: Dark bg, Dark card, Dark elevated, Dark border. Same picker interface as base colors.

**Tier state indicators**

Fields: one color pair per tier state (light mode value and dark mode value). The indicator section includes more friction than other sections by design. Changing indicator colors affects the operational meaning of every status display in the application. The dashboard requires the license holder to confirm a modal before saving indicator changes: "Indicator colors communicate operational health states to every user of your deployment. Confirm that your chosen colors are visually distinct from each other and from your brand accents before saving."

The dashboard enforces a minimum contrast of AA on the light surface for all five light mode indicator values and AA on the dark card for all five dark mode indicator values. Values that fail are blocked from saving.

---

### What the dashboard does not expose

**Type scale sizes and weights** are not configurable in the dashboard. Changing font sizes requires editing the Tailwind config directly. This restriction prevents deployments from shipping with type hierarchies that break layout components.

**Component structure and layout** are not configurable in the dashboard. The admin dashboard is a theming tool, not a layout editor.

**The five-tier structure** is the product. The numeric mapping (1 through 5) and the scoring logic are fixed in application code. What you call each tier and what color you assign it are entirely your choice.

---

### Theming constraints the system enforces automatically

These constraints run at build time and block deployment if violated. They are not advisory.

**Contrast enforcement.** The build process runs contrast checks on every text/background combination defined in the theme config. Any combination that falls below AA for body text sizes blocks the build and outputs a list of failing pairs with their ratios and the minimum hex adjustment needed to pass.

**Indicator isolation check.** The build process checks each brand accent against each indicator color. If any accent and indicator share a hue within 20 degrees and have similar lightness (within 15 L\* in CIELAB), the build warns. This check does not block -- it outputs a warning that the license holder must acknowledge before the build completes.

**Dark mode pair completeness.** Every accent color defined in the light palette must have a corresponding dark mode value defined. Missing pairs block the build.

**Font availability.** The build process does not validate font URLs, but the application's first-run check pings the font import URL and logs a warning to the admin dashboard if the fonts are unreachable.

---

### Guidance for license holders replacing the default palette

The defaults in this guide represent a specific aesthetic: warm neutrals, leather executive planner register, editorial authority. License holders are not expected to preserve this aesthetic. The theming system has no opinion about what colors the license holder chooses, only that the choices meet accessibility standards.

When replacing the palette entirely, the most common error is treating the indicator colors as changeable brand elements. They are not. The indicator colors are the product's primary data display layer. A license holder who sets their brand accent to red and then also uses red for Alarm has broken the application's ability to communicate operational state. The dashboard warns against this. The contrast enforcement catches some of it. The rest is the license holder's responsibility.

The second most common error is setting a dominant accent that conflicts with the Concern indicator in dark mode. Amber and orange are popular brand colors. The Concern indicator in dark mode is #F5A842. Any brand accent in the orange-to-amber range will create ambiguity at the most critical status in the system -- the one that signals a leader's operation is trending toward failure. Choose a dominant accent in a different hue family, or adjust the Concern dark mode indicator far enough from the chosen accent that the two are unambiguously distinct.

---

## What this system is not

The palette, typography, and indicator system described here are the complete brand vocabulary. There are no additional accent colors to be added. There are no exceptions to the indicator isolation rule. The editorial register comes from how these elements are used together -- restraint, whitespace, and type weight -- not from additional visual complexity.

When in doubt, remove.
