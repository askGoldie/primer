# Primer: Multilingual Implementation Spec

## Context A (Demo Site and Authenticated Experience)

### DavidPM | primer.company

---

## Scope and Rationale

The Primer demo site at primer.company is the primary sales and delivery surface for a perpetual source code license. The licensed product deploys on customer infrastructure with no dependency on DavidPM systems. There is no hosted data, no ongoing session, and no customer data stored by DavidPM beyond what is required to complete the purchase transaction and deliver the download.

This scope eliminates the primary complexity of multilingual deployments: localized data privacy obligations. DavidPM's data exposure is limited to the purchase transaction (governed by Stripe's compliance infrastructure) and the account record (email, name, license ID). Purchase transaction compliance follows Stripe's jurisdiction handling. DavidPM does not need to implement separate consent flows, data residency, or localized privacy policies for non-English markets at launch.

The goal is to present the demo tool, the purchase flow, and the authenticated experience in the top languages for global business so that a CEO in Tokyo, Frankfurt, or Riyadh can evaluate and purchase the product without language as a barrier.

---

## Implementation Approach

### String Externalization

All user-facing strings are externalized from component code into locale JSON files. No hardcoded English strings appear in any `.svelte` file, any `+page.svelte`, or any `+server.ts` response that produces user-facing content.

**File structure:**

```
/src/lib/i18n/
  en.json
  zh.json
  es.json
  ar.json
  fr.json
  de.json
  ja.json
  pt.json
  ko.json
  hi.json
```

Each file is a flat key-value structure. Keys are dot-namespaced by section.

**Example (en.json excerpt):**

```json
{
	"nav.language_switcher": "Language",
	"demo.metric_prompt": "Name a metric that matters to your operation",
	"demo.alarm_prompt": "Describe what a critical state looks like for this metric",
	"demo.optimized_prompt": "Describe what peak performance looks like for this metric",
	"demo.weight_label": "Weight (%)",
	"demo.weight_total": "Total: {total}%",
	"demo.add_metric": "Add metric",
	"demo.score_label": "Composite Score",
	"tier.alarm": "Alarm",
	"tier.concern": "Concern",
	"tier.content": "Content",
	"tier.effective": "Effective",
	"tier.optimized": "Optimized",
	"purchase.cta": "Deploy for your team",
	"purchase.price": "$5,000 perpetual license",
	"validation.field_required": "This field is required",
	"validation.weight_numeric": "Enter a whole number between 1 and 100",
	"validation.weights_must_total": "Weights must total 100%",
	"error.generic": "Something went wrong. Please try again.",
	"auth.login": "Sign in",
	"auth.email": "Email address",
	"auth.password": "Password",
	"auth.forgot_password": "Forgot password",
	"auth.reset_sent": "If an account exists for that email, a reset link has been sent.",
	"account.download": "Download source code",
	"account.license_id": "License ID",
	"account.purchase_date": "Purchase date"
}
```

Interpolation uses `{variable}` syntax. The i18n helper resolves variables at render time.

### Language Detection and Selection

**Detection order:**

1. Stored cookie (`primer_lang`). If present and valid, use it.
2. `Accept-Language` request header. Parse the header, find the highest-priority language in the supported set, use it.
3. Default to `en`.

**Selection:**

The language switcher is visible in the page header on all pages, unauthenticated and authenticated. It renders as a dropdown showing the native name of each language (not the English name).

| Code | Display Name |
| ---- | ------------ |
| en   | English      |
| zh   | 中文         |
| es   | Español      |
| ar   | العربية      |
| fr   | Français     |
| de   | Deutsch      |
| ja   | 日本語       |
| pt   | Português    |
| ko   | 한국어       |
| hi   | हिन्दी       |

On selection, the cookie is set (1-year expiry, SameSite=Lax, no Secure flag required for this cookie as it contains no sensitive data) and the page re-renders. The URL does not change. Language is not in the URL path.

**Why language is not in the URL path.** Path-based locale routing (`/fr/`, `/de/`) requires either a redirect layer or duplicated route structures. It also creates canonical URL complexity. For a site of this scope, cookie-based language selection is simpler to implement and maintain with no meaningful SEO tradeoff given the product's target acquisition model (direct, peer-referred, not organic search volume).

### SvelteKit Integration

A global `$locale` store is initialized in `hooks.server.ts` from the cookie or `Accept-Language` header. The resolved locale is passed to the page via `event.locals`. Components access translated strings through a `t()` helper function that takes a key and optional interpolation variables.

```typescript
// src/lib/i18n/index.ts
export function t(key: string, vars?: Record<string, string | number>): string;
```

The helper loads the active locale's JSON file and resolves the key. If a key is missing in a non-English locale, it falls back to the English value. Missing keys in the English locale are a build error.

### RTL Support (Arabic)

Arabic requires right-to-left layout. The implementation adds `dir="rtl"` to the `<html>` element when the active locale is `ar`. Tailwind CSS includes RTL utility variants (`rtl:` prefix). Components that use directional utilities (padding-left, margin-right, text-align, flex-direction) require RTL variants.

The following components require RTL review:

- Page header and navigation
- Language switcher dropdown
- Metric entry form
- Threshold calibration form
- Weight input and total display
- Composite score display
- Purchase CTA section
- Authenticated dashboard

RTL is a layout concern, not a style concern. The color palette, typography scale, and tier colors are identical in RTL.

---

## Tier Name Translations

The five tier names are part of the product's core vocabulary. Translations must preserve the directional meaning (lowest to highest) and the operational connotation. They are not generic adjectives. The translations below are provided as starting points and should be reviewed by a native speaker with business context before publishing.

| Tier      | en        | zh   | es           | ar      | fr            | de        | ja       | pt           | ko     | hi       |
| --------- | --------- | ---- | ------------ | ------- | ------------- | --------- | -------- | ------------ | ------ | -------- |
| Alarm     | Alarm     | 警报 | Alarma       | إنذار   | Alarme        | Alarm     | アラーム | Alarme       | 경보   | अलार्म   |
| Concern   | Concern   | 关注 | Preocupación | قلق     | Préoccupation | Bedenken  | 懸念     | Preocupação  | 우려   | चिंता    |
| Content   | Content   | 满足 | Satisfecho   | مُرضٍ   | Satisfaisant  | Zufrieden | 満足     | Satisfatório | 만족   | संतुष्ट  |
| Effective | Effective | 高效 | Efectivo     | فعّال   | Efficace      | Effektiv  | 効果的   | Eficaz       | 효과적 | प्रभावी  |
| Optimized | Optimized | 优化 | Optimizado   | مُحسَّن | Optimisé      | Optimiert | 最適化   | Otimizado    | 최적화 | अनुकूलित |

All five tier names and their definitions (Alarm through Optimized) must be included in every locale file.

---

## Email Localization

Post-purchase emails (activation link, password reset) are sent in the language stored in the user's account record. The language is recorded at the time the account record is created (triggered by the Stripe webhook). If the user's language cookie is present in the Stripe return session, it is stored with the account. If not, English is used.

Email templates are externalized in the same i18n structure under an `email.*` namespace.

Transactional email content is minimal: a single call-to-action link with a brief explanatory sentence. Localization effort per email template is low.

---

## Stripe Checkout Localization

Stripe Checkout accepts a `locale` parameter. Pass the active locale code at checkout session creation. Stripe supports all ten launch languages natively. The checkout page will render in the user's selected language including Stripe's own UI strings, error messages, and payment method labels.

```typescript
const session = await stripe.checkout.sessions.create({
	locale: mapToStripeLocale(activeLocale) // 'en', 'zh', 'es', 'ar', 'fr', 'de', 'ja', 'pt', 'ko', 'hi'
	// ...other session params
});
```

Stripe's locale codes match ISO 639-1. No mapping is required for most languages. Verify `ar` and `zh` against Stripe's supported locale list before launch.

---

## Translation Workflow

At launch, translations are produced via a professional translation service with business context provided. The context brief includes:

- Product description (the quintile framework, its five tiers, the inquiry process)
- Audience (C-suite executives, operations-focused vocabulary)
- Tone (direct, operational, no marketing softness)
- Glossary (tier names and definitions must be translated consistently)

Translations are reviewed against the English source for completeness. Every key present in `en.json` must be present in all other locale files. A build-time check enforces this.

**Build-time locale validation:**

```typescript
// scripts/validate-locales.ts
// Runs as part of CI. Fails build if any locale file is missing keys present in en.json.
```

---

## Context B: Language in the Customer Package

The customer source code package (Context B) ships with English strings only at launch. The i18n architecture (JSON locale files, `t()` helper, locale store) is included in the package so customers can add their own languages. The architecture overview documentation notes this capability.

DavidPM does not provide translations for Context B at launch. Customers who need non-English deployments implement their own translations against the provided architecture.

---

## Out of Scope

- URL path-based locale routing
- Localized SEO meta tags (the site's acquisition model does not depend on organic search volume)
- Locale-specific number formatting beyond what the browser provides natively
- Locale-specific date formatting beyond what JavaScript's `Intl.DateTimeFormat` provides
- GDPR, CCPA, or other jurisdiction-specific consent flows (DavidPM does not store customer operational data)
- Separate terms of service or privacy policy per jurisdiction at launch
