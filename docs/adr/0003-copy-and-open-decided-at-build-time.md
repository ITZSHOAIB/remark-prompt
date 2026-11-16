# Copy-and-open is decided at build time, per service

Every service accepts only a limited prompt length in its link:
- Claude truncates `q` at about 14,000 characters.
- Cursor rejects links longer than 10,000 URL-encoded characters.
- ChatGPT's limit is undocumented.

When the plugin builds the page, it measures each prompt's encoded length for each service, using the encoding that service's link actually uses:
- **A template with `{prompt}` in the query** becomes a GET form. Each other query parameter becomes its own hidden input, because a form drops the `action`'s query string. Its length is measured as a form encodes it: `URLSearchParams`, with CRLF line breaks.
- **A template with `{prompt}` in the hash or path** (Lovable's `#prompt=`) can't be a form. It becomes an `<a>`, measured with `encodeURIComponent`. Every service has a limit:
- Claude: 14,000 characters
- Cursor: 10,000 encoded characters
- everything else: 8,000 encoded characters, overridable with `maxLength`

Above its limit, a service's button is marked for copy-and-open: the copy script copies the prompt and opens the bare service URL. A service whose URL has no `{prompt}` always uses copy-and-open.

## Considered options

- **Decide in the browser:** rejected. It needs the same encoding rules shipped to the client, and it hides the result from the build, so the HTML snapshot couldn't show it.
- **One global cap, as Mirrordown does (8,000):** rejected. It sends Claude prompts to copy-and-open when Claude would accept them, and it lets Cursor prompts through that are already too long.

## Consequences

Without JavaScript, a too-long prompt still submits through the form and may arrive truncated. The form is the progressive-enhancement baseline, and copy-and-open needs the script.
