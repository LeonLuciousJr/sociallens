# SocialLens frontend

React frontend on `feature/frontend`. Backend and shared API-contract/design files
are unchanged. Comments are excluded from Milestone 1 and have no UI or API calls.

## Run and verify

From the repository root, select the existing Node version with `nvm use`, then:

```bash
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173/. Vite forwards `/api/` and local Django `/media/` URLs to
http://127.0.0.1:8000. Absolute HTTP(S) media URLs also work. No frontend secret or
`.env` is needed. Production hosting must provide equivalent API/media routing.

```bash
node --test tests/api.test.mjs
npm run lint
npm run build
```

The application calls real endpoints. No demo login, fixtures, or mock data are
included in its runtime. The API tests use isolated fetch stubs and do not prove
that the teammate's backend works. Screen navigation uses React state; deep links
and browser history routing are not implemented.

## Integrated contracts

- Register: POST `/api/auth/register` with email/displayName/password.
- Login: POST `/api/auth/login` with email/password. Neither request needs an
  existing token. Successful responses create session state.
- Protected requests: `Authorization: Bearer <accessToken>`.
- User adapter retains only id/displayName/createdAt. Password hashes, email, and
  backend-only fields are not expected or copied from the User response.
- Public feed: GET `/api/posts`, available anonymously; a signed-in request carries
  Bearer auth. Load more uses the server's returned page plus one.
- Following/liked feeds: `followingOnly=true` or `liked=true` on the same posts
  endpoint. Pagination retains the filter. Visitors are sent to login; loading,
  error/retry, empty, and 401 states are preserved. Switching filters clears the
  old results and cancels the old request.
- Text publish: POST `/api/posts` with title/body, mediaType TEXT, empty media/caption.
- Image publish: select and preview an image; upload multipart FormData to
  `/api/media` with `file` and `mediaType=IMAGE`. The browser supplies the multipart
  Content-Type boundary. Accept the documented `{url, mediaId}` response (also a
  JSON URL string) and pass its URL into the post's `media` field with mediaType IMAGE.
  Image-only posts need a title but no body. Caption is optional.
- On upload failure, no post is sent. If publication fails after upload, the draft
  and successful upload URL are retained for retry; the image is not uploaded again
  unless replaced. Abandoning the draft may leave an uploaded file: no media deletion
  endpoint is contracted, so cleanup belongs to backend policy.
- Post adapter matches design-class data fields: id, authorId, title, body,
  mediaType, optional caption, likes, createdAt. For IMAGE responses, the design
  specifies the image URL in body. Unsafe image URL schemes are rejected. Adapter
  changes stay in `src/contract.js`.
- On successful publication, return to and reload the public feed. On an authenticated
  401, clear session state and open login.
- Logout is client-side only. No invented server logout/revocation request.

Sessions (user and both tokens) remain in memory. Reload signs out; no tokens or
passwords are written to localStorage/sessionStorage/URLs. A refresh endpoint is
not specified, so tokens are not automatically renewed.

## Social actions

All paths are centralized in `API_ROUTES` in `src/api.js`. The confirmed routes
enable the existing controls for signed-in users.

| Action | Method | Path | JSON body |
| --- | --- | --- | --- |
| Like | POST | `/api/like` | `{ postId }` |
| Unlike | DELETE | `/api/unlike` | `{ postId }` |
| Follow | POST | `/api/follow` | `{ userId }` (the post author's id) |
| Unfollow | DELETE | `/api/unfollow` | `{ userId }` (the post author's id) |

All use Bearer auth. Empty 204 responses are supported. Success reloads server data
instead of inventing like counts. Self-follow controls are hidden. Routes are never
constructed with URL fragments. Controls disable while their post has an action
in progress, and request errors remain visible on the card.

Post responses do not include liked-by-me or following-author flags. Controls are
explicit actions, not guessed toggles. A liked-feed result is known to be liked, so
only Unlike is offered there; similarly the Following feed only offers Unfollow.
Other-author names are not present in the Post schema and no user-lookup endpoint
exists: cards display the author ID; your own posts use your returned displayName.

The exact error envelope is still unspecified. Known documented code/message
strings are recognized within JSON, otherwise safe status-based errors are shown.
The first-page default and boolean-query handling still need verification with the
real backend. If upload `mediaType` expects a MIME string rather than the design's
IMAGE value, adjust the single field in `uploadImage` after backend confirmation.

## Verification and remaining work

- 24 Node tests cover auth, response projection, Bearer requests, filtered feeds,
  multipart uploads, image-only publication, body identifiers/DELETE bodies, empty
  204s, missing routes, invalid schemas, safe errors, and cancellation.
- Check lint and build with the commands above.
- Real-backend probe during implementation: no service listening at
  `127.0.0.1:8000`; end-to-end API verification remains pending.
- Once backend is running, verify registration/login, text/image persistence after
  feed refresh, URL rendering, invalid credentials, upload errors, expired sessions,
  and filter pagination. No backend source or service was changed by this work.
- With the real backend running, test like/unlike and follow/unfollow persistence,
  updated counts, filtered-feed membership, and repeated-action error handling.
- Frontend UI checks with temporary fixtures are not evidence of real persistence.
