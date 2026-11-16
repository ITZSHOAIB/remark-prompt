# remark-prompt

remark-prompt turns prompts written in Markdown docs into blocks that readers can copy or open in an AI service.

## Language

### Authoring

**Prompt**:
The text a reader copies or sends to a service, exactly as the author wrote it.
_Avoid_: prompt text, content, body

**Syntax**:
The way an author writes a prompt block in Markdown: a fence or a directive.

**Fence**:
A code block whose language is `prompt`. It's the syntax that works everywhere, including MDX.
_Avoid_: code fence prompt, prompt code block

**Directive**:
A `:::prompt` container. It's a convenience syntax and needs directive support in the host.
_Avoid_: container, admonition

**Invisible character**:
A character in a prompt that takes up no visible space, such as a zero-width space or a Unicode tag character. It can hide instructions from the reader.
_Avoid_: hidden text, zero-width (as a noun)

### Reading

**Prompt block**:
The rendered unit around one prompt: its title, preview, Markdown view and actions.
_Avoid_: widget, card, prompt component, island

**Service**:
A destination a reader can open a prompt in, such as Claude, ChatGPT or Cursor.
_Avoid_: provider, target, integration, AI tool

**Preset**:
A service that ships with remark-prompt, so authors can name it without defining it.
_Avoid_: built-in service, default service

**Copy-and-open**:
Copying the prompt and opening the service empty for the reader to paste. It's used when a service can't take the prompt in its link, or the prompt is too long for it.
_Avoid_: fallback, overflow mode

### Integration

**Host**:
The docs framework a site is built with, such as Docusaurus, Starlight, Fumadocs, Nextra or Rspress.
_Avoid_: platform, site generator, framework (when ambiguous)

**Adapter**:
The glue that connects remark-prompt to one host or Markdown processor, such as the remark, Sätteri, Astro and Docusaurus entry points.
_Avoid_: integration, wrapper, plugin (when ambiguous)

**Fixture**:
A minimal real site for one host, kept in the repo to test and demonstrate remark-prompt.
_Avoid_: example, sandbox, playground
