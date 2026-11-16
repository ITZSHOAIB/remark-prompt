# Every export has a `default` condition, and the Docusaurus entry is CommonJS

Every entry in `package.json` `exports` resolves through `types` + `default`. There are no `import`-only and no `development` conditions. The Docusaurus plugin (`remark-prompt/docusaurus`) is compiled from a `.cts` file as CommonJS.

Docusaurus loads its config through jiti, which turns `import` into `require()`. An `import`-only export fails to resolve there, and a `development` condition points at unpublished source files during `docusaurus start`. Mirrordown's packages break on Docusaurus in both of these ways. `scripts/checkPackage.mjs` enforces this rule on every CI run.
