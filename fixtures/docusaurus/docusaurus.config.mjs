import remarkPrompt from "remark-prompt";
import { promptOptions } from "../options.mjs";

export default {
  title: "Docusaurus prompt fixture",
  url: "https://example.com",
  baseUrl: "/docusaurus/",
  trailingSlash: true,
  markdown: { format: "detect" },
  plugins: ["remark-prompt/docusaurus"],
  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/",
          remarkPlugins: [[remarkPrompt, promptOptions]],
        },
        blog: false,
        pages: false,
      },
    ],
  ],
};
