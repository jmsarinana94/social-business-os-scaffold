# Changesets

Use `pnpm dlx changeset` to create a version bump for one or more packages.

Follow [Conventional Commit types](https://www.conventionalcommits.org/en/v1.0.0/):

- `feat:` new features
- `fix:` bug fixes
- `chore:` maintenance or tooling
- `docs:` documentation updates

After merging PRs to `main`, the GitHub Action will handle:

- Version bumps
- Changelog updates
- GitHub Releases
