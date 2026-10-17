# Deploying StuntWatch to Cloudflare Workers

StuntWatch uses Next.js server-rendered routes and client-side data fetching, so it is deployed as a Cloudflare Worker using the OpenNext Cloudflare adapter.

## Requirements

- Node.js 20 or newer
- A Cloudflare account
- A GitHub repository containing the deployment configuration

## Preview locally in the Workers runtime

Install dependencies and start the Cloudflare preview:

```powershell
npm install
npm run cf:preview
```

The preview runs through Wrangler in the Cloudflare Workers runtime rather than the regular Next.js development server.

## Deploy from this computer

Authenticate Wrangler with the Cloudflare account:

```powershell
npx wrangler login
```

Then build and deploy:

```powershell
npm run cf:deploy
```

Wrangler will show the deployed `workers.dev` URL when the deployment completes. To deploy an upload as a version without immediately serving it, use `npm run cf:upload`.

## Automatic deployment from GitHub

The repository can also be connected in the Cloudflare dashboard:

1. Open **Workers & Pages** and select **Create application → Connect to Git**.
2. Select the `farrr18/stuntwatch` repository and the production branch (`main`).
3. Configure the build command as `npm run cf:deploy`.
4. Set the build environment to use Node.js 20 or newer.
5. Save and deploy.

Alternatively, deploy from GitHub Actions with a Cloudflare API token and account ID stored as repository Actions secrets. Do not commit tokens or put them in `NEXT_PUBLIC_*` variables.

## API data

The browser calls the StuntWatch API configured in `lib/api/mockAdapter.ts`. It currently defaults to the existing API URL and has local JSON snapshots as fallbacks. Configure a different `NEXT_PUBLIC_API_BASE_URL` before building if needed. The API must allow browser requests from the deployed Worker origin (CORS).

## Notes

- `.open-next` is generated build output and is intentionally ignored by Git.
- The Worker configuration is in `wrangler.jsonc`; the OpenNext adapter configuration is in `open-next.config.ts`.
- This deploys the Next.js frontend. It does not deploy the separate StuntWatch API/backend.
- See the [OpenNext Cloudflare guide](https://opennext.js.org/cloudflare/get-started) and [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
