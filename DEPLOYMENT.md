# Deployment

This document covers local testing with Docker and deploying to Kubernetes via Helm.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed and running
- Access to the RENCI VPN — required for the GraphQL API and Monday.com
- `kubectl` configured for the RENCI cluster (for Kubernetes deployment)
- `helm` installed (for Kubernetes deployment)
- Credentials for `containers.renci.org` (for pushing images)

---

## Local testing with Docker

The app runs as two containers: a Node/Express backend and an Nginx frontend.
Use this to verify a build before pushing to the registry.

> **VPN required:** Connect to the RENCI VPN before starting the containers.
> Data will fail to load and submissions will fail without it.

### Build the images

Run both commands from the **monorepo root**. Use the full registry path so the
image name matches what Kubernetes will pull.

```bash
docker build -f frontend/Dockerfile -t containers.renci.org/comms/renci-update-frontend:0.2.0 .
docker build -f backend/Dockerfile  -t containers.renci.org/comms/renci-update-backend:0.2.0  .
```

Only rebuild when you make code changes.

### Run the containers

The backend must start first — the frontend shares its network stack.

```bash
# 1. Start the backend
docker run --rm -d \
  -p 3001:3001 \
  --name renci-backend \
  --env-file .env \
  containers.renci.org/comms/renci-update-backend:0.2.0

# 2. Start the frontend (attaches to backend's network)
docker run --rm -d \
  --name renci-frontend \
  --network container:renci-backend \
  containers.renci.org/comms/renci-update-frontend:0.2.0
```

Then visit [http://localhost](http://localhost) in your browser.

### Stop the containers

Stop the frontend before the backend.

```bash
docker stop renci-frontend renci-backend
```

Both containers are removed on stop (`--rm`). Images remain and can be run again immediately.

### Useful commands

```bash
# Check running containers
docker ps

# View logs
docker logs renci-backend
docker logs renci-frontend

# Follow logs in real time
docker logs -f renci-backend
docker logs -f renci-frontend

# List local images
docker images | grep renci-update
```

### Notes

- Nginx proxies `/api/` requests to the backend via `localhost:3001` — this works
  because both containers share the same network namespace.
- The backend must be running before the frontend container starts.
- `--network host` is not used — it does not work on macOS with Docker Desktop.

---

## Deploying to Kubernetes

### 1. Push images to the registry

```bash
docker login containers.renci.org
docker push containers.renci.org/comms/renci-update-frontend:0.2.0
docker push containers.renci.org/comms/renci-update-backend:0.2.0
```

### 2. Verify your cluster context

```bash
kubectl config current-context
```

If you need to switch contexts:

```bash
kubectl config get-contexts        # list available contexts
kubectl config use-context <name>  # switch to the correct one
```

### 3. Deploy with Helm

Use `helm upgrade --install` — this installs if no release exists, or upgrades if one does.
Always pass **all** secret values, not just new or changed ones. Helm replaces the entire
secret on upgrade and any omitted key will be wiped.

Find the namespace if you're unsure:

```bash
helm list --all-namespaces | grep renci-update
```

Then deploy:

```bash
helm upgrade --install renci-update ./helm \
  -n <namespace> \
  --set secrets.GRAPHQL_ENDPOINT=xxx \
  --set secrets.GRAPHQL_AUTH_HEADER=xxx \
  --set secrets.MONDAY_API_KEY=xxx \
  --set secrets.MONDAY_BOARD_ID=xxx \
  --set secrets.MONDAY_COL_STATUS=xxx \
  --set secrets.MONDAY_COL_DATE=xxx \
  --set secrets.MONDAY_COL_CONTENT_TYPE=xxx \
  --set secrets.MONDAY_COL_DESCRIPTION=xxx \
  --set secrets.MONDAY_COL_ITEM_NAME=xxx \
  --set secrets.MONDAY_COL_ASSIGNED_PERSON=xxx \
  --set secrets.MONDAY_COL_SUBMITTER_EMAIL=xxx \
  --set secrets.MONDAY_COL_WORDPRESS_LINK=xxx \
  --set secrets.MONDAY_COL_OPERATION=xxx \
  --set secrets.MONDAY_COL_DUE_DATE=xxx \
  --set secrets.MONDAY_SUBITEM_COL_CONTENT=xxx
```

Fill in values from your `.env` file. Never commit secret values to `values.yaml` or
any tracked file.

### 4. Verify the deployment

```bash
# Check pods are running
kubectl get pods -n <namespace> | grep renci-update

# Check for errors
kubectl logs deployment/renci-update -n <namespace> -c backend --tail=50

# Check ingress
kubectl get ingress -n <namespace> | grep renci-update
```

Then open [https://update.apps.renci.org](https://update.apps.renci.org) on VPN
and do a smoke test.

### Updating the app version

When cutting a new version:

1. Update `version` and `appVersion` in `helm/Chart.yaml`
2. Update `frontend.image.tag` and `backend.image.tag` in `helm/values.yaml`
3. Build and push images with the new tag
4. Run the `helm upgrade --install` command above

---

## Environment variables

All required variables are documented in `.env.example`. The backend reads them
from the Kubernetes `Secret` object created by Helm at deploy time. For local
Docker testing, they are loaded from `.env` via `--env-file`.