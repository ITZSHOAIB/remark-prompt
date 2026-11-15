// Docusaurus plugin: `plugins: ["remark-prompt/docusaurus"]` adds the
// stylesheet and copy script. CommonJS, because Docusaurus loads config
// through jiti, which turns imports into `require()`.

function remarkPromptDocusaurus() {
  return {
    name: "remark-prompt",
    getClientModules() {
      return [require.resolve("./client.js"), require.resolve("./styles.css")];
    },
  };
}

export = remarkPromptDocusaurus;
