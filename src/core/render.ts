import type { RootContent, Text } from "mdast";
import { classes, type PromptElement } from "./contract.js";
import { parsePreview } from "./preview.js";
import type { ResolvedService } from "./services.js";
import type { PromptMeta } from "./syntax.js";

export interface Labels {
  /** Summary text when a prompt has no title. Default `"Prompt"`. */
  title: string;
  preview: string;
  markdown: string;
  copy: string;
  /** Accessible name of each service button; `{service}` is replaced. */
  open: string;
}

type Properties = Record<string, unknown>;

const el = (
  tagName: string,
  properties: Properties,
  children: RootContent[] = [],
): PromptElement => ({
  type: "promptElement",
  data: { hName: tagName, hProperties: properties },
  children,
});

const text = (value: string): Text => ({ type: "text", value });

export interface PromptInput extends Omit<PromptMeta, "services"> {
  id: string;
  value: string;
  services: readonly ResolvedService[];
}

/** The "Open in …" control: a form, a link, or a copy-and-open button. */
const serviceAction = (
  { label, action }: ResolvedService,
  value: string,
  labels: Labels,
): PromptElement => {
  const name = { ariaLabel: labels.open.replace("{service}", label) };
  const className = [classes.service];
  if (action.kind === "form")
    return el(
      "form",
      { className, action: action.action, method: "get", target: "_blank" },
      [
        ...action.fields.map(([field, fixed]) =>
          el("input", { type: "hidden", name: field, value: fixed ?? value }),
        ),
        el("button", { type: "submit", ...name }, [text(label)]),
      ],
    );
  if (action.kind === "link")
    return el(
      "a",
      {
        className,
        href: `${action.before}${encodeURIComponent(value)}${action.after}`,
        target: "_blank",
        rel: ["noopener", "noreferrer"],
        ...name,
      },
      [text(label)],
    );
  return el(
    "button",
    { type: "button", className, dataOpenUrl: action.url, ...name },
    [text(label)],
  );
};

/** Build the prompt block as mdast nodes carrying element hints. */
export const buildPrompt = (
  { id, value, title, open, services: offered }: PromptInput,
  labels: Labels,
): PromptElement => {
  const view = (name: "preview" | "markdown", label: string) => [
    el("input", {
      type: "radio",
      name: `${id}-view`,
      id: `${id}-${name}`,
      value: name,
      className: [
        classes.view,
        name === "preview" ? classes.viewPreview : classes.viewMarkdown,
      ],
    }),
    el("label", { htmlFor: `${id}-${name}` }, [text(label)]),
  ];

  return el("div", { className: [classes.root], id, dataPrompt: value }, [
    el("details", { className: [classes.details], open: open || undefined }, [
      el("summary", { className: [classes.title] }, [
        text(title ?? labels.title),
      ]),
      el("div", { className: [classes.body] }, [
        // No `checked`: the preview shows by default through CSS, so
        // React-rendered sites never see a controlled input.
        el(
          "div",
          {
            className: [classes.views],
            role: "radiogroup",
            ariaLabel: "View",
          },
          [
            ...view("preview", labels.preview),
            ...view("markdown", labels.markdown),
          ],
        ),
        el("div", { className: [classes.preview] }, parsePreview(value)),
        // A plain code block, so the site's own highlighter renders it.
        el("div", { className: [classes.source] }, [
          { type: "code", lang: "markdown", meta: null, value },
        ]),
      ]),
    ]),
    el("div", { className: [classes.actions] }, [
      el("button", { type: "button", className: [classes.copy] }, [
        text(labels.copy),
      ]),
      ...offered.map((service) => serviceAction(service, value, labels)),
    ]),
  ]);
};
