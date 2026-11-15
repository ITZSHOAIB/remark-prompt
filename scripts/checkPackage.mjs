// Checks the built package the way consumers load it. Run after `pnpm build`.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const packageJson = JSON.parse(
  await readFile(path.join(projectRoot, "package.json"), "utf8"),
);

// Docusaurus loads config through jiti, which turns `import` into `require()`,
// so an import-only condition breaks it. Every entry needs `default`, and no
// `development` condition may point at unpublished source.
for (const [entry, target] of Object.entries(packageJson.exports)) {
  const conditions = typeof target === "string" ? { default: target } : target;
  assert(conditions.default, `${entry} needs a "default" condition`);
  assert(!("import" in conditions), `${entry} must not be import-only`);
  assert(!("development" in conditions), `${entry} must not use "development"`);
  for (const file of Object.values(conditions)) {
    assert(
      existsSync(path.join(projectRoot, file)),
      `${entry}: ${file} is missing`,
    );
  }
}

// Resolve through the package name, as a consumer would.
const require = createRequire(path.join(projectRoot, "package.json"));
const remarkPrompt = require("remark-prompt");
assert.equal(typeof remarkPrompt.default, "function", "require(remark-prompt)");
assert.equal(typeof (await import("remark-prompt")).default, "function");
assert.equal(
  typeof (await import("remark-prompt/satteri")).satteriPrompt,
  "function",
);
assert.equal(typeof (await import("remark-prompt/astro")).default, "function");
await import("remark-prompt/client"); // must not touch `document` on the server

const docusaurus = require("remark-prompt/docusaurus");
assert.equal(
  typeof docusaurus,
  "function",
  "the Docusaurus plugin is a CommonJS function",
);
for (const file of docusaurus().getClientModules()) {
  assert(existsSync(file), `Docusaurus client module ${file} is missing`);
}

const packed = JSON.parse(
  execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  }),
)[0].files.map((file) => file.path);
for (const file of [
  "dist/index.js",
  "dist/docusaurus.cjs",
  "dist/styles.css",
]) {
  assert(packed.includes(file), `${file} is not published`);
}
assert(
  packed.every(
    (file) =>
      ["LICENSE", "README.md", "package.json"].includes(file) ||
      file.startsWith("dist/"),
  ),
  `unexpected published files: ${packed.join(", ")}`,
);

console.log(`Package OK: ${packed.length} files.`);
