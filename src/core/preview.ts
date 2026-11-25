import type { RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { visit } from "unist-util-visit";

/**
 * The preview is parsed as CommonMark + GFM on its own, never as the page's
 * MDX, so `<NAME>` and `{var}` in a prompt can't break it. HTML shows as text.
 */
export const parsePreview = (value: string) => {
  const tree = fromMarkdown(value, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });
  visit(tree, "html", (node, index, parent) => {
    if (parent && index !== undefined) {
      const children: RootContent[] = parent.children;
      children[index] = { type: "text", value: node.value };
    }
  });
  return tree.children;
};
