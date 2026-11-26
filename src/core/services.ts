/**
 * A service the prompt can be sent to. `url` may hold one `{prompt}`
 * placeholder: in a query value, the path or the fragment. Without one, the
 * service opens by copy-and-open.
 */
export interface ServiceDefinition {
  label: string;
  url: string;
  /** Longest prompt, in characters, the service's link may carry. */
  maxLength?: number;
}

/** Match Mirrordown 0.1.x ids, labels and destinations. */
export const services = {
  chatgpt: { label: "ChatGPT", url: "https://chatgpt.com/?prompt={prompt}" },
  claude: { label: "Claude", url: "https://claude.ai/new?q={prompt}" },
  cursor: {
    label: "Cursor",
    url: "https://cursor.com/link/prompt?text={prompt}",
  },
  "github-copilot": {
    label: "GitHub Copilot",
    url: "https://github.com/copilot?prompt={prompt}",
  },
  grok: { label: "Grok", url: "https://grok.com/?q={prompt}" },
  copilot: {
    label: "Microsoft Copilot",
    url: "https://copilot.microsoft.com/",
  },
  gemini: { label: "Gemini", url: "https://gemini.google.com/app" },
  mistral: { label: "Le Chat", url: "https://chat.mistral.ai/chat" },
  perplexity: { label: "Perplexity", url: "https://www.perplexity.ai/" },
} as const satisfies Record<string, ServiceDefinition>;

export type PresetId = keyof typeof services;

/** A preset id or a custom one; presets still autocomplete. */
export type ServiceId = PresetId | (string & {});

/** Written in fences and directives as bare words, so they can't be these. */
const reserved = new Set(["open", "title"]);
const validId = /^[A-Za-z0-9][\w-]*$/;

const placeholder = "{prompt}";

/** How "Open in …" reaches the service, decided from its URL template. */
export type ServiceAction =
  /** A GET form: `fields` become hidden inputs, `null` marks the prompt. */
  | {
      kind: "form";
      action: string;
      fields: readonly (readonly [name: string, value: string | null])[];
    }
  /** A link with the encoded prompt between `before` and `after`. */
  | { kind: "link"; before: string; after: string }
  /** Copy the prompt, then open `url`. */
  | { kind: "copy"; url: string };

export interface ResolvedService {
  id: string;
  label: string;
  maxLength?: number;
  action: ServiceAction;
}

const fail = (id: string, message: string): never => {
  throw new Error(`remark-prompt: service "${id}": ${message}`);
};

const parseAction = (id: string, template: string): ServiceAction => {
  const first = template.indexOf(placeholder);
  const url = (probe: string) => {
    try {
      return new URL(probe);
    } catch {
      return fail(id, `"${template}" is not a valid URL.`);
    }
  };
  const { protocol } = url(template.replace(placeholder, "x"));
  if (protocol !== "https:" && protocol !== "http:")
    fail(id, `"${template}" must be an http or https URL.`);
  if (first === -1) return { kind: "copy", url: template };
  if (template.indexOf(placeholder, first + 1) !== -1)
    fail(id, `"${template}" has more than one ${placeholder}.`);

  const origin = /^https?:\/\/[^/?#]*/i.exec(template)?.[0] ?? "";
  if (first < origin.length)
    fail(id, `${placeholder} can't be in the host of "${template}".`);

  const hash = template.indexOf("#");
  const query = template.indexOf("?");
  const inQuery =
    query !== -1 && query < first && (hash === -1 || first < hash);
  if (!inQuery)
    return {
      kind: "link",
      before: template.slice(0, first),
      after: template.slice(first + placeholder.length),
    };

  const end = hash === -1 ? template.length : hash;
  const fields: [string, string | null][] = [];
  for (const pair of template.slice(query + 1, end).split("&")) {
    if (pair === "") continue;
    if (pair.includes(placeholder)) {
      if (!pair.endsWith(`=${placeholder}`))
        fail(
          id,
          `${placeholder} must be a whole query value, as in "?q=${placeholder}".`,
        );
      const [[name = ""]] = new URLSearchParams(
        pair.slice(0, -placeholder.length),
      );
      fields.push([name, null]);
      continue;
    }
    for (const entry of new URLSearchParams(pair)) fields.push(entry);
  }
  return {
    kind: "form",
    action:
      template.slice(0, query) + (hash === -1 ? "" : template.slice(hash)),
    fields,
  };
};

const resolveService = (
  id: string,
  { label, url, maxLength }: ServiceDefinition,
): ResolvedService => {
  if (!validId.test(id) || reserved.has(id))
    fail(id, "ids use letters, digits, - and _, and can't be open or title.");
  if (typeof label !== "string" || !label.trim()) fail(id, "needs a label.");
  if (
    maxLength !== undefined &&
    !(Number.isInteger(maxLength) && maxLength > 0)
  )
    fail(id, "maxLength must be a positive integer.");
  return { id, label, maxLength, action: parseAction(id, String(url)) };
};

/** Presets plus `customServices`; a custom id adds a service or replaces a preset. */
export const createRegistry = (
  custom: Record<string, ServiceDefinition> = {},
): ReadonlyMap<string, ResolvedService> =>
  new Map(
    Object.entries({ ...services, ...custom }).map(([id, definition]) => [
      id,
      resolveService(id, definition),
    ]),
  );
