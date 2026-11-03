# SocialLens SQA Plan

## Standards
- All code changes follow the PR checklist (docs/reviews, .github/PULL_REQUEST_TEMPLATE.md)
- API contract conventions per docs/design/api-contract.md

## Reviews
- Every merged change is self-reviewed by the author and then peer-reviewed before merging

## Testing
- Unit tests: Services and Repositories
- Integration tests: Routes → Services → Repositories, using a real test DB
- Component tests: React components
- End-to-end tests: critical user flows, mobile + desktop viewports
- Automated accessibility checks
- Documentation verification
- Security testing
- Performance/load testing

## Defect Tracking
- All discovered defects (via review, testing, or manual use) recorded in docs/quality/DEFECT-LOG.md
- Each entry records: cause category, discovery stage, and remediation

## Ownership
- Our team which is implementing SocialLens owns SQA plan adherence.

## Frontend coverage and test procedure

From `frontend/` using Node 20.20.2: `npm ci`, `npm test`, `npm run coverage`,
`npm run lint`, and `npm run build`. `npm run test:api` selects the API suite.
Vitest with Testing Library/jsdom covers UI behavior; API tests mock fetch.

Enforce 80% lines, 80% statements, 80% functions, and 70% branches over all
`src/**/*.{js,jsx}`, including untested application files. These targets require
broad behavioral coverage while allowing some defensive branches; critical auth,
error, publishing, and social-control cases require explicit assertions regardless
of percentages. No source exclusions are configured. Review uncovered paths in
`frontend/coverage/index.html`; do not equate coverage with backend integration.

After changes, repeat login/register/feed/compose checks at 375, 768, and 1440px
using the isolated frontend fixture preview or a separately verified backend.
Record actual browser/platform, dimensions, results, and limitations. Never label
viewport emulation as cross-platform testing.
