# Threat Model

## Attack Surface

- `POST /api/auth/register` — unauthenticated; accepts `email`, `displayName`, and `password`. The password must be at least 12 characters.
- `POST /api/auth/login` — unauthenticated; accepts credentials and returns JWT access and refresh tokens.
- `POST /api/posts` — authenticated; accepts post content, media type, caption, and optionally an image. The view sets the author from the authenticated user.
- `GET /api/posts` — public; returns a paginated feed, with `page`, `onlyFollowing`, and `liked` query parameters.
- `POST /api/like` and `DELETE /api/unlike` — authenticated; accept a target `postId`.
- `POST /api/follow` and `DELETE /api/unfollow` — authenticated; accept a target `authorId`.
- Image upload endpoint — authenticated; accepts an uploaded image and stores it on the server. Its exact URL depends on the route configured for `ImageUploadView`.
- JWT access tokens — bearer tokens sent in the `Authorization` header.

## STRIDE Analysis

| Component | Threat | STRIDE category | Likelihood | Impact | Preliminary risk | Mitigation |
|---|---|---|---|---|---|---|
| `POST /api/auth/register` | Automated account creation, or using registration responses to discover whether an email is registered | Denial of Service / Information Disclosure | Medium | Medium | Medium | Rate-limit registration; avoid unnecessarily revealing account details in errors; monitor abuse. |
| `POST /api/auth/login` | Repeated password guesses against an account | Spoofing / Denial of Service | Medium | High | High | Rate-limit login attempts; monitor suspicious attempts; use a generic error for invalid credentials. |
| JWT access and refresh tokens | A stolen bearer token is replayed to act as its owner | Spoofing | Medium | High | High | Require HTTPS; use appropriate token lifetimes and refresh-token rotation or revocation; keep signing keys secret and sufficiently strong. |
| `POST /api/posts` | A client attempts to publish as another user by supplying a forged author ID | Spoofing / Elevation of Privilege | Low, based on the shown view | High | Medium | The view uses `request.user` as the author and does not accept `authorId` from the serializer. Preserve this behavior and cover it with a regression test. |
| `GET /api/posts` | The feed returns more post or user information than intended, or filters expose posts to the wrong audience | Information Disclosure | Medium | Medium–High | Medium–High | Review `PostResponseSerializer` and `list_posts` access rules; test public, following-only, and liked-post results with multiple users. |
| Like and follow endpoints | A user manipulates target IDs or creates or removes relationships in unintended cases | Tampering / Elevation of Privilege | Medium | Medium | Medium | Ensure services bind the acting user to `request.user.pk`, validate target records, and enforce intended self-follow and deletion rules. Test these cases. |
| Image upload endpoint | Large or numerous uploads exhaust disk, memory, or processing capacity | Denial of Service | Medium | High | High | Enforce upload-size and image-dimension limits, rate-limit uploads, and monitor storage. `ImageField` validation alone is not an upload quota. |
| Post body and caption, as rendered by clients | Untrusted content is rendered as executable markup or script | Tampering / Information Disclosure | Medium | High | High | Treat post text as untrusted; escape it in client rendering and avoid unsafe HTML rendering. Test the rendering layer as well as the API. |

### Hardening Log

- 2026 — post creation sets the author from the authenticated request, rather than accepting an author ID from the client.
- 2026 — registration enforces a 12-character minimum password length; image upload uses DRF’s `ImageField`.
- 2026 — JWT lifetimes and refresh behavior set via Django config.
- 2026 — Rate limiting added to registration and login.
- 2026 — Logging added on failed login attempts.
- **Still to verify:** rate limits on uploads; image-size limits; feed visibility rules; and safe rendering of post content.

### Security Measurement Baseline

- Vulnerabilities found this pass: 8
- Maturity note: SocialLen's security practice is currently adhoc/reactive, not yet a finished state.
