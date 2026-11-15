import { markdownToHtml } from "satteri";
import { describe, expect, it } from "vitest";
import { satteriPrompt } from "../src/satteri.js";
import { prompts, remarkHtml, satteriHtml } from "./helpers.js";

const page = [
  '```prompt cursor open title="Add tabs"',
  "Add tabs to <PROJECT_NAME>.",
  "",
  "- Run `npm run build`",
  "```",
  "",
  ":::prompt[Directive *label*]{chatgpt}",
  "Summarize **this page** for <NAME>.",
  ":::",
  "",
  ":::prompt",
  ":::",
  "",
  "```js",
  "const a = 1;",
  "```",
  "",
].join("\n");

/** Element tags and attributes, ignoring whitespace and entity style. */
const shape = (html: string) =>
  [...html.matchAll(/<(\w+)([^>]*)>/g)]
    .filter(([, tag]) => tag !== "code" && tag !== "pre")
    .map(
      ([, tag, attributes]) =>
        `${tag}${(attributes ?? "").replace(/\s+/g, " ").trim()}`,
    )
    .filter(
      (tag) =>
        tag.includes("remark-prompt") ||
        /^(form|input|label|button|summary|details)/.test(tag),
    )
    .map((tag) => tag.replace(/data-prompt="[^"]*"/, "data-prompt"));

describe("satteriPrompt", () => {
  it("renders the same prompts as the remark plugin", async () => {
    const satteri = satteriHtml(page);
    const remark = await remarkHtml(page);
    expect(prompts(satteri)).toEqual([
      "Add tabs to <PROJECT_NAME>.\n\n- Run `npm run build`",
      "Summarize **this page** for <NAME>.",
    ]);
    expect(prompts(satteri)).toEqual(prompts(remark));
    expect(shape(remark).length).toBeGreaterThan(20);
    expect(shape(satteri)).toEqual(shape(remark));
  });

  it("restarts ids for every file when one plugin entry is shared", () => {
    const mdastPlugins = [satteriPrompt()];
    const two = "```prompt\nA\n```\n\n```prompt\nB\n```\n";
    const ids = (html: string) => html.match(/id="remark-prompt-\d"/g);
    for (let file = 0; file < 2; file++) {
      expect(ids(markdownToHtml(two, { mdastPlugins }).html)).toEqual([
        'id="remark-prompt-0"',
        'id="remark-prompt-1"',
      ]);
    }
  });

  it("uses the label as the title and leaves other code alone", () => {
    const html = satteriHtml(page);
    expect(html).toContain(">Directive label</summary>");
    expect(html).toContain('class="language-js"');
  });

  it("takes options", () => {
    const html = satteriHtml("```prompt\nHi\n```\n", {
      services: ["cursor"],
      labels: { copy: "Copier" },
    });
    expect(html).toContain("cursor.com");
    expect(html).not.toContain("claude.ai");
    expect(html).toContain(">Copier</button>");
  });
});
