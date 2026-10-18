# Deploying StuntWatch to Cloudflare Workers

The Next.js frontend and its `/api/*` endpoints are deployed together as a Cloudflare Worker through the OpenNext Cloudflare adapter. The Worker serves the checked-in prediction artifact at `models/artifacts/stuntwatch_predictions_v3.json`; the Python pipeline remains responsible for refreshing that artifact and training the model outside the Worker runtime.

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

To test AI-generated district narratives locally, create a `.dev.vars` file in the repository root:

```dotenv
TOGETHER_API_KEY=your_together_api_key
```

This file is ignored by Git. The remaining API routes work without this key.

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

Set the Together AI key as a Worker secret when narrative generation is needed:

```powershell
npx wrangler secret put TOGETHER_API_KEY
```

The secret is only used by `/api/kabupaten/{domain_id}/narrative`; it is never exposed to browser code.

## Automatic deployment from GitHub

The repository can also be connected in the Cloudflare dashboard:

1. Open **Workers & Pages** and select **Create application → Connect to Git**.
2. Select the `farrr18/stuntwatch` repository and the production branch (`main`).
3. Configure the deploy command as `npm run cf:deploy`.
4. Set the build environment to use Node.js 20 or newer.
5. Add `TOGETHER_API_KEY` as a Worker secret in the Cloudflare dashboard if AI narratives are required.
6. Save and deploy.

Alternatively, deploy from GitHub Actions with a Cloudflare API token and account ID stored as repository Actions secrets. Do not commit tokens or put them in `NEXT_PUBLIC_*` variables.

## API data

The browser uses the same-origin Worker API by default, so no public API URL or cross-origin CORS configuration is needed. Set `NEXT_PUBLIC_API_BASE_URL` only when intentionally using a separate API deployment. The Worker implements `/api/health`, `/api/metrics`, `/api/map-data`, `/api/provinces`, `/api/top-risky`, `/api/kabupaten`, and `/api/provinsi/{slug}` routes, plus district detail and narrative routes under `/api/kabupaten/{domain_id}`.

## Notes

- `.open-next` is generated build output and is intentionally ignored by Git.
- The Worker configuration is in `wrangler.jsonc`; the OpenNext adapter configuration is in `open-next.config.ts`.
- The deployed Worker serves precomputed predictions. Run the Python data pipeline/model training separately, then commit the updated prediction artifact before deploying to publish new predictions.
- The Python training pipeline itself is not executed inside Workers; XGBoost and SHAP are kept in the existing Python environment.
- See the [OpenNext Cloudflare guide](https://opennext.js.org/cloudflare/get-started) and [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/).
