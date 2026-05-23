# OpenMarkdown

A browser-based Markdown and Mermaid diagram editor deployed on Cloudflare Workers. It can be run fully locally or deployed as a self-hosted instance, optionally protected by Cloudflare Access SSO.

Great for non-technical stakeholders who need to open markdown files but don't have VS Code installed or similar, and don't want to trust third party sites with the file!

> **No user modified markdown or files exist on a server**, only on Browser localStorage; this means it will appear when the user closes the tab or browser; but clearing the cache will wipe it. This tool is not designed for storing long-term markdown files.

<img width="2560" height="1279" alt="image" src="https://github.com/user-attachments/assets/b3a35d9d-03c0-4053-9ffe-72e9b06d541f" />


## Features

- **Live preview** - WYSIWYG or Side-by-Side view for editor and rendered output, updates as you type
- **Mermaid diagrams** - flowcharts, sequence diagrams, and more render inline
- **Callouts / admonitions** - Obsidian-style `[!note]`, `[!warning]`, etc. with icons and colour coding, including foldable variants
- **Formatting Toolbar & Context Menu** - native GUI for inserting elements without remembering syntax
- **PDF export** - clean print stylesheet that hides the editor UI and natively paginates; diagrams re-render at export time
- **Templates** - built-in templates for meeting notes, design reviews, handovers, and change requests
- **Dark / light theme** - persists in localStorage
- **Auto-save & Tabs** - editor content preserved across page reloads via localStorage; up to 10 tabs supported
- **File import** - drag-and-drop or file picker to load `.md` files
- **Document stats** - live word count, character count, and reading time estimate
- **Security** - XSS protection via DOMPurify, Content Security Policy, and optional JWT validation

<img width="2560" height="1279" alt="image" src="https://github.com/user-attachments/assets/45f9875e-47e4-4d54-9d2c-372bbaac975a" />


## Authentication & Security

By default, JWT validation is **not enabled**, allowing the tool to run locally or as a public instance without any configuration. 

However, **Cloudflare One (SSO) protection is highly recommended** if you plan to customise or add built-in templates that contain company-specific information, infrastructure details, proprietary schemas, or other sensitive guidelines. 

To enable protection:
1. Set up a Cloudflare Access application gating your deployed Worker.
2. Add the environment variable `CF_ACCESS_TEAM_NAME` (your Access team subdomain) within wrangler.jsonc
3. Add Secret Value within Cloudflare Worker `CF_ACCESS_AUDIENCE` (the Access Application Audience Audience Tag).
4. The backend worker will automatically validate all incoming `Cf-Access-Jwt-Assertion` headers against Cloudflare's JWKS endpoint.

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers (TypeScript) + Cloudflare Workers Assets |
| Bundler | Wrangler 4.0+ |
| Markdown | marked.js v12 (CDN) |
| Diagrams | Mermaid v10 (CDN) |
| Security | DOMPurify v3 (CDN) |
| Auth | Optional Cloudflare Access JWT (RS256, JWKS) |

A decoupled SPA: The static frontend (HTML/CSS/JS) is served by Cloudflare Workers Assets (`/public/`), dynamic requests route through the main Worker API (`/api/*`).

## Customising Templates

To add or modify built-in document templates:
1. Create a new markdown (`.md`) file inside the `openmarkdown/src/templates/` directory (e.g., `my-template.md`).
2. Open `openmarkdown/src/templates/index.ts`.
3. Import your markdown file
4. Add a new configuration object to the `templates` array:
   ```typescript
   {
       id: 'my-template',
       name: 'My Custom Template',
       description: 'A helpful description of the template shown in the UI.',
       content: myTemplateContent,
   }
   ```
5. Run the dev server or deploy; the template will appear instantly in the "Import Template" modal.

<img width="711" height="691" alt="image" src="https://github.com/user-attachments/assets/3d149ec0-9b7c-46c1-a7e1-14c66508db47" />


## Local Development

```bash
cd openmarkdown
npm install
npm run dev
```

JWT validation is bypassed automatically when running in local development mode (via wrangler dev or when `IS_LOCAL_DEV=true` in `.dev.vars`), or if `CF_ACCESS_TEAM_NAME` and `CF_ACCESS_AUDIENCE` are not configured in your environment.

## Deployment

To deploy the application to Cloudflare Workers manually:

```bash
npm run deploy
```

Required environment variables & secrets (set in the Cloudflare Dashboard or via Wrangler):

- `CF_ACCESS_AUDIENCE` - [Keep Secret] Cloudflare Access application audience tag (only required if Zero Trust is enabled)
- `CF_ACCESS_TEAM_NAME` - Cloudflare Access team subdomain (only required if Zero Trust is enabled)

## Project Structure

```
openmarkdown/
├── public/               # Decoupled Static UI Assets (served natively via Cloudflare Assets)
│   ├── index.html        # HTML application shell
│   ├── styles.css        # design
│   └── app.js            # Client-side SPA logic
├── src/
│   ├── index.ts          # API Gateway entry point - Zero Trust auth & routing
│   ├── api/jwt.ts        # JWT validation, JWKS fetching and caching
│   └── templates/        # Markdown template files and registry
└── wrangler.jsonc        # Routes, custom domains, asset bindings, vars
```

## Running Tests

```bash
npm test
```
