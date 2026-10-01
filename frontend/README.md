# SocialLens frontend

This frontend targets the current merged backend implementation on `fix/integration`.
Shared API documents and backend source are unchanged. Comments are excluded.

## Run and verify

Use Node 20.20.2 (`nvm use` from the repository root), then:

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. The backend must run at http://127.0.0.1:8000.
Vite proxies `/api/` and `/uploads/`. Production hosting needs equivalent routing.

```sh
node --test tests/api.test.mjs
npm run lint
npm run build
```

## Backend compatibility

- Registration sends email/displayName/password; login sends email/password, with
  email lowercased to match backend account creation.
- Authentication returns `{access, refresh}`. These become memory-only session
  tokens; every protected request uses `Authorization: Bearer <access>`.
- No full User object is required. The JWT `user_id` claim is optionally decoded
  solely for the “You” label and hiding self-follow actions. This is not signature
  verification or authorization. Missing/undecodable claims do not prevent login.
  No display name or account creation timestamp is fabricated.
- All feeds require authentication. Signed-out visitors see a login prompt, without
  an anonymous posts request. Feed filters use `onlyFollowing=true` and `liked=true`.
- DRF `{count,next,previous,results}` becomes the UI's posts/page/hasMore. Page
  numbers start at 1. Subsequent requests use our centralized posts route and
  retain the selected filter; no Bearer token is sent to server-provided next URLs.
- Post adapters map `created_at`, count the `likes` relationship array, and render
  image URLs from `media_url` or `media`. IMAGE posts may also display text body.
- Text publication sends JSON with title/body/mediaType/caption and omits media.
  Publishing reads the directly returned Post object.
- Image publication uploads to `/api/media` first, then sends multipart post fields
  with the original file as `media`. The post serializer cannot accept the returned
  upload URL. The successful first upload is remembered while retrying the draft.
- Like/unlike send `{postId}`; follow/unfollow send `{authorId}`. All endpoint paths
  remain in `src/api.js`. Boolean action responses and empty 204s are accepted.
- Logout clears client state. Reload signs out. Automatic token refresh is not
  implemented. Failed requests preserve error/retry states.

## Known limitations and manual verification

Image publication is still blocked by backend code: `post_media_upload_to` reads
`instance.author_id`, but the Post model has `authorId` (`authorId_id`). The frontend
sends the accepted multipart shape but cannot repair that server-side save failure.
The separate first upload can leave an unused file; no cleanup endpoint exists.

Anonymous feeds and fetching full user profiles are unavailable from the current
backend. Relationship flags are absent, so social controls remain explicit actions,
not state-aware toggles. Other authors are labeled by ID.

The 26 frontend tests use fetch stubs shaped like backend responses, not a live
PostgreSQL integration. Verify real login/register, text persistence, pagination,
likes/follows and filtered feed membership with the running backend. Existing backend
validation errors may appear as generic frontend messages. No backend dependencies,
services, database, or source were changed by this frontend-only adaptation.
