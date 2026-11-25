import type { Node } from "mdast";
import { isService, type ServiceId } from "./services.js";

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

export interface DirectiveLike<Child extends Node> {
  name: string;
  attributes?: Record<string, string | null | undefined> | null;
  children: readonly Child[];
}

const isLabel = ({ data }: Node) =>
  data && "directiveLabel" in data && data.directiveLabel;

/**
 * Read a `:::prompt` container. The prompt text is the source between the
 * first and last child, so it stays exactly as written.
 */
export const readDirective = <Child extends Node>(
  node: DirectiveLike<Child>,
  source: string,
  labelText: (label: Child) => string,
): PromptMeta & { value: string } => {
  const label = node.children.find(isLabel);
  const body = node.children.filter((child) => !isLabel(child));
  const start = body[0]?.position?.start.offset;
  const end = body.at(-1)?.position?.end.offset;
  const attributes = node.attributes ?? {};
  const { title } = attributes;
  return {
    value:
      start === undefined || end === undefined ? "" : source.slice(start, end),
    title: title ?? (label ? labelText(label) : undefined),
    open: "open" in attributes,
    services: Object.keys(attributes).filter(isService),
  };
};
