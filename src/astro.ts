/** The slice of Astro's integration API this uses, so `astro` isn't a dependency. */
interface AstroIntegrationLike {
  name: string;
  hooks: {
    "astro:config:setup": (params: {
      injectScript: (stage: "page" | "page-ssr", content: string) => void;
    }) => void;
  };
}

/**
 * ## Astro integration
 * Adds the prompt stylesheet and copy script to every page. The Markdown
 * transform itself goes in `markdown.processor`: `satteriPrompt()` from
 * `remark-prompt/satteri`, or `remarkPrompt` under `unified()`.
 */
export default function promptAssets(): AstroIntegrationLike {
  return {
    name: "remark-prompt",
    hooks: {
      "astro:config:setup": ({ injectScript }) => {
        injectScript("page", 'import "remark-prompt/client";');
        injectScript("page-ssr", 'import "remark-prompt/styles.css";');
      },
    },
  };
}
