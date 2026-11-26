---
"remark-prompt": minor
---

Add `customServices` and the Mirrordown service presets. Each service is now a link template: `{prompt}` in a query value becomes a GET form that keeps the other parameters, in the path or fragment it becomes a link, and with no `{prompt}` the button copies the prompt and opens the page. New presets: `github-copilot`, `grok`, `copilot`, `gemini`, `mistral` and `perplexity`. Fences and directives can name custom ids. An invalid template, or an unknown id in the `services` option, now fails the build.

**Breaking for TypeScript users:** the exported `services` object now holds `{ label, url }` templates instead of `{ label, action, field }`, and `ServiceId` also accepts custom ids. The HTML for the existing `claude`, `chatgpt` and `cursor` forms is unchanged.
