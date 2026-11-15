// One click listener on `document`, so prompts rendered later by client-side
// navigation work too. Importing on the server does nothing.
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
      event.target.closest(".remark-prompt-copy");
    if (!button) return;
    const value = button.closest(".remark-prompt")?.getAttribute("data-prompt");
    if (value == null) return;
    try {
      await navigator.clipboard.writeText(value);
      button.setAttribute("data-copied", "");
      setTimeout(() => button.removeAttribute("data-copied"), 2000);
    } catch {
      button.setAttribute("data-copy-failed", "");
    }
  });
}

export {};
