// One click listener on `document`, so prompts rendered later by client-side
// navigation work too. Importing on the server does nothing.
import { attributes, classes, selector } from "./core/contract.js";

declare global {
  interface Window {
    __remarkPrompt?: boolean;
  }
}

if (typeof document !== "undefined" && !window.__remarkPrompt) {
  window.__remarkPrompt = true;
  document.addEventListener("click", async (event) => {
    const button =
      event.target instanceof Element &&
      event.target.closest(selector(classes.copy));
    if (!button) return;
    const value = button
      .closest(selector(classes.root))
      ?.getAttribute(attributes.prompt);
    if (value == null) return;
    try {
      await navigator.clipboard.writeText(value);
      button.setAttribute(attributes.copied, "");
      setTimeout(() => button.removeAttribute(attributes.copied), 2000);
    } catch {
      button.setAttribute(attributes.copyFailed, "");
    }
  });
}
