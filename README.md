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
