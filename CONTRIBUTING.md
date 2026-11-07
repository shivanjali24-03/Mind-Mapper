# Contributing to Mind Mapper

## Branches and environments

```
feature/<issue>-name ──PR──► develop ──release PR──► staging ──release PR──► main ──► tag vX.Y.Z
                              (DEV)                  (STAGING)               (PRODUCTION)
hotfix/<issue>-name ─────────────────────────────── PR ──────────────────────► main, then back into develop
```

| Branch | Environment | URL | Merges in from |
|---|---|---|---|
| `main` | Production | https://shivanjali24-03.github.io/Mind-Mapper/ | `staging` (release) or `hotfix/*` |
| `staging` | Staging / QA | https://shivanjali24-03.github.io/Mind-Mapper/staging/ | `develop` (release candidate) |
| `develop` | Development | https://shivanjali24-03.github.io/Mind-Mapper/dev/ | `feature/*`, `fix/*` |

Dev and staging show a **DEV** / **STAGING** badge and keep their own data in the browser, so testing never touches production maps.

## Rules
- Nobody pushes directly to `develop`, `staging` or `main`. Every change goes through a pull request with a green **CI** check.
- One branch per issue: `feature/18-outline-view`, `fix/42-export-crash`, `hotfix/50-login`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `ci:`, `chore:`, with the issue number, e.g. `feat(outline): add indent with Tab (#18)`.
- Pull requests use the template, link their issue (`Closes #18`) and are reviewed against [CODE_REVIEW.md](CODE_REVIEW.md).

## Day-to-day flow
1. `git switch develop && git pull`
2. `git switch -c feature/<issue>-<short-name>`
3. Commit small steps; run `npm test` and `npm run build`.
4. Push and open a PR **into `develop`**. Merge when CI is green.

## Releasing
1. Open a PR **`develop` → `staging`** titled `Release vX.Y.Z`. After merge, test on the staging URL.
2. Fix anything found with `fix/*` PRs into `staging`, then merge `staging` back into `develop`.
3. Open a PR **`staging` → `main`**. After merge, tag the release: `git tag -a vX.Y.Z` and publish a GitHub Release.

## Hotfixes
Branch `hotfix/*` from `main`, PR into `main`, tag a patch version, then merge `main` back into `develop` and `staging`.
