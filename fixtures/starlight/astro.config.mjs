import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import promptAssets from "remark-prompt/astro";
import { satteriPrompt } from "remark-prompt/satteri";
import { promptOptions } from "../options.mjs";

export default defineConfig({
  base: "/starlight/",
  trailingSlash: "always",
  markdown: {
    processor: satteri({ mdastPlugins: [satteriPrompt(promptOptions)] }),
  },
  integrations: [
    starlight({
      title: "Starlight prompt fixture",
      sidebar: [
        { label: "Prompt fixtures", slug: "" },
        { label: "Prompt fences", slug: "fences" },
      ],
    }),
    mdx(),
    promptAssets(),
  ],
});
