## Why

The app is currently served from a Cloud Run service (`pp-events-609469738206.asia-southeast1.run.app`) in a project this Google account cannot see, and from Vercel, where deploys only happen when the commit author is the `subzeroxppil` GitHub user. Neither pipeline is one this account can operate or repair. Standing up the service in a project the account owns, wired to the same `master` branch, gives a deployment that can actually be maintained from here.

## What Changes

- A Cloud Run service is created in the `paypal` project (`iron-haiku-507914-i0`), in `asia-southeast1` to match the existing deployment's region.
- The three secret environment values — `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` — are stored in Secret Manager rather than as plaintext service variables.
- `NEXT_PUBLIC_BASE_URL` is set to the new service's own URL. The local `.env` is left untouched.
- A `cloudbuild.yaml` is added so builds are reproducible and the `NEXT_PUBLIC_*` values — which Next.js bakes in at build time, not run time — reach the image.
- A GitHub Actions workflow, authenticating by Workload Identity Federation with no stored credentials, deploys the service on every push to `master`.
- The Dockerfile's build-context bug is fixed: it currently runs `COPY . .` *before* `COPY package.json package-lock.json* ./`, and has no `.dockerignore`, so the local `node_modules` and `.next` are uploaded and baked into the image.

## Capabilities

### New Capabilities

- `cloud-run-deployment`: how the app is built, configured and continuously deployed on Cloud Run.

### Modified Capabilities

<!-- None: no existing specs yet. -->

## Impact

- New `cloudbuild.yaml`, `.dockerignore`, `.gcloudignore`, `.github/workflows/deploy.yml`
- `Dockerfile` — COPY ordering
- `README.md` — deployment section
- GCP: Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Workload Identity Federation in `iron-haiku-507914-i0`
- No application code, schema or API changes.

## Resolved constraint

The obvious route — a Cloud Build GitHub trigger — needs the Cloud Build GitHub App, which needs **admin** on `subzeroxppil/events`; the GitHub account available here has push access only. Workload Identity Federation avoids the problem entirely: it is configured wholly on the GCP side, GitHub authenticates with a short-lived OIDC token rather than a stored credential, and the workflow file needs only push and `workflow` scope to land. No repository secrets and no admin rights are required.
