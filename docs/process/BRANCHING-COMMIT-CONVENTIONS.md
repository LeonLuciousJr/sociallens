# Branching and Commit Conventions

SocialLens uses `main` as the stable integration branch. Development work is completed on separate branches and merged into `main` through pull requests after peer review.

## Branching

Branches are named based on the purpose of the work. Examples used during Milestone 2 include:

- `feature/public-feed`
- `frontend-tests`
- `backend-tests`
- `security-review`
- `security-fixes`

Changes are developed outside of `main`. When work is ready, a pull request is opened and reviewed by the other team member before being merged.

## Commits

Commit messages are short and descriptive and explain the purpose of the change.

Examples used during Milestone 2 include:

- `Allow anonymous public feed browsing`
- `Add frontend tests and coverage`
- `test: add auth integration tests`
- `security: rate limit login and register endpoints`
- `security: add logging to failed login attempts`

Prefixes such as `test:`, `security:`, and `docs:` may be used when helpful, but the main goal is for each commit message to clearly describe the change.

## Pull Requests and Reviews

Major changes are submitted through GitHub pull requests. The team uses peer review so that the team member who did not author the change reviews it before merging.

Pull requests include a short description of the change and any relevant testing or verification information.

## Milestone Tags

Submitted milestone versions are preserved with Git tags:

- `milestone-0`
- `milestone-1`
- `milestone-2`
