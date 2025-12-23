# InfraFlow — Local MVP (Multipass Orchestrator)

InfraFlow Local-MVP is a local Multipass VM orchestrator with a visual canvas (frontend) and a TypeScript API (backend) that generates Docker Compose + Nginx config and reconciles state over SSH.

Requirements
- Node.js 18+ and pnpm
- (Optional) Multipass for creating local VMs

Quick start

1. Install all workspace dependencies from the repository root:

```bash
pnpm install
```

2. Start the frontend (Vite dev server):

```bash
pnpm --filter @infra-flow/web dev
```

3. Start the API server (Socket.IO + SSH runner):

```bash
pnpm --filter @infra-flow/api dev
```

Environment
- Create a `.env` file at the repository root with your SSH key path:

```env
SSH_KEY_PATH=/Users/yourname/.ssh/id_rsa
```

Usage
- Open the frontend at `http://localhost:5173` (Vite will print the exact URL).
- Build a graph of `VM` nodes and `Service` nodes. Use the toolbar to add nodes, drag Service nodes into a VM to parent them, then click `DEPLOY ALL`.
- The frontend listens to `deploy-log` Socket.IO events from the API and shows streamed output in the Deployment Terminal.

Multipass (optional)

Create a test VM locally with Multipass:

```bash
brew install --cask multipass
multipass launch -n infra-vm --mem 2G --cpus 2 --disk 10G
multipass info infra-vm
```

Copy the VM IP into a VM node in the canvas and set `SSH_KEY_PATH` so the API can SSH into the VM.

Troubleshooting
- If a command fails, check the package.json scripts in `apps/web` and `apps/api`.
- If SSH auth fails during deployment, verify the VM has your public key in `~/.ssh/authorized_keys`.
- If React Flow warns about container size, ensure the canvas container has an explicit width/height (the app uses full viewport by default).

Want a demo seed?
- If you want a pre-seeded graph to try the UX immediately, tell me and I will add a demo initial state to the store.

License
- This project is provided under the repository LICENSE (see root). 
# InfraFlow — Local MVP (Multipass Orchestrator)

This workspace contains a minimal implementation of the InfraFlow Local-MVP.

Quick start (macOS):

1. Install dependencies:

```bash
pnpm install
```

2. Start the API server:

```bash
cd apps/api
pnpm install
pnpm start
```

3. Configure your `.env` SSH key path at the repository root.

Notes: This repo contains `@infra-flow/types` and a TypeScript API server that streams deploy logs via Socket.IO. The frontend scaffold is not included in this initial commit.
# Orchestrator MVP

This workspace contains a minimal scaffold for an MVP orchestrator that can turn a visual node graph into cloud droplets and run Docker Compose on them.

Quick notes:
- `apps/api` contains a simple TypeScript `ProvisioningService` which calls the DigitalOcean API directly, waits for the droplet, copies a generated `docker-compose.yml` and runs it via SSH.
- `packages/types` contains shared TypeScript interfaces (`VirtualMachine`, `ServiceNode`).
- `scripts/provision.sh` is a small cloud-init script used as `user_data` when creating a droplet.

What to do next:

1. Install dependencies at workspace root (we use pnpm in examples):

```bash
pnpm install
cd apps/api
pnpm install
```

2. Populate `.env` from `.env.example` and ensure `DO_TOKEN_ENC` is an encrypted token in `ivHex:encryptedHex` format. The sample decryptor expects AES-256-CBC with the IV and ciphertext as hex; `ENC_KEY` is hashed to 32 bytes.

3. Run the sample deployer (from `apps/api`):

```bash
pnpm ts-node src/index.ts
```

Caveats and next improvements:
- Add proper encryption tooling to generate `DO_TOKEN_ENC`.
- Add error handling and retries for SSH steps.
- Add database and API endpoints for storing user tokens and node definitions.
