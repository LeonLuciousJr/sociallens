# SocialLens Server Module Structure

## Routes / Controllers (boundary classes)
- Receive HTTP requests, call the correct service, return HTTP responses.
- Never query the Django ORM or the database directly.

## Services
- **PostService** — business rules for posts: ownership, publishing, media types.
- **UserService** — exclusive ownership of user modification: registration.
- **MediaService** — handles uploading user media: uploads, media absolute urls
- **SocialService** — handles the transactions between users and users, and users and posts: likes, follows
- There is no separate auth service as that is handled by django automatically.

## Repositories (persistence classes)
- **UserRepository**, **PostRepository**, **MediaRepository**, **SocialRepository** — the only modules that talk to the PostgreSQL database and media storage through the Django ORM.

## Dependency flow
Routes -> AuthService -> UserRepository -> PostgreSQL
Routes -> PostService -> PostRepository -> PostgreSQL
Routes -> SocialService -> SocialRepository -> PostgreSQL
Routes -> MediaService -> MediaRepository -> ServerStorage

Modules pass simple data objects to each other; none depends on another's internal implementation details.