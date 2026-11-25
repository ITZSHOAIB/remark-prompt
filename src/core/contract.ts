import type { Parent } from "mdast";

/** An mdast node rendered as a real element through `data.hName`. */
export interface PromptElement extends Parent {
  type: "promptElement";
  data: { hName: string; hProperties: Record<string, unknown> };
}

declare module "mdast" {
  interface BlockContentMap {
    promptElement: PromptElement;
  }

  interface RootContentMap {
    promptElement: PromptElement;
  }
}

/**
 * The markup contract. The stylesheet, the browser client and user CSS
 * overrides all depend on these names, so changing one is a semver change.
 */
const root = "remark-prompt";

/** Classes the bundled stylesheet styles. Every one must appear in `styles.css`. */
export const styledClasses = {
  root,
  title: `${root}-title`,
  views: `${root}-views`,
  viewMarkdown: `${root}-view-markdown`,
  preview: `${root}-preview`,
  source: `${root}-source`,
  actions: `${root}-actions`,
  copy: `${root}-copy`,
  service: `${root}-service`,
} as const;

/** Classes that exist for user CSS and scripts; the stylesheet leaves them alone. */
export const hookClasses = {
  details: `${root}-details`,
  body: `${root}-body`,
  view: `${root}-view`,
  viewPreview: `${root}-view-preview`,
} as const;

export const classes = { ...styledClasses, ...hookClasses } as const;

/** Attribute names, as written in HTML. */
export const attributes = {
  /** On the root: the prompt text, stored once. */
  prompt: "data-prompt",
  /** On the copy button while "copied" shows. */
  copied: "data-copied",
  /** On the copy button after the clipboard refused. */
  copyFailed: "data-copy-failed",
} as const;

export const selector = (name: string) => `.${name}`;
