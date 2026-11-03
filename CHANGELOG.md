# Changelog

## [Unreleased]


## Added
- Posts now support images.
- Added public feed which does not require an account to browse.
- Add rate limiting to the JWT login endpoint: up to 10 attempts per IP and 5 attempts per login identifier per minute.
- Return HTTP 429 with a JSON error message when a login rate limit is exceeded.
- Added logging for failed login attempts.

## Frontend Testing

- Added Vitest, Testing Library/jsdom, and V8 coverage with enforced frontend targets.
- Preserved 26 API tests and added 16 UI cases covering authentication, feeds,
  publishing forms, image-card social controls, errors, and session navigation.
- Added isolated viewport fixtures and observed layout evidence at 375/768/1440px.
- Documented frontend test/coverage commands; no application or backend code changed.

## Backend Testing

- Added pytest and pytest-django for testing.
- Added unit tests for user and post services.
- Added integration tests for auth, posts, and social routes.
