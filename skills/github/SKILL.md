---
name: github
description: "Interact with GitHub using the `gh` CLI. Use `gh issue`, `gh pr`, `gh run`, and `gh api` for issues, PRs, CI runs, and advanced queries."
metadata: {"openclaw":{"emoji":"🐙","requires":{"bins":["gh"]},"install":[{"id":"brew","kind":"brew","formula":"gh","bins":["gh"],"label":"Install GitHub CLI (brew)"},{"id":"apt","kind":"apt","package":"gh","bins":["gh"],"label":"Install GitHub CLI (apt)"}]}}
---

# GitHub Skill

Use the `gh` CLI to interact with GitHub. Always specify `--repo owner/repo` when not in a git directory, or use URLs directly.

## Authentication (Docker / bot)

When the gateway runs in Docker, the bot needs a GitHub PAT so `gh` and `git` can access repos. Set `GITHUB_TOKEN` (or `GH_TOKEN`) in the gateway environment; the token is not stored in the skill.

- **docker-compose:** Add `GITHUB_TOKEN=ghp_...` to your `.env` (same directory as `docker-compose.yml`). The gateway service already passes `GITHUB_TOKEN` through. Restart the gateway after adding: `docker compose up -d openclaw-gateway`.
- **One-off in container:** `docker exec -it <gateway-container> sh -c 'export GITHUB_TOKEN=ghp_...; gh auth status'` to confirm (do not commit the token).
- **PAT scope:** For full `gh auth login --with-token` the PAT needs `read:org`. For API and git over HTTPS, a PAT with `repo` (and optionally `read:org`) used via `GITHUB_TOKEN` is enough.

## Pull Requests

Check CI status on a PR:
```bash
gh pr checks 55 --repo owner/repo
```

List recent workflow runs:
```bash
gh run list --repo owner/repo --limit 10
```

View a run and see which steps failed:
```bash
gh run view <run-id> --repo owner/repo
```

View logs for failed steps only:
```bash
gh run view <run-id> --repo owner/repo --log-failed
```

## API for Advanced Queries

The `gh api` command is useful for accessing data not available through other subcommands.

Get PR with specific fields:
```bash
gh api repos/owner/repo/pulls/55 --jq '.title, .state, .user.login'
```

## JSON Output

Most commands support `--json` for structured output.  You can use `--jq` to filter:

```bash
gh issue list --repo owner/repo --json number,title --jq '.[] | "\(.number): \(.title)"'
```
