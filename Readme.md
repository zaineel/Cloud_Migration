# {{PROJECT_NAME}} — Development README

Working draft for maintainers & contributors while the project is under active development. Coordinate in ACM Discord/Slack (project channel or #projects).

Directors / Contacts: Tobi (Director) and Prajit Viswanadha — DM on Discord

---

## Status & Links

- Phase: In Development
- Project board: {{PROJECT_BOARD_URL}}
- Communication: Discord #{{project-channel}} (or team preference for Slack, etc.)
- Open issues: use repo Issues; prefer labels `good first issue` and `help wanted` thoughtfully

---

## Getting Started

### Prerequisites

- Git
- One of: Node 20+ or Python 3.11+ or Go 1.22+ or Rust (stable)
- Optional: Docker Desktop

### Environment

- Copy the sample env to your local file: `cp .env.example .env`
- Keep secrets out of git. If you add a new variable, document it in `.env.example`.

### Bootstrap

- Clone: `git clone https://github.com/{{GITHUB_OWNER}}/{{REPO}}.git` then `cd {{REPO}}`
- Node: if `package.json` exists → `npm ci` (fallback `npm install`)
- Python: if `requirements.txt` exists → create venv `python -m venv .venv`, activate, then `pip install -r requirements.txt`
- Go: if `go.mod` exists → `go mod download`
- Rust: if `Cargo.toml` exists → `cargo fetch`

### Run

- Node: `npm run dev` (dev server) or `npm start` (if app defines it)
- Python (FastAPI example): `uvicorn app:app --reload`
- Go: `go run ./...`
- Rust: `cargo run`

---

## Repo Conventions

### Commits & Branches

- Use Conventional Commits. Examples:
  - `feat(ui): add dark mode toggle`
  - `fix(api): handle null user_id on login`
  - `docs(readme): clarify quickstart`
  - `chore(deps): bump eslint to v9`
- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `docs/<slug>`

### Pull Requests

- Prefer small, focused PRs; link issues using `Fixes #123`
- Use the PR template: include testing steps, screenshots for UI changes, note breaking changes and rollback plan
- Request reviews from maintainers or CODEOWNERS

### Testing, Linting, Formatting

- Aim for at least a smoke test; run local checks before pushing
- Node: `npm test` (or none if not configured), `npm run lint` (if present), `npm run format` (if present)
- Python: `pytest` (or note “No tests”), `ruff check .` (if using), `ruff format .`
- Go: `go test ./...`
- Rust: `cargo test`

### Secrets & Configuration

- Never commit `.env` or credentials
- Use `.env` locally; keep `.env.example` updated so others know what is required
- For deployments, store secrets in platform settings (not in code)

---

## Project Structure (suggested)

- `src/` — application code
- `tests/` — unit/integration tests
- `docs/` — screenshots, diagrams, decisions (ADRs)
- `.github/` — PR/Issue templates, CODEOWNERS (optional)
- `.env.example` — sample env vars (copy to `.env` locally)
- `README.dev.md` — this file (dev-only)

---

## Decision Log (keep brief)

Create `docs/DECISIONS.md` and record major choices with date and rationale. Example entries:

- 2025-09-14: Choose Postgres over Mongo (SQL familiarity, joins, migrations)
- 2025-09-14: Host on Render for MVP (simple, acceptable free tier)

---

## Release Prep Checklist (before first public release)

- Finalize end-user README (rename/replace root README; include screenshot/GIF)
- Choose and add a LICENSE file appropriate for the project
- Ensure `.env.example` documents all required variables
- Confirm basic tests pass; document manual smoke test steps
- Tag `v0.1.0` with concise release notes

---

## Code of Conduct (embedded)

- Be respectful and inclusive; harassment or discrimination is not tolerated
- Assume good intent; give clear, constructive feedback
- Report concerns privately to a director (contacts above)

---

## Security / Responsible Disclosure (embedded)

- Do not open public issues for vulnerabilities
- Privately contact Tobi or Prajit Viswanadha (ACM Discord/Slack DM) with details and reproduction steps
- We will acknowledge receipt and coordinate a fix

---

## Maintainers & Support

=======
- Maintainers: Zaineel Mithani ([@zaineel](https://github.com/zaineel)), Aroudra ([@aroudrasthakur](https://github.com/aroudrasthakur)), Tanzid Noor Azad ([@TanzidAzad](https://github.com/TanzidAzad), Soumik Sen ([@soumiksen](https://github.com/soumiksen))
- Directors / Contacts: Tobi and Prajit Viswanadha — DM on Discord
