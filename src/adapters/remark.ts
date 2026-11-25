import type { Root, RootContent } from "mdast";
import { visit } from "unist-util-visit";
import {
  createTransform,
  type RemarkPromptOptions,
} from "../core/transform.js";

const textOf = (node: RootContent): string => {
  if ("value" in node && typeof node.value === "string") return node.value;
  return "children" in node ? node.children.map(textOf).join("") : "";
};

/**
 * ## remark-prompt
 * Turns ```` ```prompt ```` fences, and `:::prompt` containers when
 * remark-directive is in use, into prompt blocks: a collapsible preview, a
 * Markdown view, Copy, and "Open in Claude / ChatGPT / Cursor".
 */
export default function remarkPrompt(options: RemarkPromptOptions = {}) {
  const forFile = createTransform(options);

  return (
    tree: Root,
    file: {
      value?: unknown;
      message?: (message: string, place?: RootContent["position"]) => unknown;
    },
  ) => {
    const source = String(file.value ?? "");
    const transform = forFile();

    visit(tree, (node, index, parent) => {
      if (!parent || index === undefined) return;
      if (node.type !== "code" && node.type !== "containerDirective") return;

      const warn = (message: string) => {
        file.message?.(message, node.position);
      };
      const replacement =
        node.type === "code"
          ? transform.fence(node, warn)
          : transform.directive(node, {
              source: () => source,
              labelText: textOf,
              warn,
            });
      if (!replacement) return;

      const children: RootContent[] = parent.children;
      children[index] = replacement;
      return "skip";
    });
  };
}
