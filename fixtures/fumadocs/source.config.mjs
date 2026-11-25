import { applyMdxPreset, defineDocs } from "fumadocs-mdx/config";
import remarkDirective from "remark-directive";
import remarkPrompt from "remark-prompt";
import { promptOptions } from "../options.mjs";

export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    mdxOptions: applyMdxPreset({
      remarkPlugins: (plugins) => [
        remarkDirective,
        [remarkPrompt, promptOptions],
        ...plugins,
      ],
    }),
  },
});
