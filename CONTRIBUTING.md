# Contributing

Thanks for contributing to InfraFlow — Local-MVP. This document explains how to open issues, create branches, and format commits using Conventional Commits.

Branching
- Create feature branches from `main` named `feat/your-feature` or `fix/short-description`.

Commit message conventions (Conventional Commits)

Use Conventional Commits to keep history consistent. Basic format:

```
<type>(<scope>): <short summary>

<optional body>

<optional footer>
```

Common `type` values:
- `feat`: a new feature
- `fix`: a bug fix
- `chore`: build or tooling changes
- `docs`: documentation only changes
- `refactor`: code change that neither fixes a bug nor adds a feature
- `test`: adding or updating tests

Examples:

```
feat(web): add toolbar to spawn VM and service nodes

fix(api): handle ssh stream errors and emit deploy-log events

docs: update README with run instructions
```

Pull requests
- Open a PR from your feature branch to `main`.
- Provide a short description of what the change does and why.
- Link any related issues.

Code style
- Keep changes focused and small.
- Run `pnpm install` at repo root to ensure dependencies are present.

Testing & running
- To run the frontend in dev: `pnpm --filter @infra-flow/web dev`
- To run the api in dev: `pnpm --filter @infra-flow/api dev`

Thanks — contributions are appreciated! 🎉
