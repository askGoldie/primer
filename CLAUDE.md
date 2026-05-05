## Project Configuration

- **Language**: TypeScript
- **Framework**: Svelte 5 with runes
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, tailwindcss, sveltekit-adapter, supabase, mcp

---

## Licensing Model

This product is sold as a **perpetual source code license**. Customers receive and own the source code directly.

---

## Deployment Targets

There are **two distinct deployment targets** for this codebase — do not conflate them:

### 1. Demo Site (team-hosted)

- Hosted by the DavidPM team as a live product demo
- Uses **Supabase Postgres** as the database
- `DATABASE_URL` in `.env` points to the Supabase project connection string
- This is what runs in the DavidPM team's own development and staging environments

### 2. Customer Source Code Package

- Delivered as a **zip file** upon purchase of the perpetual license
- Uses **plain PostgreSQL** — no Supabase dependency
- No Supabase RLS or GoTrue auth — access control is enforced at the application layer
- `.env.example` ships with a generic `postgres://user:password@host:port/db-name` placeholder that customers replace with their own provider (Neon, Railway, self-hosted, etc.)

**Key rule**: Any DB-related code must remain provider-agnostic (no Supabase-specific APIs, RLS, or `auth.uid()`). The Supabase connection is purely at the infrastructure level for the demo site.

---

## Internationalization (i18n)

Every page operates in multiple languages. All user-facing strings are externalized—no hardcoded English strings in any `.svelte` file, `+page.svelte`, or `+server.ts` response.

### Supported Languages

| Code | Language               |
| ---- | ---------------------- |
| en   | English                |
| zh   | 中文 (Chinese)         |
| es   | Español (Spanish)      |
| ar   | العربية (Arabic)       |
| fr   | Français (French)      |
| de   | Deutsch (German)       |
| ja   | 日本語 (Japanese)      |
| pt   | Português (Portuguese) |
| ko   | 한국어 (Korean)        |

### Key Implementation Details

- **Locale files**: `/src/lib/i18n/{locale}.json` with flat key-value structure using dot-namespaced keys
- **Translation helper**: Use `t(key, vars?)` function from `src/lib/i18n/index.ts` for all user-facing text
- **Interpolation**: `{variable}` syntax for dynamic values (e.g., `"demo.weight_total": "Total: {total}%"`)
- **Fallback**: Missing keys in non-English locales fall back to English; missing keys in English are build errors
- **RTL support**: Arabic (`ar`) requires `dir="rtl"` and Tailwind `rtl:` utility variants for directional styles
- **Language selection**: Cookie-based (`primer_lang`), not URL path-based

### Development Requirements

- **Never hardcode user-facing strings**—always use `t()` with a key from locale files
- **Add new keys to `en.json` first**, then all other locale files (build validation enforces completeness)
- **RTL review required** for any component with directional styling when supporting Arabic

See `/docs/multilingual-implementation-spec.md` for full implementation details.

---

## Documentation & Code Quality Requirements

Because customers will be reading, modifying, and maintaining this codebase:

- **Write comprehensive JSDoc comments** for all public functions, types, and modules
- **Include inline comments** explaining non-obvious logic and business rules
- **Document component props** with clear descriptions and examples
- **Maintain a clear file/folder structure** with README files in key directories where appropriate
- **Use descriptive variable and function names** that convey intent
- **Include usage examples** in documentation where helpful
- **Explain architectural decisions** in relevant comments or documentation

The goal is a codebase that is self-explanatory and maintainable by the end customer without requiring external support.

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
