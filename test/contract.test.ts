import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classes, hookClasses, styledClasses } from "../src/core/contract.js";
import type { RemarkPromptOptions } from "../src/index.js";
import { pretty, remarkHtml, satteriHtml } from "./helpers.js";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const client = readFileSync(
  new URL("../src/client.ts", import.meta.url),
  "utf8",
);

const cases = {
  fence: ["```prompt", "Add a dark mode toggle.", "```", ""].join("\n"),
  "fence-options": [
    '```prompt open title="Add tabs" claude cursor',
    "Add tabs to <PROJECT_NAME>.",
    "",
    "- Run `npm run build`",
    "```",
    "",
  ].join("\n"),
  directive: [
    ':::prompt{title="Refactor" open chatgpt}',
    "Split **utils.ts** into modules.",
    ":::",
    "",
  ].join("\n"),
};

// The three service controls: a form with extra fields, an anchor, and a
// copy-and-open button.
const serviceOptions: RemarkPromptOptions = {
  customServices: {
    form: { label: "Form", url: "https://form.test/c?m=a&q={prompt}&t=1&t=2" },
    link: { label: "Link", url: "https://link.test/#prompt={prompt}" },
  },
};
const withOptions: Record<string, RemarkPromptOptions> = {
  "service-kinds": serviceOptions,
};
const allCases: Record<string, string> = {
  ...cases,
  "service-kinds": [
    "```prompt form link gemini",
    "Plan & ship #1.",
    "```",
    "",
  ].join("\n"),
};

describe("HTML contract", () => {
  for (const [name, markdown] of Object.entries(allCases)) {
    it(`remark output for ${name} is pinned`, async () => {
      await expect(
        pretty(await remarkHtml(markdown, withOptions[name])),
      ).toMatchFileSnapshot(`__snapshots__/remark-${name}.html`);
    });

    it(`Sätteri output for ${name} is pinned`, async () => {
      await expect(
        pretty(satteriHtml(markdown, withOptions[name])),
      ).toMatchFileSnapshot(`__snapshots__/satteri-${name}.html`);
    });
  }

  it("emits only contract classes", async () => {
    const html = await remarkHtml(cases["fence-options"]);
    const used = new Set(
      [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) =>
        (m[1] ?? "").split(" "),
      ),
    );
    const known = new Set(Object.values(classes));
    for (const name of used)
      if (name.startsWith("remark-prompt"))
        expect(known.has(name as never), name).toBe(true);
  });
});

describe("stylesheet", () => {
  for (const [key, name] of Object.entries(styledClasses)) {
    it(`styles .${name} (${key})`, () => {
      expect(css).toContain(`.${name}`);
    });
  }

  it("styles no class outside the contract", () => {
    const known = new Set<string>(Object.values(classes));
    for (const [, name] of css.matchAll(/\.(remark-prompt[\w-]*)/g))
      expect(known.has(name as string), name).toBe(true);
  });

  it("leaves hook classes unstyled", () => {
    const styled = new Set(
      [...css.matchAll(/\.(remark-prompt[\w-]*)/g)].map((m) => m[1]),
    );
    for (const name of Object.values(hookClasses))
      expect(styled.has(name), name).toBe(false);
  });
});

describe("client", () => {
  it("takes selectors from the contract, not string literals", () => {
    expect(client).not.toMatch(/["'`]\.?remark-prompt/);
    expect(client).not.toMatch(/["'`]data-/);
  });
});
