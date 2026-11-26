import type { Code, Node } from "mdast";
import type { PromptElement } from "./contract.js";
import { buildPrompt, type Labels } from "./render.js";
import {
  createRegistry,
  type ResolvedService,
  type ServiceDefinition,
  type ServiceId,
} from "./services.js";
import {
  type DirectiveLike,
  type PromptMeta,
  parseMeta,
  readDirective,
} from "./syntax.js";

export interface RemarkPromptOptions {
  /** Services offered when a prompt names none. Default `["claude", "chatgpt"]`. */
  services?: ServiceId[];
  /** Add services, or replace presets, by id. `{prompt}` marks where the prompt goes. */
  customServices?: Record<string, ServiceDefinition>;
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
  const registry = createRegistry(options.customServices);
  const lookup = (id: string): ResolvedService => {
    const service = registry.get(id);
    if (!service)
      throw new Error(`remark-prompt: services: unknown service "${id}".`);
    return service;
  };
  const defaults = (options.services ?? ["claude", "chatgpt"]).map(lookup);
  const labels = { ...defaultLabels, ...options.labels };

  return () => {
    let count = 0;

    const render = (value: string, meta: PromptMeta) => {
      const named = meta.services.flatMap((id) => registry.get(id) ?? []);
      return buildPrompt(
        {
          ...meta,
          id: `remark-prompt-${count++}`,
          value,
          services: named.length ? named : defaults,
        },
        labels,
      );
    };

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
