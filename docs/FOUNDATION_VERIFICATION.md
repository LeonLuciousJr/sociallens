# Foundation implementation and local verification

Date: September 30, 2026 (America/Chicago).
Branch: `setup/base-integration`. No commits, pushes, merges, tags, branch switches, or changes to main.

## Scope and result

Foundation only: React/Vite, DRF, PostgreSQL, environment configuration, custom email-login user with public handle, initial migration, health endpoint, tests, and README. No registration/login routes or social features. This is not the completed Milestone 1 MVP.

The user created the sociallens role and supplied its password before implementation resumed. This implementation created the sociallens database owned by that role. The existing role supports login/CREATEDB and is not a superuser. No demonstration accounts were inserted in the development database. Test users existed only in Django's temporary test_sociallens database, removed by the test runner.

## Files modified

- `.gitignore`: ignore frontend dependencies and local environment variants; permit safe examples.
- `README.md`: reproducible installation, runtime versions, environment, migrations, seed applicability, startup, verification, limitations.
- `backend/.env` (ignored, preexisting user file): preserved password, added generated Django secret and local settings, set mode 0600. Values intentionally omitted.

## Files created

- `.nvmrc`
- `backend/.env.example`
- `backend/manage.py`
- `backend/requirements.in`
- `backend/requirements.txt`
- `backend/config/__init__.py`
- `backend/config/settings.py`
- `backend/config/urls.py`
- `backend/config/asgi.py`
- `backend/config/wsgi.py`
- `backend/accounts/__init__.py`
- `backend/accounts/apps.py`
- `backend/accounts/models.py`
- `backend/accounts/managers.py`
- `backend/accounts/tests.py`
- `backend/accounts/migrations/__init__.py`
- `backend/accounts/migrations/0001_initial.py`
- `backend/core/__init__.py`
- `backend/core/apps.py`
- `backend/core/repositories.py`
- `backend/core/services.py`
- `backend/core/views.py`
- `backend/core/urls.py`
- `backend/core/tests.py`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/index.html`
- `frontend/vite.config.js`
- `frontend/eslint.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api.js`
- `frontend/src/index.css`
- `docs/FOUNDATION_VERIFICATION.md`

Generated and ignored: backend/.venv/ (Python packages), backend Python caches, frontend/node_modules/ (npm packages and cache), frontend/dist/ (production build). These directories contain dependency/build files, not hand-authored source. Existing .gitkeep files were preserved. Existing BACKLOG.md, ADR, and use-cases.md were verified unchanged.

Browser evidence outside the repository: /private/tmp/sociallens-foundation.jpg and /private/tmp/sociallens-mobile.jpg.

## Checks and results

| Check | Result |
| --- | --- |
| Initial migrations | All 15 Django/accounts migrations applied successfully |
| Django system check | No issues |
| Migration drift | No changes detected |
| Pending migrations | None |
| Backend tests | 14/14 passed on PostgreSQL; temporary test database removed |
| pip dependency consistency | No broken requirements |
| Clean npm ci with Node 20.20.2 / npm 10.8.2 | Passed; 0 reported vulnerabilities |
| Frontend lint/build | Passed with verified Node 20, including npm scripts |
| Direct DRF health | 200, status/database ok |
| Vite proxy health | 200, same JSON, no-store header |
| Browser success / retry | Passed |
| Stopped backend | React displayed error; Vite's expected 500 observed |
| Real database outage | Temporary backend pointed at unused port 65432: HTTP 503, safe JSON, React database-unavailable message |
| Recovery | Healthy backend restored; React returned to success |
| Keyboard retry | Enter on retry button triggered a successful fresh check |
| Mobile viewport | 390px viewport, document width 390px (no horizontal overflow); screenshot captured |
| Invalid config | Empty secret, placeholder password, invalid debug, invalid port, wildcard hosts rejected |
| Secret/ignore checks | Real credentials absent from tracked/non-ignored source; .env ignored and .env.example included |
| Git whitespace / protected docs | Passed |

Temporary Django/Vite/outage servers were stopped after verification. PostgreSQL's Homebrew service was left running. No shell configuration was changed. Explicit runtime selection in commands was process-scoped.

## Issues encountered and resolved

- Initial sandboxed pip download failed on DNS/network restrictions; rerun with authorized network access succeeded.
- Initial sandboxed npm install did not progress and was interrupted with Control+C (session 5861). Network-enabled installation succeeded but the elevated shell selected Node 16.14.0/npm 8.3.1, producing engine warnings.
- Regenerated the npm lockfile with explicit Node 20.20.2/npm 10.8.2. Then verified a clean npm ci under that runtime with a command-scoped PATH.
- Plain npm run lint/build also selected Node 16 in this execution environment and failed. Both npm scripts then passed with the command-scoped Node 20 PATH. Use nvm use before the frontend commands in README; no machine-level Node installation was performed.
- npm reports ESLint 9.39.5 as deprecated; installation, lint, build, and package audit passed. No unsolicited major toolchain migration was made.
- Expected process exits from Control+C during outage testing are not application failures.

## Command transcript

These are the actual shell invocations during this implementation, including read-only checks and failed attempts. They are an audit record, not a script to rerun wholesale. Use README for portable setup. Unless stated otherwise, working directory is /Users/leonluciousjr/Documents/CS415_Project/sociallens. Tool-based file edits used apply_patch; backend/.env updates used the Python command below and did not print secrets. Tool output polling is not an additional shell command.

### 1

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
git status --short --branch
cat README.md
cat .gitignore
ls -la backend
python3.12 -c 'from pathlib import Path; p=Path("backend/.env"); print("Local .env exists:",p.is_file()); print("Password entry present:",p.is_file() and any(x.startswith("POSTGRES_PASSWORD=") and bool(x.split("=",1)[1].strip()) for x in p.read_text().splitlines()))'
```

### 2

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
/usr/local/opt/postgresql@16/bin/psql -d postgres -Atc "SELECT rolname, rolcanlogin, rolcreatedb, rolsuper FROM pg_roles WHERE rolname = 'sociallens'; SELECT datname FROM pg_database WHERE datname = 'sociallens';"
```

### 3

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
python3.12 -m venv backend/.venv
```

### 4

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
backend/.venv/bin/python -m pip install -r backend/requirements.in
```

### 5

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
npm install
```

### 6

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
backend/.venv/bin/python -m pip install -r backend/requirements.in
```

### 7

Working directory: `frontend`

```bash
npm install --fetch-retries=0
```

### 8

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
backend/.venv/bin/python - <<'PY'
from pathlib import Path
import secrets
from dotenv import dotenv_values
path = Path("backend/.env")
values = dotenv_values(path, interpolate=False)
if not values.get("POSTGRES_PASSWORD"):
    raise SystemExit("Missing password; no configuration changed.")
defaults = {
    "DJANGO_SECRET_KEY": secrets.token_urlsafe(64),
    "DJANGO_DEBUG": "true",
    "DJANGO_ALLOWED_HOSTS": "localhost,127.0.0.1",
    "POSTGRES_DB": "sociallens",
    "POSTGRES_USER": "sociallens",
    "POSTGRES_HOST": "127.0.0.1",
    "POSTGRES_PORT": "5432",
}
with path.open("a") as target:
    target.write("\n")
    for key, value in defaults.items():
        if key not in values:
            target.write(f"{key}={value}\n")
path.chmod(0o600)
print("Completed ignored local configuration; preserved password; permissions 0600.")
PY
backend/.venv/bin/python -m pip freeze > backend/requirements.txt
```

### 9

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
/usr/local/opt/postgresql@16/bin/createdb --owner=sociallens sociallens
```

### 10

Working directory: `frontend`

```bash
/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node /Users/leonluciousjr/.nvm/versions/node/v20.20.2/lib/node_modules/npm/bin/npm-cli.js install --package-lock-only --fetch-retries=0
```

### 11

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
.venv/bin/python manage.py makemigrations accounts
```

### 12

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py check
.venv/bin/python manage.py makemigrations --check --dry-run
.venv/bin/python manage.py test accounts core --noinput --verbosity 2
```

### 13

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node node_modules/eslint/bin/eslint.js .
/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node node_modules/vite/bin/vite.js build
```

### 14

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
cat backend/requirements.txt
cat backend/accounts/migrations/0001_initial.py
node -p 'JSON.stringify({node:process.version,react:require("./frontend/node_modules/react/package.json").version,vite:require("./frontend/node_modules/vite/package.json").version})'
git diff --check
```

### 15

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
env PATH="/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin:$PATH" /Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node /Users/leonluciousjr/.nvm/versions/node/v20.20.2/lib/node_modules/npm/bin/npm-cli.js ci --fetch-retries=0
```

### 16

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
.venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload
```

### 17

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node node_modules/vite/bin/vite.js
```

### 18

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
curl --fail-with-body -i http://127.0.0.1:8000/api/health/
curl --fail-with-body -i http://127.0.0.1:5173/api/health/
.venv/bin/python -m pip check
.venv/bin/python manage.py migrate --check
```

### 19

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
Control+C sent to Django server session 82990 for browser outage testing.
```

### 20

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
POSTGRES_PORT=65432 .venv/bin/python -c "import socket; probe=socket.socket(); probe.settimeout(1); assert probe.connect_ex(('127.0.0.1',65432)) != 0, 'Port 65432 is in use'; probe.close(); from config.wsgi import application; from wsgiref.simple_server import make_server; make_server('127.0.0.1',8000,application).serve_forever()"
```

### 21

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
npm run lint
npm run build
```

### 22

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
curl -i http://127.0.0.1:5173/api/health/
```

### 23

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
Control+C sent to temporary outage backend session 57733.
```

### 24

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/backend`

```bash
.venv/bin/python manage.py runserver 127.0.0.1:8000 --noreload
```

### 25

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens/frontend`

```bash
env PATH="/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin:$PATH" /Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node /Users/leonluciousjr/.nvm/versions/node/v20.20.2/lib/node_modules/npm/bin/npm-cli.js run lint
env PATH="/Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin:$PATH" /Users/leonluciousjr/.nvm/versions/node/v20.20.2/bin/node /Users/leonluciousjr/.nvm/versions/node/v20.20.2/lib/node_modules/npm/bin/npm-cli.js run build
```

### 26

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
backend/.venv/bin/python - <<'PY'
import os
import subprocess
from pathlib import Path
from dotenv import dotenv_values
root = Path.cwd()
env = os.environ.copy()
env.update({k:v for k,v in dotenv_values(root / "backend/.env", interpolate=False).items() if v is not None})
cases = [
    ("missing secret", {"DJANGO_SECRET_KEY": ""}),
    ("placeholder password", {"POSTGRES_PASSWORD": "replace-with-your-local-database-password"}),
    ("invalid debug", {"DJANGO_DEBUG": "perhaps"}),
    ("invalid port", {"POSTGRES_PORT": "not-a-port"}),
    ("wildcard hosts", {"DJANGO_ALLOWED_HOSTS": "*"}),
]
for label, change in cases:
    result = subprocess.run([str(root / "backend/.venv/bin/python"), "manage.py", "check"], cwd=root / "backend", env={**env, **change}, capture_output=True)
    assert result.returncode != 0 and b"ImproperlyConfigured" in result.stderr, label
    print(label + ": rejected safely")
PY
```

### 27

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
git status --short --branch
git diff --check
git diff --exit-code -- docs/BACKLOG.md docs/architecture/adr-001-modular.monolith.md docs/requirements/use-cases.md
git check-ignore backend/.env
git ls-files --cached --others --exclude-standard
backend/.venv/bin/python - <<'PY'
from pathlib import Path
import subprocess
from dotenv import dotenv_values
values = dotenv_values("backend/.env", interpolate=False)
files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], text=True).splitlines()
for filename in files:
    data = Path(filename).read_bytes()
    for key in ("POSTGRES_PASSWORD", "DJANGO_SECRET_KEY"):
        value = values.get(key)
        if value and value.encode() in data:
            raise SystemExit(f"Secret scan failed: {key} in {filename}")
print("Secret scan passed for all tracked and non-ignored candidate files.")
assert "backend/.env" not in files
assert "backend/.env.example" in files
print("Real .env ignored; example configuration remains eligible for version control.")
PY
```

### 28

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
Control+C sent to restored Django session 33196 and Vite session 64900 after successful verification.
```

### 29

Working directory: `/Users/leonluciousjr/Documents/CS415_Project/sociallens`

```bash
git diff --check
git diff --exit-code -- docs/BACKLOG.md docs/architecture/adr-001-modular.monolith.md docs/requirements/use-cases.md
git status --short --branch
backend/.venv/bin/python - <<'PY'
from pathlib import Path
import subprocess
from dotenv import dotenv_values
values = dotenv_values("backend/.env", interpolate=False)
files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard"], text=True).splitlines()
for filename in files:
    content = Path(filename).read_bytes()
    for key in ("POSTGRES_PASSWORD", "DJANGO_SECRET_KEY"):
        value = values.get(key)
        assert not value or value.encode() not in content, f"Secret found in {filename}"
assert "backend/.env" not in files and "backend/.env.example" in files
print("Final secret/ignore checks passed.")
PY
```

## Other tool operations

- Read official Django authentication, Vite proxy, and DRF view documentation.
- Queried the bundled workspace dependency paths; no machine-level packages installed.
- Created/edited the files listed above with apply_patch. Generated migration via Django and dependency lockfiles via pip/npm.
- Browser: opened http://127.0.0.1:5173/, verified success; clicked Check again; stopped backend and checked error; tested database-unavailable error with temporary backend; restored healthy backend and checked recovery; set viewport to 390x844 and verified no horizontal overflow; reset viewport; pressed Enter on Check again; captured screenshots; closed temporary tab.
- Development servers were controlled only through their own tool sessions, not broad process-kill commands.

## Remaining manual / later verification

No blocking manual check remains for the local foundation. A second-person fresh clone/run on another computer is still recommended; this has not been performed. Current source is uncommitted and unpushed, so the remote is not yet the foundation version. Cross-platform/browser compatibility beyond this macOS/in-app-browser run is unverified. Homebrew's local trust authentication was not changed; successful connections do not prove password enforcement. The full authenticated MVP, demo/seed data, remaining course artifacts, peer review, and approved release/version actions remain separate future work.

