# remark-prompt

Prompt blocks for Markdown and MDX docs. Readers can preview a prompt, read its Markdown, copy it, or open it in Claude, ChatGPT or Cursor.

````md
```prompt title="Add dark mode" claude cursor
Add a dark mode toggle to <PROJECT_NAME>.

- Store the choice in `localStorage`
- Respect `prefers-color-scheme` on first visit
```
````

It outputs real HTML elements, not raw HTML, so it works on MDX sites. It has been tested on Docusaurus, Fumadocs, Starlight on Astro (both Sätteri and unified), Nextra and Rspress.

- **No framework runtime.** Collapse uses `<details>`, the Preview/Markdown switch uses radio buttons and CSS, and the "Open in" buttons are plain forms. Only Copy needs JavaScript: one small click listener that survives client-side navigation.
- **Your site's code style.** The Markdown view is an ordinary code block, so your highlighter renders it (Prism, Shiki, Expressive Code).
- **Prompts can contain anything.** `<PROJECT_NAME>`, `{var}` and HTML show as written. The preview is parsed separately from the page, so it can't break MDX.

## Install

```sh
npm install remark-prompt
```

## Writing prompts

Use a `prompt` fence. Everything on the fence line after `prompt` is optional:

| Meta | Effect |
| --- | --- |
| `title="…"` | Summary text. Defaults to "Prompt". |
| `open` | Starts expanded. |
| a service id, such as `claude` or `gemini` | The "Open in" buttons to show. See [Services](#services). Defaults to the `services` option. |

### `:::prompt` directives

If your site uses [remark-directive](https://github.com/remarkjs/remark-directive), you can also write:

```md
:::prompt{title="Summarize" open chatgpt}
Summarize **this page** in three bullets.
:::
```

A `[label]` works as the title too: `:::prompt[Summarize]`.

> [!WARNING]
> **Prefer the fence in `.mdx` files.** MDX parses a directive's body as MDX before any plugin runs. A body containing `<NAME>` or `{var}` fails the build, and no plugin can prevent that. Some frameworks also compile `.mdx` a second time without your plugins: Nextra in dev, and Rspress for its `llms.txt` output (on by default). In both, even a clean `:::prompt{…}` fails. Fences are safe everywhere.
>
> Docusaurus parses `.md` files as MDX too, unless you set `markdown: { format: "detect" }`.

## Setup

Each framework needs two things: the Markdown transform, and the stylesheet plus copy script (`remark-prompt/styles.css` and `remark-prompt/client`).

### Docusaurus

```js
// docusaurus.config.js
import remarkPrompt from "remark-prompt";

export default {
  plugins: ["remark-prompt/docusaurus"], // stylesheet and copy script
  presets: [
    [
      "classic",
      {
        docs: { remarkPlugins: [remarkPrompt] },
        blog: { remarkPlugins: [remarkPrompt] },
      },
    ],
  ],
};
```

Docusaurus already parses `:::` directives.

### Astro and Starlight

Astro 7's default Markdown processor is Sätteri:

```js
// astro.config.mjs
import { satteri } from "@astrojs/markdown-satteri";
import promptAssets from "remark-prompt/astro";
import { satteriPrompt } from "remark-prompt/satteri";

export default defineConfig({
  markdown: {
    processor: satteri({ mdastPlugins: [satteriPrompt()] }),
  },
  integrations: [starlight({ title: "Docs" }), promptAssets()],
});
```

With the unified processor (`@astrojs/markdown-remark`), use the remark plugin instead: `unified({ remarkPlugins: [remarkPrompt] })`. Starlight turns on `:::` directives for both.

### Fumadocs

```ts
// lib/source.ts (or source.config.ts)
import { applyMdxPreset } from "fumadocs-mdx/config";
import remarkDirective from "remark-directive"; // only for :::prompt
import remarkPrompt from "remark-prompt";

export const docs = defineDocs({
  docs: {
    mdxOptions: applyMdxPreset({
      remarkPlugins: (v) => [remarkDirective, ...v, remarkPrompt],
    }),
  },
});
```

Import `remark-prompt/styles.css` in your root layout. Load the copy script from a client component rendered in that layout:

```tsx
"use client";
import "remark-prompt/client";

export function PromptClient() {
  return null;
}
```

### Nextra

```js
// next.config.mjs
import nextra from "nextra";
import remarkDirective from "remark-directive"; // only for :::prompt
import remarkPrompt from "remark-prompt";

const withNextra = nextra({
  mdxOptions: { remarkPlugins: [remarkDirective, remarkPrompt] },
});

export default withNextra({});
```

Then add the stylesheet and client component as for Fumadocs.

> [!NOTE]
> Under Turbopack, Next.js's default bundler, Nextra rejects every remark plugin passed as a function ("does not have serializable options"). Build with `next build --webpack` and `next dev --webpack`.

### Rspress

```ts
// rspress.config.ts
import { createRequire } from "node:module";
import remarkDirective from "remark-directive"; // only for :::prompt
import remarkPrompt from "remark-prompt";

const require = createRequire(import.meta.url);

export default defineConfig({
  markdown: { remarkPlugins: [remarkDirective, remarkPrompt] },
  globalStyles: require.resolve("remark-prompt/styles.css"),
  globalUIComponents: [path.join(__dirname, "components/PromptClient.tsx")],
});
```

Here `PromptClient.tsx` is a component that imports `remark-prompt/client` and returns `null`.

### Any unified pipeline

```js
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkPrompt from "remark-prompt";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const html = await unified()
  .use(remarkParse)
  .use(remarkPrompt)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown);
```

## Services

The ids match [Mirrordown](https://github.com/mirrordown/mirrordown)'s, so existing fences keep working. List the ones you want on the fence line, or set defaults with the `services` option. Unknown ids are ignored.

| Id | Button | What it does |
| --- | --- | --- |
| `claude` | Claude | Opens `claude.ai/new` with the prompt filled in; the reader sends it |
| `chatgpt` | ChatGPT | Opens ChatGPT with the prompt filled in; the reader sends it |
| `cursor` | Cursor | Opens `cursor.com/link/prompt` with the prompt filled in |
| `github-copilot` | GitHub Copilot | Opens Copilot with the prompt filled in; the reader sends it |
| `grok` | Grok | Opens Grok with the prompt filled in; the reader confirms before it sends |
| `copilot` | Microsoft Copilot | Copies the prompt, then opens Copilot |
| `gemini` | Gemini | Copies the prompt, then opens Gemini |
| `mistral` | Le Chat | Copies the prompt, then opens Le Chat |
| `perplexity` | Perplexity | Copies the prompt, then opens Perplexity |

The last four can't take a prompt in the link, so their button copies it and opens the service. That needs the [client script](#setup), as Copy does.

### Custom services

`customServices` adds a service, or replaces a preset with the same id. Write the service's link as a template and put `{prompt}` where the prompt goes:

```ts
remarkPrompt({
  customServices: {
    // A query value becomes a GET form. Other parameters are kept.
    kagi: { label: "Kagi", url: "https://kagi.com/assistant?q={prompt}&internet=true" },
    // The path or the fragment becomes a link with the prompt URL-encoded.
    lovable: { label: "Lovable", url: "https://lovable.dev/#prompt={prompt}" },
    // No `{prompt}`: copy the prompt, then open the page.
    local: { label: "Team chat", url: "https://chat.example.com/" },
    // Replace a preset.
    claude: { label: "Claude", url: "https://claude.ai/new?q={prompt}" },
  },
});
```

````md
```prompt kagi lovable
Explain this page.
```
````

- `url` must be `http` or `https`, with at most one `{prompt}`, and not in the host.
- In a query, `{prompt}` must be a whole value (`?q={prompt}`), not part of one (`?q=ask-{prompt}`).
- Ids use letters, digits, `-` and `_`. `open` and `title` are reserved for the fence.
- `maxLength?: number` is accepted and stored for the upcoming length limits.
- A bad template fails the build and names the service.

## Options

```ts
remarkPrompt({
  services: ["claude", "chatgpt"], // default "Open in" buttons
  customServices: {}, // add services or replace presets; see Services
  labels: {
    title: "Prompt",
    preview: "Preview",
    markdown: "Markdown",
    copy: "Copy",
    open: "Open in {service}", // accessible name of each service button
  },
});
```

`satteriPrompt()` takes the same options.

## Styling

Everything is namespaced under `.remark-prompt`. The bundled stylesheet is small and inherits your colours and fonts, so override what you like. The parts are:

- `.remark-prompt-details` and `.remark-prompt-title`
- `.remark-prompt-views`, `.remark-prompt-preview`, `.remark-prompt-source`
- `.remark-prompt-actions`, `.remark-prompt-copy` (`[data-copied]` for two seconds after a copy), `.remark-prompt-service` (a form, a link, or a button, by service)

The text is stored once, in the `data-prompt` attribute on `.remark-prompt`.

## License

MIT
