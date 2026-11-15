import type { MdastPluginDefinition, MdastPluginEntry } from "satteri";
import {
  buildPrompt,
  type DirectiveLike,
  parseMeta,
  type RemarkPromptOptions,
  readDirective,
} from "./build.js";

export type { Labels, RemarkPromptOptions, ServiceId } from "./build.js";

/**
 * ## Sätteri Prompt
 * The remark-prompt transform as a Sätteri mdast plugin, for Astro 7's
 * default Markdown processor: `satteri({ mdastPlugins: [satteriPrompt()] })`.
 * Same options and same HTML as the remark plugin.
 */
export function satteriPrompt(
  options: RemarkPromptOptions = {},
): MdastPluginEntry {
  const defaults = options.services ?? ["claude", "chatgpt"];

  // A factory, so every file gets its own id counter.
  return () => {
    let count = 0;
    const nextId = () => `remark-prompt-${count++}`;

    const plugin: MdastPluginDefinition = {
      name: "remark-prompt",
      // Positions locate the directive body in the source.
      options: { position: true },
      code(node) {
        if (node.lang !== "prompt" || !node.value.trim()) return;
        const meta = parseMeta(node.meta ?? "");
        return buildPrompt(
          {
            ...meta,
            id: nextId(),
            value: node.value,
            services: meta.services.length ? meta.services : defaults,
          },
          options.labels,
        ) as never;
      },
      containerDirective(node, ctx) {
        if (node.name !== "prompt") return;
        const read = readDirective(
          node as unknown as DirectiveLike,
          ctx.source,
          (label) => ctx.textContent(label as never),
        );
        if (!read.value.trim()) return;
        return buildPrompt(
          {
            ...read,
            id: nextId(),
            services: read.services.length ? read.services : defaults,
          },
          options.labels,
        ) as never;
      },
    };
    return plugin;
  };
}

export default satteriPrompt;
