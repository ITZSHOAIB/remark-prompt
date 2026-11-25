# Host fixtures

Run these commands from the repository root with Node 24.

```sh
pnpm --filter '@remark-prompt/fixture-*...' install --frozen-lockfile
pnpm test:fixtures
```

| Host | Base path | Static output |
| --- | --- | --- |
| Docusaurus | `/docusaurus/` | `docusaurus/build/` |
| Starlight via S?tteri | `/starlight/` | `starlight/dist/` |
| Fumadocs | `/fumadocs/` | `fumadocs/out/` |

Each build copies both pages from [content](content/) into the host's content
directory. The home page exercises the Markdown directive, and `fences/`
exercises the MDX fences. The custom service ID currently exercises the
configured default fallback. Custom service registration is tracked in
[Epic #5](https://github.com/ITZSHOAIB/remark-prompt/issues/5).
