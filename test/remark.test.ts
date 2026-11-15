import { describe, expect, it } from "vitest";
import { prompts, remarkHtml } from "./helpers.js";

const fence = [
  "Intro.",
  "",
  '```prompt claude cursor title="Add tabs"',
  "Add tabs to <PROJECT_NAME>, see {pageUrl}.",
  "",
  "- Run `npm run build`",
  "```",
  "",
].join("\n");

describe("prompt fences", () => {
  it("renders real elements, with the prompt stored once in data-prompt", async () => {
    const html = await remarkHtml(fence);
    expect(prompts(html)).toEqual([
      "Add tabs to <PROJECT_NAME>, see {pageUrl}.\n\n- Run `npm run build`",
    ]);
    expect(html).toContain('<div class="remark-prompt" id="remark-prompt-0"');
    expect(html).toContain(
      '<summary class="remark-prompt-title">Add tabs</summary>',
    );
    expect(html).not.toContain('<details class="remark-prompt-details" open');
  });

  it("parses the preview as Markdown and shows placeholders as text", async () => {
    const html = await remarkHtml(fence);
    expect(html).toContain(
      '<div class="remark-prompt-preview"><p>Add tabs to &#x3C;PROJECT_NAME>, see {pageUrl}.</p>',
    );
    expect(html).toContain("<li>Run <code>npm run build</code></li>");
  });

  it("keeps the source as a plain markdown code block for the site's highlighter", async () => {
    const html = await remarkHtml(fence);
    expect(html).toContain(
      '<div class="remark-prompt-source"><pre><code class="language-markdown">',
    );
  });

  it("offers the services named in the meta, as GET forms", async () => {
    const html = await remarkHtml(fence);
    expect(html).toContain(
      'action="https://claude.ai/new" method="get" target="_blank"',
    );
    expect(html).toContain('<input type="hidden" name="q"');
    expect(html).toContain('action="https://cursor.com/link/prompt"');
    expect(html).toContain('<input type="hidden" name="text"');
    expect(html).not.toContain("chatgpt.com");
    expect(html).toContain('aria-label="Open in Cursor"');
  });

  it("falls back to the default services, then to the configured ones", async () => {
    const plain = "```prompt\nHi\n```\n";
    const byDefault = await remarkHtml(plain);
    expect(byDefault).toContain("claude.ai");
    expect(byDefault).toContain("chatgpt.com");
    expect(byDefault).not.toContain("cursor.com");
    const configured = await remarkHtml(plain, { services: ["cursor"] });
    expect(configured).toContain("cursor.com");
    expect(configured).not.toContain("claude.ai");
  });

  it("supports open, single-quoted and bare titles", async () => {
    expect(
      await remarkHtml("```prompt open title='Two words'\nHi\n```\n"),
    ).toMatch(/<details class="remark-prompt-details" open>.*Two words/s);
    expect(await remarkHtml("```prompt title=Bare\nHi\n```\n")).toContain(
      ">Bare</summary>",
    );
    expect(await remarkHtml("```prompt\nHi\n```\n")).toContain(
      ">Prompt</summary>",
    );
  });

  it("numbers prompts per file and leaves other code alone", async () => {
    const html = await remarkHtml(
      "```prompt\nA\n```\n\n```js\nconst a = 1;\n```\n\n```prompt\nB\n```\n\n```prompt\n\n```\n",
    );
    expect(html.match(/id="remark-prompt-\d"/g)).toEqual([
      'id="remark-prompt-0"',
      'id="remark-prompt-1"',
    ]);
    expect(html).toContain('<code class="language-js">');
    expect(html).toContain('<code class="language-prompt">');
  });

  it("takes translated labels", async () => {
    const html = await remarkHtml("```prompt claude\nHi\n```\n", {
      labels: {
        title: "Invite",
        preview: "Aperçu",
        copy: "Copier",
        open: "Ouvrir dans {service}",
      },
    });
    expect(html).toContain(">Invite</summary>");
    expect(html).toContain(">Aperçu</label>");
    expect(html).toContain(">Copier</button>");
    expect(html).toContain('aria-label="Ouvrir dans Claude"');
  });
});

describe(":::prompt directives", () => {
  it("keeps the body exactly as written", async () => {
    const html = await remarkHtml(
      ':::prompt{title="Summarize" open chatgpt}\nSummarize **this page** for <NAME>.\n\n1. Three bullets\n:::\n',
    );
    expect(prompts(html)).toEqual([
      "Summarize **this page** for <NAME>.\n\n1. Three bullets",
    ]);
    expect(html).toContain(">Summarize</summary>");
    expect(html).toContain('<details class="remark-prompt-details" open>');
    expect(html).toContain("chatgpt.com");
    expect(html).not.toContain("claude.ai");
  });

  it("uses the directive label as the title", async () => {
    const html = await remarkHtml(":::prompt[Label *title*]\nBody\n:::\n");
    expect(html).toContain(">Label title</summary>");
    expect(prompts(html)).toEqual(["Body"]);
  });

  it("ignores empty prompts and other directives", async () => {
    const html = await remarkHtml(":::prompt\n:::\n\n:::note\nKept\n:::\n");
    expect(prompts(html)).toEqual([]);
    expect(html).toContain("Kept");
  });
});
