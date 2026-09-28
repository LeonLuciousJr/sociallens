# Use Cases

## US-01: Register

### Overview

- **Primary Actor:** Unregistered user
- **Preconditions:** The user does not already have an account.
- **Postconditions:** A new account is created and the user holds a valid access token and refresh token. The subsequent requests are authenticated.

### Main Success Scenario
1. The user submits an email and password.
2. The system verifies the email is not already registered to an account.
3. The system verifies the password is strong enough.
4. The system creates a new account in the database with the provided email and the hashed password.
5. The system issues a new access token and refresh token pair.
6. The client stores the refresh token securely and attaches the access token to subsequent requests.

### Extensions
- **2a.** Email is already registered to an account: notify the user that the email is already registered and direct them to the login page.
- **3a.** Password is not strong enough: reject the registration attempt and notify the user of the password criteria.
- **4a.** If database transaction fails: Rollback the whole transaction and direct the user to try again later.
- **5a.** If refresh token issuance fails: system does not issue an access token either. This helps to mitigate no partial authentication state.

---

## US-02: Log In

### Overview

- **Primary Actor:** Registered user
- **Preconditions:** The user has a registered, verified account.
- **Postconditions:** The user holds a valid access token and refresh token. The subsequent requests are authenticated.

### Main Success Scenario
1. The user submits an email and password.
2. The system verifies the credentials against the stored password hash.
3. The system issues a new access token and refresh token pair.
4. The client stores the refresh token securely and attaches the access token to subsequent requests.

### Extensions
- **2a.** Credentials do not match: system returns a generic "invalid email or password" error, as to not reveal which field was incorrect, to avoid account enumeration security issue.
- **3a.** If refresh token issuance fails: system does not issue an access token either. This helps to mitigate no partial authentication state.

---

## US-03: Publish Post

### Overview

- **Primary Actor:** Author (an authenticated user)
- **Preconditions:** The user is authenticated.
- **Postconditions:** A `Post` exists and is visible on the public feed, following feed, and the author's profile.

### Main Success Scenario

1. The author creates a new draft post with a title and body.
2. The author requests to publish the draft.
3. The system validates the post has a non-empty title and body.
4. The system creates a copy of the post in the database.
5. The post becomes visible in the public feed, following feed, and on the author's profile.

### Extensions

- **1a.** Author navigates away mid-draft: the draft is discarded.
- **2a.** Author is no longer authenticated (e.g., jwt expired): system rejects with an authorization error.
- **3a.** Title or body is empty: system rejects the publish request and requests for the user to add a title or body.

---

## US-04: Browse Public Feed

### Overview

- **Primary Actor:** Reader (authenticated or visitor)
- **Preconditions:** None: the public feed is readable without authentication.
- **Postconditions:** The reader sees a list of published posts, most recent first.

### Main Success Scenario

1. The reader navigates to the feed.
2. The system retrieves published posts, ordered by publish date descending, in pages of a fixed size.
3. The reader may request the next page.

### Extensions

- **2a.** No posts exist yet: system shows an explicit empty state.
- **2b.** A requested page is beyond the available data: system returns an empty page rather than an error.

---

## US-07: Follow and Unfollow Creators

### Overview

- **Primary Actor:** Reader (an authenticated user)
- **Preconditions:** The user is authenticated.
- **Postconditions:** The reader's following feed is updated with the new author's posts.

### Main Success Scenario

1. The reader navigates to the feed.
2. The system checks if the reader is already following the author of each post.
3. The reader presses the follow button on a post to toggle whether they follow the author or not.
4. The system adds or removes the author from the reader's following list.

---

## US-08: Browse Following Feed

### Overview

- **Primary Actor:** Reader (authenticated or visitor)
- **Preconditions:** The user is authenticated.
- **Postconditions:** The reader sees a list of published posts from followed authors, most recent first.

### Main Success Scenario

1. The reader navigates to the following feed.
2. The system retrieves published posts by authors in the reader's following list, ordered by publish date descending, in pages of a fixed size.
3. The reader may request the next page.

### Extensions

- **2a.** Reader does not follow anyone: system shows an explicit empty state with text encouraging the user to follow some authors.
- **2b.** No posts exist yet: system shows an explicit empty state.
- **2c.** A requested page is beyond the available data: system returns an empty page rather than an error.
