# Milestone 1: UX and Responsive Design

The React interface uses screen state in [App.jsx](../../frontend/src/App.jsx), not separate page routes. Navigation changes the visible screen without a full reload. The following describes implemented components rather than mock-ups or unrecorded screenshots.

## Screens and navigation

| Screen or view | Implemented behavior |
| --- | --- |
| Public feed | Header navigation, newest-first post cards, pagination, and a publishing invitation. Signed-out users currently see a login prompt even though the backend permits anonymous feed requests. |
| Registration | Display name, email, and password inputs; pending submission state; inline errors; link to login. Successful registration establishes a session and opens the feed. |
| Login | Email/password inputs, inline errors, and a registration link. Successful login opens the feed. |
| Post creation | Title and text inputs, optional image selection/preview/removal and caption, cancel/back controls, upload/publish progress, and inline errors. Leaving discards the draft. Image publication has the backend limitation recorded in the scope document. |
| Following / liked feeds | Filter buttons within the feed screen, selected-state indication, pagination, and filter-specific empty messages with a return to public posts. |

[PostCard](../../frontend/src/components/PostCard.jsx) displays title, text or image, optional caption, date, author identity, and like count. Authenticated users see explicit Like/Unlike and Follow/Unfollow actions. Liked views omit Like; Following views omit Follow. Own-post follow controls are hidden when identity is known. No comment controls or profile screens are present.

[Notice](../../frontend/src/components/Notice.jsx) separates status and error feedback. Feed failures offer retry; empty feeds provide a next action; pending forms and social actions disable their controls. Image failures show fallback text. A session-expiry response returns the user to login. Reload signs out because sessions are in memory.

## Responsive behavior

The following behavior comes directly from [index.css](../../frontend/src/index.css):

- **Wide screens:** Feed content and sidebar use a grid; authentication uses an introduction/form layout.
- **At 950px and below:** Reduced outer padding and grid gaps; narrower sidebar and authentication columns.
- **At 720px and below:** Feed and authentication layouts become single-column; header/navigation wrap; decorative sidebar/auth artwork is hidden; typography, card padding, and form padding shrink.
- **Flexible content:** Feed filters and post actions wrap. Post text and author labels wrap long content. Post images fit their containers with bounded height and `object-fit: contain`; preview images remain within available width.
- **Reduced motion:** The reduced-motion media query disables smooth scrolling.

These are implemented CSS adaptations, not a claim of exhaustive device testing.

## Accessibility and scope

The interface includes a skip link, labeled form inputs, semantic buttons, image alternative text, selected-filter `aria-pressed` states, and alert/status roles. These support keyboard and assistive-technology use but do not establish formal accessibility conformance.

Browser-history routing, persistent drafts, and persistent login are not implemented. Comments remain outside Milestone 1. See [product scope](product-brief-and-scope.md) for the brief technical limitations and [component designs](component-designs.md) for the underlying flows.
