# SocialLens Design Classes

## User (entity)
- id: string
- email: string (unique)
- displayName: string
- passwordHash: string
- createdAt: DateTime
+ verifyPassword(plain: string): boolean

## Post (entity)
- id: string
- authorId: string
- title: string
- body: string
- mediaType: Media (TEXT | IMAGE)
- caption: string?
- likes: integer
- createdAt: DateTime
+ publish(): void
+ isOwnedBy(userId: string): boolean

Relationship: User "1" --> "*" Post (authors)

### Design decisions
- **Post.mediaType uses fixed values, not free text.** Catches typos like early. Tradeoff: adding VIDEO later requires a schema change.
- **Post.body uses a link string rather than storing an image as bytes.** By storing a link to the image rather than the image directly, it makes adding video or other media types later easier.
- **likes count stored directly on Post.** The amount of likes will be added or subtracted from each post's total when a user makes the action, instead of having to count each like manually when displaying the post. Tradeoff: way less db reads, but will be a little trickier to implement.
- **authorId is stored directly on Post.** Each post has exactly one author, so no join table is needed; a join table would only be justified if posts could have multiple authors.
- **AuthService, not User, owns password hashing and verification.** Keeps User focused on representing user data; hashing method can change later without touching User.