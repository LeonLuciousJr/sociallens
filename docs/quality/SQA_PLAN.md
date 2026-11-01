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