import type { Code, Node } from "mdast";
import type { PromptElement } from "./contract.js";
import { buildPrompt, type Labels } from "./render.js";
import type { ServiceId } from "./services.js";
import {
  type DirectiveLike,
  type PromptMeta,
  parseMeta,
  readDirective,
} from "./syntax.js";

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

// Adapters attach source locations to warnings. Current syntax stays silent.
type WarningSink = (message: string) => void;

interface FileTransform {
  fence(node: Readonly<Code>, warn: WarningSink): PromptElement | undefined;
  directive<Child extends Node>(
    node: DirectiveLike<Child>,
    context: {
      source: () => string;
      labelText: (label: Child) => string;
      warn: WarningSink;
    },
  ): PromptElement | undefined;
}

/** Resolve plugin options once, then create an independent transform per file. */
export function createTransform(
  options: RemarkPromptOptions,
): () => FileTransform {
  const defaults: ServiceId[] = options.services ?? ["claude", "chatgpt"];
  const labels = { ...defaultLabels, ...options.labels };

  return () => {
    let count = 0;

    const render = (value: string, meta: PromptMeta) =>
      buildPrompt(
        {
          ...meta,
          id: `remark-prompt-${count++}`,
          value,
          services: meta.services.length ? meta.services : defaults,
        },
        labels,
      );

    return {
      fence(node) {
        if (node.lang !== "prompt" || !node.value.trim()) return;
        return render(node.value, parseMeta(node.meta ?? ""));
      },
      directive(node, { source, labelText }) {
        if (node.name !== "prompt") return;
        const { value, ...meta } = readDirective(node, source(), labelText);
        if (!value.trim()) return;
        return render(value, meta);
      },
    };
  };
}
