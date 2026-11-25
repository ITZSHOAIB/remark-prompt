import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { source } from "../lib/source.mjs";
import { PromptClient } from "./prompt-client";
import "./global.css";
import "remark-prompt/styles.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider search={{ enabled: false }}>
          <PromptClient />
          <DocsLayout
            tree={source.pageTree}
            nav={{ title: "Fumadocs prompt fixture" }}
          >
            {children}
          </DocsLayout>
        </RootProvider>
      </body>
    </html>
  );
}
