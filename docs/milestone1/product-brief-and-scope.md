# Milestone 1: Product Brief and MVP Scope

SocialLens is a React, Django REST Framework, and PostgreSQL social-media application for publishing short text or image posts, discovering recent content, and keeping track of interesting posts and creators. Milestone 1 centers on the flow **register or log in → browse → publish → interact → revisit personalized feeds**.

This implementation snapshot supplements the [backlog](../BACKLOG.md), [use cases](../requirements/use-cases.md), [API contract](../design/api-contract.md), and [design classes](../design/design-classes.md). Those artifacts retain the original planning decisions; the table below describes the current source rather than declaring backlog items complete.

| MVP feature | Current implementation |
| --- | --- |
| Registration and login | Email/password authentication; registration also collects a display name. JWT access and refresh tokens are held in frontend memory. Logout clears that session. |
| Public feed | Paginated, newest-first posts. The backend permits anonymous GET requests, but the current frontend requires sign-in to browse. |
| Following and liked-post feeds | Feed filters request posts from followed creators or posts liked by the signed-in user. |
| Text posts | Authenticated creation with title and body; successful publication returns to the feed. |
| Image posts | Image selection, preview, optional text/caption, upload, multipart publication, and image rendering are implemented. The backend save-path defect below prevents claiming completed image publication. |
| Like/unlike | Authenticated actions on post cards, followed by a feed refresh. |
| Follow/unfollow | Authenticated actions targeting a post's author; self-follow controls are hidden when the session identity is available. |

**Comments are excluded from Milestone 1**, including comment creation, display, and commented-post filtering. Creator profile pages, automatic token refresh, persistent sessions across reloads, and additional social features are outside this implemented MVP.

## Integration status and limitations

The checkout contains the merged frontend compatibility work and backend public-feed permission change (merge commits `943ff9e` and `6c87f79`). Their presence establishes implementation history, not proof that every flow passed end-to-end testing. Frontend fetch-stub tests do not verify database persistence.

- Image publication still references `instance.author_id` in the backend upload-path function; the model's foreign-key attribute is `authorId_id`. Image publication is therefore not documented as verified.
- Anonymous public browsing is available in the API but remains gated by the frontend.
- The API does not provide full user profiles or relationship-state flags to the frontend. Cards use author IDs and explicit social-action buttons. Sessions end on reload.

See [component designs](component-designs.md) for actual request flows and [UX documentation](ux-and-responsive-design.md) for the implemented screens.
