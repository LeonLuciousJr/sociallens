# sociallens
A social media sharing web application developed for CS 415 Software Design &amp; Development

## Definition of Done

A backlog item is Done when:
- [ ] Code is committed with a descriptive message and is merged after a code review.
- [ ] It runs locally, and its logic has been verified through tests or manual checks.
- [ ] It does not break previously-passing verification steps
- [ ] Any new setup, usage, or configuration steps are documented in the project README or relevant documentation.

## Process

SocialLens follows an incremental process. Since the project is already broken up into milestones with deliverables, it naturally fits to have one milestone correspond to one increment. See docs/BACKLOG.md for the current product backlog.

## Developement

### Server

To run the server first make a PostgreSQL db like so:

```
docker run --name sociallens-postgres \
-e POSTGRES_USER=sociallens \
-e POSTGRES_PASSWORD=sociallens \
-e POSTGRES_DB=socaillens_dev \
-p 5432:5432 \
-d postgres:16
```

Then create an ```.env``` file with the values.

Next make sure uv is installed and you are in the backend directory and run

```
uv sync
uv run python manage.py makemigrations app
uv run python manage.py migrate
uv run python manage.py runserver
```

This will start the server locally

### Client

To run the client run

```
npm intall
npm run dev
```
