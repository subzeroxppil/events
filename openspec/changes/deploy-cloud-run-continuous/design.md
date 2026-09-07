## Context

`iron-haiku-507914-i0` ("paypal", project number 467325964865) has never had Cloud Run enabled, so this is green-field: the APIs, the Artifact Registry repository, the secrets and the service all need creating.

The existing `Dockerfile` is a two-stage Node 20 build that takes all six environment values as `ARG`s. Three of them are `NEXT_PUBLIC_*`, which Next.js inlines into the client bundle **at build time** — so they must be build arguments, not runtime service variables. That is the constraint that shapes most of this design.

The Dockerfile also has a real bug:

```dockerfile
COPY . .                                  # ← copies local node_modules, .next
COPY package.json package-lock.json* ./   # ← redundant, already copied
RUN npm ci
```

With no `.dockerignore`, the whole working tree — including a populated `node_modules` and `.next` — is uploaded as build context and baked into the layer before `npm ci` runs.

## Goals / Non-Goals

**Goals:**
- A service in a project this account controls.
- Push to `master` → deployed, no manual step.
- No credentials in the repository or in plaintext service config.
- `NEXT_PUBLIC_BASE_URL` correct in the built bundle.

**Non-Goals:**
- Migrating or shutting down the existing `pp-events-609469738206` service or the Vercel deployment. Both keep running; this is an additional, controllable deployment.
- Changing the database. The service points at the same Supabase instance the local `.env` names.
- A custom domain, or staging/preview environments.

## Decisions

**GitHub Actions over Workload Identity Federation, not a Cloud Build GitHub trigger.** The trigger was the first choice, and it failed on rights: creating the connection succeeded, but authorizing it requires a browser OAuth step *and* installing the Cloud Build GitHub App, which needs admin on `subzeroxppil/events`. The account available here has push access only.

WIF inverts the problem. The trust is declared on the GCP side — an OIDC provider whose attribute condition pins it to `assertion.repository == 'subzeroxppil/events'` — so GitHub proves who it is with a short-lived token rather than holding a credential. Nothing is stored in the repository, which is what makes it work without admin: GitHub Actions secrets also need admin, and WIF needs none. Pushing the workflow file needs only the `workflow` scope, which the account has.

**Resolve the base-URL chicken-and-egg by deploying twice.** `NEXT_PUBLIC_BASE_URL` must be baked in at build time, but the URL does not exist until the service does. Rather than guess the hostname — the `SERVICE-PROJECTNUMBER.REGION.run.app` format is not guaranteed for new services — the service is deployed once with a placeholder, its real URL is read back, written into the trigger's substitutions, and a second build produces the correct bundle. One extra build, no guessing.

**Every value comes from Secret Manager, including the non-secret ones.** `next build` can execute route code during prerendering, so `DATABASE_URL` must be available at build time as well as run time; Cloud Build reads it via `availableSecrets` and passes it as a build arg, and the service mounts the same secret with `--set-secrets`.

The three `NEXT_PUBLIC_*` values are *not* secret — Next inlines them into the client bundle — but they are stored the same way anyway. Two reasons: they must be build arguments regardless (the inlining happens at build time, so a Cloud Run environment variable is too late), and putting them there means the workflow file carries no configuration at all, which is what keeps it free of anything worth protecting.

**Pin the image by commit SHA, tag `latest` alongside.** `$SHORT_SHA` makes every revision traceable to a commit and makes rollback a matter of redeploying a known tag.

**Leave `npm start` as the entrypoint.** Cloud Run injects `PORT=8080`, and `next start` honours `PORT`, so the existing `EXPOSE 8080` and `CMD ["npm", "start"]` are already correct. No change needed.

**Fix the Dockerfile ordering and add a `.dockerignore`.** Copy the manifests first, `npm ci`, then copy the source — the conventional order, which also lets the dependency layer cache across builds. The `.dockerignore` excludes `node_modules`, `.next`, `.env` and `.git`. Note this also means the local `.env` can no longer leak into the image, which it currently can.

## Risks / Trade-offs

- **The workflow's first real run is its own test.** The pipeline was verified end to end by invoking `cloudbuild.yaml` directly, but the WIF token exchange itself only exercises on a genuine push. If it fails, the fallback is the documented manual `gcloud builds submit`, and the fix is a GCP-side IAM change rather than anything in the repository.
- **`storage.admin` on the deployer is broader than ideal.** `gcloud builds submit` uploads the source tarball to the Cloud Build staging bucket, which needs it. Scoping it to that one bucket would be tighter.
- **Two deployments now point at the same production database.** The existing service and this one will both serve live traffic against the same Supabase instance. That is intended — it is the same app — but it means a bad deploy here can affect real data.
- **Build-time secrets appear in the build environment.** Unavoidable given `NEXT_PUBLIC_*` inlining; mitigated by keeping the values in Secret Manager and granting only the build service account access.
- **The first build after the URL is known rebuilds everything.** A one-time cost during setup.
