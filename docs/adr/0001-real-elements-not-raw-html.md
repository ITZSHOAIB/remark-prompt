---
status: proposed
---

# Prompt blocks are real elements, and their wrappers bypass MDX component maps

A prompt block is built from mdast nodes that carry `data.hName` and `data.hProperties`. It is never `raw` HTML or a JSX component. MDX hosts reject or drop `raw` nodes, and a JSX component would need its own runtime on every host. `hName` nodes become real elements in unified, @mdx-js and Sätteri alike. Starlight's own asides use the same technique.

Inside MDX, every element also passes through the host's component map. On Docusaurus, that turns our `<details>` into its admonition-styled Details component. The wrapper elements (`details`, `summary`, `input`, `label`, `button`, `form`, and our `div`s) are therefore marked with `data._mdxExplicitJsx`, so MDX renders them as plain HTML. Only the nested `code` node goes through the host, so the Markdown view uses the site's own highlighter.

## Open: the mechanism

mdast-util-to-hast copies only `hName`, `hProperties` and `hChildren` from mdast `data`, so a remark plugin can't set `_mdxExplicitJsx` directly. rehype-code-group can, because it's a rehype plugin. There are two candidates:

- **Build the wrappers as hast in `hChildren`.** This needs checking that the code view is still highlighted by Shiki, Expressive Code and Prism, and that Sätteri honours `hChildren`.
- **A small rehype companion step.**

A spike on Docusaurus decides which. This ADR becomes `accepted` once the spike works.

## Consequences

- `_mdxExplicitJsx` is a private MDX field. rehype-code-group depends on it as well. If MDX removes it, prompt blocks pick up host components again (a cosmetic regression, not a broken one), and the fixture e2e tests catch it.
- Behaviour only ever attaches to elements we own, never to the code block, because hosts replace the code block.
