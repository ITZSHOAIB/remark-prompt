# PRD: remark-prompt 0.2.0

Terms follow [GLOSSARY.md](../GLOSSARY.md). Decisions with lasting trade-offs are in [docs/adr](./adr).

## Problem

Docs sites increasingly ship prompts for readers to paste into AI tools: "add this library to my project", "migrate from v1". Big projects build their own prompt blocks: Cloudflare, Nx, Vitest, Cypress, Mastra, ClickHouse, Next.js, Expo, HeroUI. Mintlify, Vocs and Nuxt UI have one built in. Docusaurus, Starlight, Fumadocs, Nextra and Rspress don't.

The only package that tries to fill the gap, Mirrordown's `remd-prompt`, emits raw HTML and `import`-only exports. On Docusaurus 3.10 the config doesn't load, the build crashes, and after workarounds the widget still doesn't work. MDX parses prompt text such as `<NAME>` or `{var}`, so it breaks the build or silently disappears.

## Users

- **Docs authors** on any remark- or Sätteri-based host who want readers to copy a prompt, or open it in an AI service, without building a component.
- **Readers**, who need to see exactly what they're sending, copy it reliably, and not be tricked by invisible characters.

## Goals for 0.2.0

1. A prompt block works on Docusaurus, Starlight (Sätteri and unified), Fumadocs, Nextra (webpack) and Rspress with a documented setup. The first three are tested in CI against real fixtures.
2. Any prompt text works in a fence on every host, including inside MDX.
3. Collapse, the Preview/Markdown toggle and service links work without JavaScript. Copy and copy-and-open need one small script.
4. The output is accessible: labelled controls, announced copy feedback, and no axe violations.
5. Mirrordown fences and Vocs `:::prompt` blocks render unchanged ([ADR 0002](./adr/0002-fence-first-and-syntax-compatibility.md)).

## Scope

### In

- **Syntax:** the fence (`title=`, `open`, service ids) and the directive (`title` attribute or label, `open`, service ids).
- **Services:**
  - Presets matching Mirrordown's ids:
    - Prefill: `chatgpt`, `claude`, `cursor`, `github-copilot`, `grok`.
    - Copy-and-open: `copilot`, `gemini`, `mistral`, `perplexity`.
  - The `services` option sets the default ids.
  - `customServices: { id: { label, url: "…{prompt}…", maxLength? } }` adds services or overrides presets.
- **Length limits:** a limit for each service, decided at build time, with copy-and-open above it ([ADR 0003](./adr/0003-copy-and-open-decided-at-build-time.md)).
- **Build warnings**, with file and line, for:
  - an unknown service id
  - an invisible character in a prompt
- **Invisible characters:** shown in the Markdown view as labelled marks (`U+200B`). The copied text is unchanged.
- **Accessibility:**
  - `labels.view`, `labels.copied` and a copy-and-open message
  - an `aria-live="polite"` status region
- **MDX:** wrapper elements render as plain HTML, and only the code view uses the host's components ([ADR 0001](./adr/0001-real-elements-not-raw-html.md)).
- **Adapters:**
  - `remark-prompt` (remark)
  - `remark-prompt/satteri`
  - `remark-prompt/astro` (assets)
  - `remark-prompt/docusaurus` (assets, CommonJS: [ADR 0004](./adr/0004-default-export-conditions.md))
  - `remark-prompt/client`
  - `remark-prompt/styles.css`
- **Stability contract:** class names, `data-*` attributes and element structure follow semver.

### Out (revisit on demand)

- **`{pageUrl}` placeholders:** they rewrite literal text and don't work without JavaScript. It can be added later without breaking anything.
- **VitePress / markdown-it adapter.**
- **A separate docs site:** the README and the demo are the docs.
- **A live in-browser playground.**
- **Deploying Nextra and Rspress fixtures:** these are checked by hand before each release.

## Production-ready means

- [ ] CI runs on every PR:
  - lint, typecheck, and unit tests on Node 22/24/26
  - the package check
  - Playwright e2e on the Docusaurus, Starlight (Sätteri) and Fumadocs fixtures, with axe
- [ ] An HTML file snapshot guards the stability contract, and a test checks every contract class exists in `styles.css`.
- [ ] The code follows the module layout in [plan.md](./plan.md): one core transform and thin adapters, with no type casts across the seam.
- [ ] The repo has AGENTS.md, CONTRIBUTING.md, issue and PR templates, GLOSSARY.md and ADRs.
- [ ] A live demo runs at `remark-prompt.sohab.dev`, built from the same output the e2e tests run against.
- [ ] Nextra (webpack) and Rspress pass a manual check against the release candidate.
- [ ] The repo is public, `Checks / Required` is enforced by a ruleset, and every release from 0.2.0 on is published through OIDC trusted publishing with provenance.

## Success after launch

- At least one real docs site outside our own projects adopts it. This is the bar for 1.0.
- Issues arrive with host and version, and fixes land with a fixture test.
