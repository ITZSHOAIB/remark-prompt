/** Where "Open in …" sends the prompt: a GET form to `action` with the prompt in `field`. */
export const services = {
  claude: { label: "Claude", action: "https://claude.ai/new", field: "q" },
  chatgpt: {
    label: "ChatGPT",
    action: "https://chatgpt.com/",
    field: "prompt",
  },
  cursor: {
    label: "Cursor",
    action: "https://cursor.com/link/prompt",
    field: "text",
  },
} as const;

export type ServiceId = keyof typeof services;

export const isService = (value: string): value is ServiceId =>
  Object.hasOwn(services, value);
