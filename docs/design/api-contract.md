# SocialLens API Contract

## POST /api/auth/register
Request: { email: string, displayName: string, password: string }
Success: 201 { user: User, accessToken: string, refreshToken: string }
Errors:
    400 EMAIL_ALREADY_REGISTERED — "This email is already registered."
    400 WEAK_PASSWORD — "Password does not meet strength requirements."

## POST /api/auth/login
Request: { email: string, password: string }
Success: 200 { user: User, accessToken: string, refreshToken: string }
Errors:
    401 INVALID_CREDENTIALS — "Invalid email or password."

## GET /api/posts?page=n&followingOnly=b&liked=b
Success: 200 { posts: Post[], page: number, hasMore: boolean }

## POST /api/media
Request: { file: imageFile, mediaType: string }
Success: 201 { mediaId: string, url: string }
Errors:
    400 MEDIA_REQUIRED — "A media file is required."
    400 INVALID_MEDIA_TYPE — "Media type must be an image."

## POST /api/posts
Request: { title: string, body: string, mediaType: string, media: string, caption: string}
Success: 201 { post: Post }
Errors:
    422 TITLE_REQUIRED — "Title must not be blank."
    422 BODY_OR_MEDIA_REQUIRED — "Either body or media must be provided."
    422 INVALID_MEDIA — "Media is invalid or unsupported."
    401 UNAUTHENTICATED — "Authentication is required to post."

## POST /api/like#postId
Success: 201 { userId: string, postId: string }

## DELETE /api/unlike#postId
Success: 204 { No Content }

## POST /api/follow#authorId
Success: 201 { userId: string, authorId: string }

## DELETE /api/unfollow#authorId
Success: 204 { No Content }