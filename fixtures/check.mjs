import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const hosts = [
  {
    name: "docusaurus",
    output: "docusaurus/build/",
    highlighter: "prism-code",
  },
  {
    name: "starlight",
    output: "starlight/dist/",
    highlighter: "expressive-code",
  },
  { name: "fumadocs", output: "fumadocs/out/", highlighter: "shiki" },
];

const prompts = (html) =>
  [...html.matchAll(/data-prompt="([^"]*)"/g)].map(([, value]) =>
    value
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
        String.fromCodePoint(Number.parseInt(hex, 16)),
      )
      .replace(/&#(\d+);/g, (_, decimal) =>
        String.fromCodePoint(Number(decimal)),
      )
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&apos;", "'"),
  );

async function loadsAsset(html, directory, basePath, extension, marker) {
  if (html.includes(marker)) return true;
  for (const [, target] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (!target.startsWith(basePath) || !target.endsWith(extension)) continue;
    const asset = await readFile(
      new URL(target.slice(basePath.length), directory),
      "utf8",
    );
    if (asset.includes(marker)) return true;
  }
  return false;
}

for (const { name, output, highlighter } of hosts) {
  const directory = new URL(output, import.meta.url);
  const markdown = await readFile(new URL("index.html", directory), "utf8");
  const mdx = await readFile(new URL("fences/index.html", directory), "utf8");

  assert.deepEqual(
    prompts(markdown),
    [
      "Summarize **the work** in three bullets.",
      "Use the site's default service.",
    ],
    name,
  );
  assert.ok(
    markdown.includes('action="https://chatgpt.com/'),
    `${name} directive service`,
  );
  assert.ok(
    markdown.includes('action="https://cursor.com/link/prompt"'),
    `${name} configured service`,
  );

  const mdxPrompts = prompts(mdx);
  assert.equal(mdxPrompts.length, 4, name);
  assert.match(
    mdxPrompts[0],
    /^Add an example for <NAME> with the value \{var\}/,
    name,
  );
  assert.equal(
    mdxPrompts[1],
    "Keep the zero-width space: before\u200bafter.",
    name,
  );
  assert.equal(
    mdxPrompts[2],
    "Repeat this sentence. ".repeat(700).trimEnd(),
    name,
  );
  assert.equal(
    mdxPrompts[3],
    "Send this to the fixture's custom service when it is configured.",
    name,
  );

  const basePath = `/${name}/`;
  for (const [route, html] of [
    ["/", markdown],
    ["/fences/", mdx],
  ]) {
    const page = `${name} ${route}`;
    assert.ok(html.includes(highlighter), `${page} host highlighter`);
    assert.ok(
      await loadsAsset(
        html,
        directory,
        basePath,
        ".css",
        ".remark-prompt-copy",
      ),
      `${page} prompt CSS`,
    );
    assert.ok(
      await loadsAsset(html, directory, basePath, ".js", "data-copy-failed"),
      `${page} prompt client`,
    );
  }
  console.log(
    `${name}: shared Markdown and MDX routes, prompt CSS, and client bundle verified`,
  );
}
