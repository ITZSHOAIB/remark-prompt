import { compile } from "@mdx-js/mdx";
import remarkDirective from "remark-directive";
import { describe, expect, it } from "vitest";
import remarkPrompt from "../src/index.js";

const compileMdx = async (source: string) =>
  String(
    await compile(source, { remarkPlugins: [remarkDirective, remarkPrompt] }),
  );

describe("MDX", () => {
  it("compiles a fence whose prompt is invalid MDX", async () => {
    const js = await compileMdx(
      '<Note>JSX still works.</Note>\n\n```prompt title="Tabs"\nAdd tabs to <PROJECT_NAME>, see {pageUrl}.\n```\n',
    );
    expect(js).toContain(
      '"data-prompt": "Add tabs to <PROJECT_NAME>, see {pageUrl}."',
    );
    // Elements go through the MDX components map, so themes can restyle them.
    expect(js).toContain("_components.details");
    expect(js).toContain("_components.pre");
  });

  it("compiles a directive whose prompt is valid MDX", async () => {
    const js = await compileMdx(
      ':::prompt{title="Short"}\nSummarize **this page**.\n:::\n',
    );
    expect(js).toContain('"data-prompt": "Summarize **this page**."');
  });

  // Why the docs lead with the fence: MDX parses `<NAME>` as JSX before any
  // plugin runs, so no plugin can rescue a directive that contains it.
  it("cannot compile a directive whose prompt is invalid MDX", async () => {
    await expect(
      compileMdx(":::prompt\nSummarize this page for <NAME>.\n:::\n"),
    ).rejects.toThrow(/Expected a closing tag for `<NAME>`/);
  });
});
