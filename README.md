# Switch & Fix Electrical & Home Services

Website source package, including the responsive hero with a Black technician.

## Upload to GitHub
1. Extract this ZIP on your computer.
2. Open your GitHub repository.
3. Choose Add file > Upload files.
4. Upload the contents of the extracted switch-and-fix-website folder, preserving the folders. Include .gitignore and .openai/hosting.json (these may be hidden by your computer).
5. Enter "Add Switch & Fix website" and commit the changes.

Upload the extracted files, not the ZIP itself. This package contains source code and images, not Git history, installed dependencies, build output, credentials, or private environment settings.

## Development
Requires Node.js 22.13.0 or newer.

```sh
npm ci
npm run dev
npm run build
```

Use npm with the included package-lock.json. The original pnpm lockfile is also retained for source fidelity; use only one package manager at a time.

## Hosting
The existing version is hosted at:
https://switch-and-fix-services.momofjasiri.chatgpt.site

This is a React / Vinext project configured for the Sites Cloudflare Workers runtime. Uploading it to GitHub stores the code but does not automatically publish or synchronize the live site. It is not a ready-to-publish static GitHub Pages site. Another hosting provider may require configuration changes.

The quote form prepares details in the browser and asks visitors to call 843-214-0641; it does not email or save submissions to a server.

## Main files
- app/page.tsx: page content
- app/globals.css: styles and responsive hero layout
- app/quote-form.tsx: quote form
- public/: logo, photographs, and other assets
- .openai/hosting.json: existing Sites project identity (not a credential)

The bundled tests/rendered-html.test.mjs is an unchanged starter skeleton test, not a website-specific test. Use npm run build to verify compilation.
