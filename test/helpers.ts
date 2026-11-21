import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { markdownToHtml } from "satteri";
import { unified } from "unified";
import remarkPrompt, { type RemarkPromptOptions } from "../src/index.js";
import { satteriPrompt } from "../src/satteri.js";

export const remarkHtml = async (
  markdown: string,
  options?: RemarkPromptOptions,
) =>
  String(
    await unified()
      .use(remarkParse)
      .use(remarkDirective)
      .use(remarkPrompt, options)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(markdown),
  );

export const satteriHtml = (markdown: string, options?: RemarkPromptOptions) =>
  markdownToHtml(markdown, {
    features: { directive: true },
    mdastPlugins: [satteriPrompt(options)],
  }).html;

/** Every `data-prompt` value, decoded. */
export const prompts = (html: string) =>
  [...html.matchAll(/data-prompt="([^"]*)"/g)].map((match) =>
    decode(match[1] ?? ""),
  );

const decode = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");

const token = /<\/?[a-z][^\s/>]*(?:"[^"]*"|'[^']*'|[^>"'])*>|[^<]+|</g;
const voidTag = /^<(input|br|hr|img)\b/;

/**
 * One tag per line, indented by depth, so snapshots read and diff well.
 * Text stays on its parent's line and is never reindented.
 */
export const pretty = (html: string) => {
  const lines: string[] = [];
  let depth = 0;
  let inline = false; // the last line is an open tag followed by its text
  for (const part of html.match(token) ?? []) {
    if (!part.startsWith("<") || part === "<") {
      if (!part.trim() && !inline) continue;
      lines[lines.length - 1] += part;
      inline = true;
    } else if (part.startsWith("</")) {
      depth = Math.max(0, depth - 1);
      if (inline) lines[lines.length - 1] += part;
      else lines.push(`${"  ".repeat(depth)}${part}`);
      inline = false;
    } else {
      lines.push(`${"  ".repeat(depth)}${part}`);
      if (!voidTag.test(part)) depth++;
      inline = false;
    }
  }
  return lines.join("\n");
};
