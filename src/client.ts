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
    const target = event.target instanceof Element ? event.target : null;
    const opener = target?.closest(`[${attributes.openUrl}]`);
    const button = opener ?? target?.closest(selector(classes.copy));
    if (!button) return;
    const value = button
      .closest(selector(classes.root))
      ?.getAttribute(attributes.prompt);
    if (value == null) return;
    // Open first: a window opened after the clipboard await loses the click.
    const url = opener?.getAttribute(attributes.openUrl);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(value);
      button.setAttribute(attributes.copied, "");
      setTimeout(() => button.removeAttribute(attributes.copied), 2000);
    } catch {
      button.setAttribute(attributes.copyFailed, "");
    }
  });
}
