# SocialLens

A social media sharing web application developed for CS 415 Software Design & Development.

## Current scope: base foundation

This version provides a React/Vite integration screen, a Django REST Framework API,
PostgreSQL configuration, and an initial custom user model. It is **not the completed
Milestone 1 MVP**. Registration/login/logout endpoints and UI, tokens, posts, feeds,
likes, comments, follows, uploads, and account pages are not implemented. There is
no admin or browsable-API login route. Milestone 1 still requires working
authentication and an end-to-end core user flow, the remaining course artifacts,
and an exact submitted version.

The existing [backlog](docs/BACKLOG.md), [ADR](docs/architecture/adr-001-modular.monolith.md),
and [use cases](docs/requirements/use-cases.md) describe the broader application.

## Architecture and files

```text
Browser: React/Vite (127.0.0.1:5173)
  -> /api/ development proxy
  -> Django REST Framework (127.0.0.1:8000)
  -> view -> service -> repository -> PostgreSQL (127.0.0.1:5432)

frontend/              React JavaScript application and npm lockfile
backend/config/        Environment configuration and root URLs
backend/accounts/      Custom user model, manager, migration, and tests
backend/core/          Health view, service, database repository, and tests
backend/.env.example   Safe example configuration
backend/requirements.* Python direct dependencies and exact resolved pins
docs/                  Existing requirements and architecture documents
```

The health repository executes `SELECT 1` against PostgreSQL on every check. It
does not count users or return application data. This is a connectivity check;
use migration checks below to verify schema readiness.

The user model inherits Django's `AbstractUser`, including password hashing,
groups, permissions, active/staff/superuser flags, and a public `username` handle.
Unique `email` is the authentication identifier (`USERNAME_FIELD`); username is
still required. Email is normalized to lowercase when created through the manager.
Database constraints reject case-insensitive duplicates for both email and handle;
the handle's display case is preserved. Internal Django email authentication is
tested, but no HTTP authentication flow is exposed. Password-strength validators
are configured; future registration code must explicitly call Django's password
validation before account creation (the model manager does not enforce strength).
Future relations must use `settings.AUTH_USER_MODEL`.

## Required software and tested versions

| Software | Tested version |
| --- | --- |
| Python | 3.12.14 (use Python 3.12) |
| PostgreSQL | 16.15 (use PostgreSQL 16) |
| Node.js | 20.20.2, recorded in `.nvmrc` |
| npm | 10.8.2 |
| Django | 5.2.17 |
| Django REST Framework | 3.16.1 |
| Psycopg / binary driver | 3.3.6 |
| python-dotenv | 1.2.3 |
| React / React DOM | 19.3.0 |
| Vite | 7.3.6 |

All Python dependency versions are pinned in `backend/requirements.txt`; npm
versions are locked in `frontend/package-lock.json`. Use those files for setup,
not a fresh resolution of `requirements.in`. Vite requires Node 20.19+ or 22.12+;
the reproducible tested version is in `.nvmrc`. A current browser, Git, and a
running PostgreSQL server are also needed. Docker is not required.

Check versions before installing project dependencies:

```bash
python3.12 --version
node --version
npm --version
psql --version
```

On macOS with Homebrew, if these prerequisites are missing:

```bash
brew install python@3.12 postgresql@16
brew services start postgresql@16
```

If using nvm, run `nvm install` and `nvm use` from the repository root to select
`.nvmrc`. An elevated shell may select a different Node: check `node --version`
in the same terminal where you run npm. No shell-file edits are required.

If PostgreSQL commands are not on PATH, use absolute paths such as
`"$(brew --prefix postgresql@16)/bin/psql"`, substituting `createuser`, `createdb`,
or `pg_isready` as needed. On other systems install Python 3.12, Node matching
`.nvmrc`, and PostgreSQL 16 through that system's installer/package manager.
On Windows, use `py -3.12` and `.venv\Scripts\python.exe` instead of the Unix
Python/virtual-environment paths below. This version was verified on macOS;
other operating systems have not been verified.

## Fresh local setup

### 1. Get the source

```bash
git clone https://github.com/LeonLuciousJr/sociallens.git
cd sociallens
```

These instructions apply to a version containing the foundation files. The
current local foundation changes have **not been committed or pushed**; cloning
the remote alone does not yet retrieve them. For the eventual submission, the
repository must contain the exact reviewed milestone version. No Git release
actions are part of local setup.

### 2. Create the PostgreSQL role and database

Start PostgreSQL, then run the following once, using a PostgreSQL administrator
connection. Homebrew's initial cluster normally provides an administrator role
matching your macOS username. Other installations may require `-U postgres`.

```bash
createuser --login --createdb --pwprompt sociallens
createdb --owner=sociallens sociallens
pg_isready -h 127.0.0.1 -p 5432
```

Choose a local password at the hidden prompt. Do not put it in commands or Git.
The role is not a superuser; `CREATEDB` is for Django's separate test database.
Skip creation if the role/database already exist. Do not drop existing data to
repeat setup. If an existing role lacks the test privilege, a local PostgreSQL
administrator can run `ALTER ROLE sociallens CREATEDB;`.

Homebrew may initialize local PostgreSQL connections with `trust` authentication.
That is a local development configuration, not proof that the password is being
enforced. This project does not change PostgreSQL host authentication rules.
Deployment and database hardening are outside this foundation step.

### 3. Install backend dependencies and configure the environment

From the repository root:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp -n .env.example .env
python -c "import secrets; from dotenv import set_key; set_key('.env', 'DJANGO_SECRET_KEY', secrets.token_urlsafe(64))"
chmod 600 .env
```

Edit `.env` locally and replace `POSTGRES_PASSWORD` with the password you chose.
Do not overwrite an existing working `.env`. The secret-generation command is
for initial setup; do not regenerate the secret on every startup. The command
writes the secret directly to the ignored file without printing it.

| Variable | Meaning / example |
| --- | --- |
| `DJANGO_SECRET_KEY` | Required generated secret, at least 50 characters; no usable default |
| `DJANGO_DEBUG` | `true` for local development; defaults to `false`; only `true`/`false` accepted |
| `DJANGO_ALLOWED_HOSTS` | Required comma-separated names, e.g. `localhost,127.0.0.1`; no wildcard |
| `POSTGRES_DB` | Required database name, `sociallens` |
| `POSTGRES_USER` | Required database role, `sociallens` |
| `POSTGRES_PASSWORD` | Required real local password; example placeholder is rejected |
| `POSTGRES_HOST` | Required host, `127.0.0.1` |
| `POSTGRES_PORT` | Required port, `5432` |

`backend/.env` is loaded relative to the settings file, regardless of the current
working directory. Explicit process environment variables take precedence. Dotenv
`${...}` interpolation is disabled so password contents remain literal. Quote
passwords containing spaces or `#`; escape a single quote as `\'` inside a
single-quoted dotenv value. Empty required values and example placeholders fail
at startup. There is no SQLite fallback in development or tests.

Real credentials belong only in the ignored local `.env`. `.env.example` contains
placeholders. No frontend environment file is needed: relative `/api/` requests
use Vite's proxy. Never put secrets into `VITE_*` variables, which are public
client configuration.

### 4. Apply migrations

Still in `backend/`, with the virtual environment active:

```bash
python manage.py migrate
python manage.py check
python manage.py showmigrations
```

The custom user model is configured before the first migration. Apply the checked-in
`accounts/0001_initial.py`; a fresh checkout does not need `makemigrations`.

**Seeds and demonstration accounts:** none are needed for this foundation. The
integration screen uses no user data and has no login UI. Migrations initialize
the schema and Django's permission records. Tests create temporary sample users
in `test_sociallens` and remove that database afterward. An idempotent seed command,
demo users, and sample content must be added with the actual MVP; they are not
implemented or claimed here.

### 5. Install frontend dependencies

In another terminal, from the repository root:

```bash
cd frontend
npm ci
```

## Run locally

Keep PostgreSQL running. In terminal 1, from the repository root:

```bash
cd backend
source .venv/bin/activate
python manage.py runserver 127.0.0.1:8000
```

In terminal 2, from the repository root:

```bash
nvm use
cd frontend
npm run dev
```

`nvm use` applies to this terminal only and uses `.nvmrc`; if you do not use nvm,
select the tested Node version through your installation before running npm.

Open **http://127.0.0.1:5173/**. The page should change from "Checking connection"
to **"All systems connected"**. "Check again" performs a new database-backed request.
Stop each development server with Control+C. Vite uses strict port 5173 and forwards
`/api/` to `http://127.0.0.1:8000`; if a port is in use, stop your previous process
instead of killing unrelated services. No CORS package is needed for this same-origin
development flow. `npm run build` creates `frontend/dist/`; deployment/reverse-proxy
configuration for that build is not included.

## Verification guide

Backend, from `backend/` with its virtual environment active:

```bash
python -m pip check
python manage.py check
python manage.py migrate --check
python manage.py makemigrations --check --dry-run
python manage.py test accounts core --noinput --verbosity 2
```

Expect 14 passing tests on PostgreSQL, no pending migrations, and no system-check
issues. Tests verify persistence, email authentication at the Django model layer,
inactive-user rejection, hashed/unusable passwords, unique email/handles (including
database enforcement), regular/group/superuser permissions, real health queries,
safe 503 errors, rejected writes, and absent auth routes. They do not test or
implement an HTTP login flow.

Frontend, from `frontend/`:

```bash
npm run lint
npm run build
```

With both development servers running:

```bash
curl --fail-with-body http://127.0.0.1:8000/api/health/
curl --fail-with-body http://127.0.0.1:5173/api/health/
```

Both should return HTTP 200 with `{"status":"ok","database":"ok"}`. A database
connection/query failure returns HTTP 503 with
`{"status":"unavailable","database":"unavailable"}`, without connection details.
Responses include `Cache-Control: no-store`.

In the browser, verify the success state and retry button. Stop only your Django
development server, press "Check again", and verify the error state. Restart Django
and retry to verify recovery. Check a narrow/mobile viewport and keyboard focus.

To test an actual database outage without stopping PostgreSQL or changing `.env`,
run a separate backend against an unused local port (verify 65432 is unused first):

```bash
POSTGRES_PORT=65432 python -c "from config.wsgi import application; from wsgiref.simple_server import make_server; make_server('127.0.0.1', 8001, application).serve_forever()"
```

From another terminal, `curl -i http://127.0.0.1:8001/api/health/` should return 503.
Stop this temporary server with Control+C. This bypasses `runserver`'s startup
migration check so the deliberately broken database can reach the health view.

### Troubleshooting

- Missing configuration: edit `backend/.env` and replace placeholders; never paste
  its contents into an issue or screenshot.
- PostgreSQL unavailable: check `pg_isready`, service status, port, role, and database.
- Password authentication failed: ensure `.env` matches the password chosen at
  `createuser` and inspect local PostgreSQL authentication configuration.
- Permission denied creating a test database: the development role needs `CREATEDB`.
- Vite engine warning: select `.nvmrc` with nvm and run `npm ci` again.
- API/proxy error: start Django on port 8000; inspect its terminal. The frontend
  reports failures and times out after eight seconds instead of showing false success.
- Foundation passes but course MVP is incomplete: authentication and core user-flow
  features are intentionally deferred; see the current scope above.

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message and is merged after a code review.
- [ ] It runs locally, and its logic has been verified through tests or manual checks.
- [ ] It does not break previously-passing verification steps
- [ ] Any new setup, usage, or configuration steps are documented in the project README or relevant documentation.

## Process

SocialLens follows an incremental process. Since the project is already broken up into milestones with deliverables, it naturally fits to have one milestone correspond to one increment. See docs/BACKLOG.md for the current product backlog.
