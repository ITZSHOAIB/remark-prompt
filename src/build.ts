import type { RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { visit } from "unist-util-visit";

/** Where "Open in …" sends the prompt: a GET form to `action` with the prompt in `field`. */
export const services = {
  claude: { label: "Claude", action: "https://claude.ai/new", field: "q" },
  chatgpt: {
    label: "ChatGPT",
    action: "https://chatgpt.com/",
    field: "prompt",
  },
  cursor: {
    label: "Cursor",
    action: "https://cursor.com/link/prompt",
    field: "text",
  },
} as const;

export type ServiceId = keyof typeof services;

export interface Labels {
  /** Summary text when a prompt has no title. Default `"Prompt"`. */
  title: string;
  preview: string;
  markdown: string;
  copy: string;
  /** Accessible name of each service button; `{service}` is replaced. */
  open: string;
}

export interface RemarkPromptOptions {
  /** Services offered when a prompt names none. Default `["claude", "chatgpt"]`. */
  services?: ServiceId[];
  /** UI strings, for translated sites. */
  labels?: Partial<Labels>;
}

const defaultLabels: Labels = {
  title: "Prompt",
  preview: "Preview",
  markdown: "Markdown",
  copy: "Copy",
  open: "Open in {service}",
};

export const isService = (value: string): value is ServiceId =>
  Object.hasOwn(services, value);

type Properties = Record<string, unknown>;

/** An mdast node that every processor turns into a real element via `data.hName`. */
type ElementNode = {
  type: "promptElement";
  data: { hName: string; hProperties: Properties };
  children: unknown[];
};

const el = (
  tagName: string,
  properties: Properties,
  children: unknown[] = [],
): ElementNode => ({
  type: "promptElement",
  data: { hName: tagName, hProperties: properties },
  children,
});

const text = (value: string) => ({ type: "text", value });

export interface PromptMeta {
  title?: string;
  open: boolean;
  services: ServiceId[];
}

const titlePattern = /title=(?:"([^"]*)"|'([^']*)'|(\S+))/;

/** Read fence meta: `title="…"`, `open`, and service ids. */
export const parseMeta = (meta: string): PromptMeta => {
  const title = titlePattern.exec(meta);
  const words = meta.replace(titlePattern, "").split(/\s+/).filter(Boolean);
  return {
    title: title ? (title[1] ?? title[2] ?? title[3]) : undefined,
    open: words.includes("open"),
    services: words.filter(isService),
  };
};

/**
 * The preview is parsed as CommonMark + GFM on its own, never as the page's
 * MDX, so `<NAME>` and `{var}` in a prompt can't break it. HTML shows as text.
 */
const parsePreview = (value: string) => {
  const tree = fromMarkdown(value, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  visit(tree, "html", (node, index, parent) => {
    if (parent && index !== undefined)
      parent.children[index] = text(node.value) as RootContent;
  });
  return tree.children;
};

export interface PromptInput extends PromptMeta {
  id: string;
  value: string;
}

/** Build the prompt block as mdast nodes carrying element hints. */
export const buildPrompt = (
  { id, value, title, open, services: offered }: PromptInput,
  labels: Partial<Labels> = {},
): RootContent => {
  const t = { ...defaultLabels, ...labels };
  const view = (name: string, label: string) => [
    el("input", {
      type: "radio",
      name: `${id}-view`,
      id: `${id}-${name}`,
      value: name,
      className: ["remark-prompt-view", `remark-prompt-view-${name}`],
    }),
    el("label", { htmlFor: `${id}-${name}` }, [text(label)]),
  ];

  return el("div", { className: ["remark-prompt"], id, dataPrompt: value }, [
    el(
      "details",
      { className: ["remark-prompt-details"], open: open || undefined },
      [
        el("summary", { className: ["remark-prompt-title"] }, [
          text(title ?? t.title),
        ]),
        el("div", { className: ["remark-prompt-body"] }, [
          // No `checked`: the preview shows by default through CSS, so
          // React-rendered sites never see a controlled input.
          el(
            "div",
            {
              className: ["remark-prompt-views"],
              role: "radiogroup",
              ariaLabel: "View",
            },
            [...view("preview", t.preview), ...view("markdown", t.markdown)],
          ),
          el(
            "div",
            { className: ["remark-prompt-preview"] },
            parsePreview(value),
          ),
          // A plain code block, so the site's own highlighter renders it.
          el("div", { className: ["remark-prompt-source"] }, [
            { type: "code", lang: "markdown", meta: null, value },
          ]),
        ]),
      ],
    ),
    el("div", { className: ["remark-prompt-actions"] }, [
      el("button", { type: "button", className: ["remark-prompt-copy"] }, [
        text(t.copy),
      ]),
      ...offered.map((key) => {
        const service = services[key];
        return el(
          "form",
          {
            className: ["remark-prompt-service"],
            action: service.action,
            method: "get",
            target: "_blank",
          },
          [
            el("input", { type: "hidden", name: service.field, value }),
            el(
              "button",
              {
                type: "submit",
                ariaLabel: t.open.replace("{service}", service.label),
              },
              [text(service.label)],
            ),
          ],
        );
      }),
    ]),
  ]) as unknown as RootContent;
};

type DirectiveChild = {
  data?: { directiveLabel?: boolean };
  position?: { start: { offset?: number }; end: { offset?: number } };
};

export interface DirectiveLike {
  attributes?: Record<string, string | null | undefined> | null;
  children: DirectiveChild[];
}

/**
 * Read a `:::prompt` container. The prompt text is the source between the
 * first and last child, so it stays exactly as written.
 */
export const readDirective = (
  node: DirectiveLike,
  source: string,
  labelText: (label: DirectiveChild) => string,
): PromptMeta & { value: string } => {
  const label = node.children.find((child) => child.data?.directiveLabel);
  const body = node.children.filter((child) => !child.data?.directiveLabel);
  const start = body[0]?.position?.start.offset;
  const end = body.at(-1)?.position?.end.offset;
  const attributes = node.attributes ?? {};
  return {
    value:
      start === undefined || end === undefined ? "" : source.slice(start, end),
    title: attributes["title"] ?? (label ? labelText(label) : undefined),
    open: "open" in attributes,
    services: Object.keys(attributes).filter(isService),
  };
};
