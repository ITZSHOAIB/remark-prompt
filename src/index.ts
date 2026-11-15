import type { Code, Root } from "mdast";
import { visit } from "unist-util-visit";
import {
  buildPrompt,
  type DirectiveLike,
  parseMeta,
  type RemarkPromptOptions,
  readDirective,
} from "./build.js";

export {
  type Labels,
  type RemarkPromptOptions,
  type ServiceId,
  services,
} from "./build.js";

const textOf = (node: unknown): string => {
  const { value, children } = node as { value?: unknown; children?: unknown[] };
  if (typeof value === "string") return value;
  return children?.map(textOf).join("") ?? "";
};

/**
 * ## remark-prompt
 * Turns ```` ```prompt ```` fences, and `:::prompt` containers when
 * remark-directive is in use, into prompt blocks: a collapsible preview, a
 * Markdown view, Copy, and "Open in Claude / ChatGPT / Cursor".
 */
export default function remarkPrompt(options: RemarkPromptOptions = {}) {
  const defaults = options.services ?? ["claude", "chatgpt"];

  return (tree: Root, file: { value?: unknown }) => {
    const source = String(file.value ?? "");
    let count = 0;
    const nextId = () => `remark-prompt-${count++}`;

    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return;

      if (node.type === "code") {
        const code = node as Code;
        if (code.lang !== "prompt" || !code.value.trim()) return;
        const meta = parseMeta(code.meta ?? "");
        parent.children[index] = buildPrompt(
          {
            ...meta,
            id: nextId(),
            value: code.value,
            services: meta.services.length ? meta.services : defaults,
          },
          options.labels,
        ) as (typeof parent.children)[number];
        return "skip";
      }

      if (node.type === "containerDirective") {
        const directive = node as DirectiveLike & { name?: string };
        if (directive.name !== "prompt") return;
        const read = readDirective(directive, source, textOf);
        if (!read.value.trim()) return;
        parent.children[index] = buildPrompt(
          {
            ...read,
            id: nextId(),
            services: read.services.length ? read.services : defaults,
          },
          options.labels,
        ) as (typeof parent.children)[number];
        return "skip";
      }
    });
  };
}
