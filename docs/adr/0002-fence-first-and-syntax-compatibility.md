# The fence is the primary syntax, compatible with Mirrordown and Vocs

A `prompt` fence is the main syntax, and the `:::prompt` directive is a convenience. In `.mdx` files, MDX parses a directive's body before any plugin runs, so `<NAME>` or `{var}` in a prompt fails the build under every MDX compiler. Some hosts also compile a second time without user plugins: Nextra in dev, and Rspress for `llms.txt`. A fence body is opaque everywhere.

We commit to rendering every Mirrordown (`@mirrordown/remd-prompt` 0.1.x, as of 2026-11-16) `prompt` fence (service ids, `open`, `title=`) and every Vocs `:::prompt` block correctly. Any syntax we add must keep that true. This lets sites switch to remark-prompt without editing their content. Custom services use Mirrordown's URL-template shape (`url: "…?q={prompt}"`) for the same reason.

## Considered options

- **A JSX `<Prompt>` component, as Mintlify does:** rejected. It only works in MDX and needs a runtime on every host.
- **Directive-first, as Vocs does:** rejected. It's the syntax that breaks in MDX.
