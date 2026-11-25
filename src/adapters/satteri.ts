import type { Code } from "mdast";
import type {
  ContainerDirective,
  MdastPluginDefinition,
  MdastPluginEntry,
  MdastVisitorContext,
} from "satteri";
import {
  createTransform,
  type RemarkPromptOptions,
} from "../core/transform.js";

/**
 * ## Sätteri Prompt
 * The remark-prompt transform as a Sätteri mdast plugin, for Astro 7's
 * default Markdown processor: `satteri({ mdastPlugins: [satteriPrompt()] })`.
 * Same options and same HTML as the remark plugin.
 */
export function satteriPrompt(
  options: RemarkPromptOptions = {},
): MdastPluginEntry {
  const forFile = createTransform(options);

  return () => {
    const transform = forFile();
    const visitPrompt = (
      node: Readonly<Code | ContainerDirective>,
      ctx: MdastVisitorContext,
    ) => {
      const warn = (message: string) => {
        ctx.report({ message, node, severity: "warning" });
      };
      return node.type === "code"
        ? transform.fence(node, warn)
        : transform.directive(node, {
            source: () => ctx.source,
            labelText: (label) => ctx.textContent(label),
            warn,
          });
    };

    const plugin: MdastPluginDefinition = {
      name: "remark-prompt",
      // Positions locate the directive body in the source.
      options: { position: true },
      code: visitPrompt,
      containerDirective: visitPrompt,
    };
    return plugin;
  };
}
