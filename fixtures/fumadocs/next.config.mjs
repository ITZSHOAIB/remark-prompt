import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX({ configPath: "source.config.mjs" });

export default withMDX({
  output: "export",
  basePath: "/fumadocs",
  trailingSlash: true,
  images: { unoptimized: true },
});
