from unittest.mock import patch

from app.services.post_service import list_posts, publish_post


@patch("app.services.post_service.post_repository.create_post")
def test_publish_post_forwards_arguments_and_returns_post(mock_create_post):
    expected_post = {"id": "p1", "title": "Hello"}
    mock_create_post.return_value = expected_post

    result = publish_post(
        authorId="u1",
        title="Hello",
        body="World",
        media_type="image",
        media="photo.jpg",
        caption="A photo",
    )

    assert result == expected_post
    mock_create_post.assert_called_once_with(
        authorId="u1",
        title="Hello",
        body="World",
        media_type="image",
        media="photo.jpg",
        caption="A photo",
    )


@patch("app.services.post_service.post_repository.create_post")
def test_publish_post_uses_optional_defaults(mock_create_post):
    publish_post(
        authorId="u1",
        title="Hello",
        body="World",
        media_type="text",
    )

    mock_create_post.assert_called_once_with(
        authorId="u1",
        title="Hello",
        body="World",
        media_type="text",
        media=None,
        caption="",
    )


@patch("app.services.post_service.post_repository.list_posts")
def test_list_posts_forwards_arguments_and_returns_posts(mock_list_posts):
    expected_result = {"posts": [{"id": "p1"}], "has_more": False}
    mock_list_posts.return_value = expected_result

    result = list_posts(
        user_id="u1",
        page=2,
        only_following=True,
        liked=False,
    )

    assert result == expected_result
    mock_list_posts.assert_called_once_with(
        user_id="u1",
        page=2,
        only_following=True,
        liked=False,
    )


@patch("app.services.post_service.post_repository.list_posts")
def test_list_posts_uses_default_arguments(mock_list_posts):
    list_posts()

    mock_list_posts.assert_called_once_with(
        user_id=None,
        page=1,
        only_following=False,
        liked=False,
    )
