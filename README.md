# sociallens
A social media sharing web application developed for CS 415 Software Design & Development

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message and is merged after a code review.
- [ ] It runs locally, and its logic has been verified through tests or manual checks.
- [ ] It does not break previously-passing verification steps
- [ ] Any new setup, usage, or configuration steps are documented in the project README or relevant documentation.

## Process

SocialLens follows an incremental process. Since the project is already broken up into milestones with deliverables, it naturally fits to have one milestone correspond to one increment. See docs/BACKLOG.md for the current product backlog.

## Development

### Option 1: Docker Compose (Recommended)

#### Prerequisites
- Docker Engine (Linux) or Docker Desktop (macOS/Windows), with Docker Compose v2 (`docker compose`)
- Node.js: ^20.19.0 or >=22.12.0 (for running the React client locally)

#### Setup & Run

1. Create a `.env` file in the **project root** for Docker Compose:
   ```env
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_DEBUG=False
   ```

2. From the project root, build and start PostgreSQL 16 and the Django API (Gunicorn):
   ```sh
   docker compose up --build
   ```
   - **Backend API:** http://localhost:8000
   - **PostgreSQL (host port):** `localhost:5433` (mapped from container port `5432` to avoid conflicts with any local PostgreSQL instance)

   Database migrations run automatically on backend startup via `backend/docker-entrypoint.sh`, and uploaded media persists in the `sociallens_uploads` Docker volume.

3. In a separate terminal, start the React client locally from `frontend/`:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
   - **Frontend client:** http://localhost:5173 (Vite proxies `/api/` and `/uploads/` requests to `http://127.0.0.1:8000`)

4. **Common Docker commands:**
   - **Stop containers (preserving database and uploads):**
     ```sh
     docker compose down
     ```
   - **Stop containers and wipe database/upload volumes:**
     ```sh
     docker compose down -v
     ```
   - **Rebuild after adding Python dependencies (`uv add`) or changing backend code:**
     ```sh
     docker compose up --build
     ```

---

### Option 2: Manual Local Setup (Without Docker Compose)

#### Prerequisites
- Python: 3.13 or later
- Node.js: ^20.19.0 or >=22.12.0
- PostgreSQL: 16
- uv

#### Server

Start a standalone PostgreSQL 16 container:

```sh
docker run --name sociallens-postgres \
  -e POSTGRES_USER=sociallens \
  -e POSTGRES_PASSWORD=sociallens \
  -e POSTGRES_DB=sociallens_dev \
  -p 5432:5432 \
  -d postgres:16
```

Create a `.env` file in `/backend`, using `backend/.env.example` as a guide.

Next, navigate to the `backend/` directory and run:

```sh
uv sync
uv run python manage.py migrate
uv run python manage.py runserver
```

#### Client

From the `frontend/` directory, run:

```sh
npm install
npm run dev
```

---

### Frontend tests and coverage

With Node ^20.19.0 or >=22.12.0 (`nvm use`), run from `frontend/`:

```sh
npm ci
npm test
npm run coverage
npm run lint
npm run build
```

`npm run test:api` runs only the preserved API tests. Vitest/Testing Library tests
use mocked requests; they do not verify Django/PostgreSQL. Coverage includes every
`src/**/*.{js,jsx}` file, including startup code, with no application exclusions.
Targets: 80% lines/statements/functions and 70% branches. Reports are generated in
`frontend/coverage/` (HTML, LCOV, JSON summary; ignored by Git).

For an isolated visual preview: `node tests/viewport-server.mjs` from `frontend/`,
then open http://127.0.0.1:5174. This serves synthetic auth/feed data only; do not
use real credentials. Check login, registration, feed, and compose at 375, 768,
and 1440px. Stop with Ctrl-C. See `frontend/tests/evidence/results.json` and saved
feed images for observed results. Real backend flows and other OS/browser testing
remain separate verification tasks.

### Backend tests

Because the production Docker image omits development dependencies (`--no-dev`), run `pytest` locally from `backend/` using `uv`. Make sure PostgreSQL is running (either via `docker compose up db` on port `5433` or locally on port `5432`) and `backend/.env` matches its port and credentials.

To run the full suite:

```sh
cd backend
uv sync
uv run pytest
```

To run a specific test suite:

```sh
uv run pytest tests/unit
uv run pytest tests/integration
```