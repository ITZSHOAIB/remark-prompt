import { mkdir, readFile, writeFile } from "node:fs/promises";

const directories = new Map([
  ["docusaurus", "docusaurus/docs/"],
  ["starlight", "starlight/src/content/docs/"],
  ["fumadocs", "fumadocs/content/docs/"],
]);
const directory = directories.get(process.argv[2]);
if (!directory) throw new Error("Expected docusaurus, starlight, or fumadocs.");

const output = new URL(directory, import.meta.url);
await mkdir(output, { recursive: true });

for (const name of ["index.md", "fences.mdx"]) {
  const source = await readFile(
    new URL(`content/${name}`, import.meta.url),
    "utf8",
  );
  const content = source.replace(
    "{{LONG_PROMPT}}",
    "Repeat this sentence. ".repeat(700).trimEnd(),
  );
  await writeFile(new URL(name, output), content);
}
