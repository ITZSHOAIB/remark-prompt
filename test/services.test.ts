import { describe, expect, it } from "vitest";
import { createRegistry, services } from "../src/core/services.js";
import type { RemarkPromptOptions } from "../src/index.js";
import { remarkHtml, satteriHtml } from "./helpers.js";

const fence = (ids: string, body = "Hello & <world>.") =>
  `\`\`\`prompt ${ids}\n${body}\n\`\`\`\n`;

/** The service controls only: what follows the copy button. */
const actions = (html: string) =>
  html.slice(html.indexOf("</button>", html.indexOf("remark-prompt-copy")) + 9);

const processors: Record<
  string,
  (markdown: string, options?: RemarkPromptOptions) => Promise<string>
> = {
  remark: remarkHtml,
  Sätteri: async (markdown, options) => satteriHtml(markdown, options),
};

const kind = (id: string) => createRegistry().get(id)?.action.kind;

describe("registry", () => {
  const registry = createRegistry();

  it("holds every Mirrordown preset", () => {
    expect([...registry.keys()].sort()).toEqual(
      [
        "chatgpt",
        "claude",
        "copilot",
        "cursor",
        "gemini",
        "github-copilot",
        "grok",
        "mistral",
        "perplexity",
      ].sort(),
    );
  });

  it("turns query templates into forms", () => {
    expect(registry.get("claude")?.action).toEqual({
      kind: "form",
      action: "https://claude.ai/new",
      fields: [["q", null]],
    });
    expect(registry.get("github-copilot")?.action).toEqual({
      kind: "form",
      action: "https://github.com/copilot",
      fields: [["prompt", null]],
    });
  });

  it("makes templates without a placeholder copy-and-open", () => {
    for (const id of ["copilot", "gemini", "mistral", "perplexity"])
      expect(kind(id), id).toBe("copy");
  });

  it("keeps extra and repeated query parameters, in order", () => {
    const custom = createRegistry({
      x: {
        label: "X",
        url: "https://x.test/chat?mode=a&tag=1&q={prompt}&tag=2&flag",
      },
    });
    expect(custom.get("x")?.action).toEqual({
      kind: "form",
      action: "https://x.test/chat",
      fields: [
        ["mode", "a"],
        ["tag", "1"],
        ["q", null],
        ["tag", "2"],
        ["flag", ""],
      ],
    });
  });

  it("keeps a fragment on the form action", () => {
    const custom = createRegistry({
      x: { label: "X", url: "https://x.test/chat?q={prompt}#top" },
    });
    expect(custom.get("x")?.action).toMatchObject({
      action: "https://x.test/chat#top",
    });
  });

  it("splits path and fragment templates into a link", () => {
    const custom = createRegistry({
      path: { label: "P", url: "https://p.test/ask/{prompt}/go?a=1" },
      hash: { label: "H", url: "https://h.test/#prompt={prompt}" },
    });
    expect(custom.get("path")?.action).toEqual({
      kind: "link",
      before: "https://p.test/ask/",
      after: "/go?a=1",
    });
    expect(custom.get("hash")?.action).toEqual({
      kind: "link",
      before: "https://h.test/#prompt=",
      after: "",
    });
  });

  it("lets a custom id replace a preset and stores maxLength", () => {
    const custom = createRegistry({
      claude: { label: "Mine", url: "https://mine.test/", maxLength: 500 },
    });
    expect(custom.get("claude")).toMatchObject({
      label: "Mine",
      maxLength: 500,
      action: { kind: "copy", url: "https://mine.test/" },
    });
    expect(custom.size).toBe(Object.keys(services).length);
  });

  it.each([
    ["a placeholder in the host", "https://{prompt}.test/", /host/],
    ["a placeholder in the userinfo", "https://u:{prompt}@x.test/", /host/],
    ["two placeholders", "https://x.test/{prompt}?q={prompt}", /more than one/],
    [
      "a partial query value",
      "https://x.test/?q=hi-{prompt}",
      /whole query value/,
    ],
    [
      "a placeholder in a query name",
      "https://x.test/?{prompt}=1",
      /whole query value/,
    ],
    ["a javascript: URL", "javascript:alert({prompt})", /http or https/],
    ["a relative URL", "/chat?q={prompt}", /valid URL/],
  ])("rejects %s", (_, url, message) => {
    expect(() => createRegistry({ x: { label: "X", url } })).toThrow(message);
  });

  it.each([
    ["a reserved id", "open"],
    ["another reserved id", "title"],
    ["an id with a space", "my service"],
    ["an empty id", ""],
  ])("rejects %s", (_, id) => {
    expect(() =>
      createRegistry({ [id]: { label: "X", url: "https://x.test/" } }),
    ).toThrow(/ids use/);
  });

  it("rejects a missing label and a bad maxLength, naming the service", () => {
    expect(() =>
      createRegistry({ x: { label: " ", url: "https://x.test/" } }),
    ).toThrow(/"x".*label/);
    for (const maxLength of [0, -1, 1.5, Number.NaN])
      expect(() =>
        createRegistry({
          x: { label: "X", url: "https://x.test/", maxLength },
        }),
      ).toThrow(/"x".*maxLength/);
  });
});

describe.each(Object.entries(processors))("%s output", (_, render) => {
  it("renders every preset with the right control", async () => {
    for (const [id, { label }] of Object.entries(services)) {
      const html = actions(await render(fence(id)));
      expect(html, id).toContain(`>${label}</`);
      expect(html, id).toContain(`aria-label="Open in ${label}"`);
      expect(html.includes("data-open-url"), id).toBe(kind(id) === "copy");
      expect(html.includes("<form"), id).toBe(kind(id) === "form");
    }
  });

  it("uses the default services when none are named, or none are known", async () => {
    for (const ids of ["", "nope", "open"]) {
      const html = actions(await render(fence(ids)));
      expect(html, ids).toContain(">Claude</");
      expect(html, ids).toContain(">ChatGPT</");
      expect(html, ids).not.toContain(">Cursor</");
    }
  });

  it("offers only the named services, ignoring unknown ids", async () => {
    const html = actions(await render(fence("gemini nope grok")));
    expect(html).toContain(">Gemini</");
    expect(html).toContain(">Grok</");
    expect(html).not.toContain("nope");
  });

  it("honors the services option", async () => {
    const html = actions(await render(fence(""), { services: ["gemini"] }));
    expect(html).toContain(">Gemini</");
    expect(html).not.toContain(">Claude</");
  });

  it("emits a copy-and-open button holding only the bare URL", async () => {
    const html = actions(await render(fence("gemini")));
    expect(html).toContain(
      'class="remark-prompt-service" data-open-url="https://gemini.google.com/app"',
    );
    expect(html).not.toContain("Hello");
  });

  it("emits hidden inputs for every query parameter of a custom service", async () => {
    const html = actions(
      await render(fence("x"), {
        customServices: {
          x: { label: "X", url: "https://x.test/c?m=a&q={prompt}&t=1&t=2" },
        },
      }),
    );
    expect(html).toContain('action="https://x.test/c"');
    const names = [...html.matchAll(/<input type="hidden" name="(\w+)"/g)].map(
      (match) => match[1],
    );
    expect(names).toEqual(["m", "q", "t", "t"]);
    expect(html).toMatch(/name="q" value="Hello (&#x26;|&amp;) /);
  });

  it("emits an anchor with an encoded prompt for path and fragment templates", async () => {
    const options = {
      customServices: {
        hash: { label: "Hash", url: "https://h.test/#prompt={prompt}" },
        path: { label: "Path", url: "https://p.test/{prompt}/go" },
      },
    };
    const html = actions(
      await render(fence("hash path", "a&b=c#d%e\nline 2 ü"), options),
    );
    const encoded = "a%26b%3Dc%23d%25e%0Aline%202%20%C3%BC";
    expect(html).toContain(`href="https://h.test/#prompt=${encoded}"`);
    expect(html).toContain(`href="https://p.test/${encoded}/go"`);
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
    expect(html).not.toContain("<form");
  });

  it("selects custom services from directive attributes", async () => {
    const options = {
      customServices: { x: { label: "X", url: "https://x.test/?q={prompt}" } },
    };
    const html = actions(
      await render(":::prompt{x title=T}\nBody\n:::\n", options),
    );
    expect(html).toContain(">X</");
    expect(html).not.toContain(">Claude</");
  });

  it("lets a custom service replace a preset", async () => {
    const html = actions(
      await render(fence("claude"), {
        customServices: {
          claude: {
            label: "Claude (team)",
            url: "https://team.test/?p={prompt}",
          },
        },
      }),
    );
    expect(html).toContain('action="https://team.test/"');
    expect(html).toContain(">Claude (team)</");
  });

  it("fails the build on an invalid configuration", async () => {
    await expect(async () =>
      render(fence(""), { services: ["nope"] }),
    ).rejects.toThrow(/unknown service "nope"/);
    await expect(async () =>
      render(fence(""), {
        customServices: { x: { label: "X", url: "javascript:alert(1)" } },
      }),
    ).rejects.toThrow(/"x"/);
  });
});
