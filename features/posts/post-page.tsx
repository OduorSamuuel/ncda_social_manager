import { getFacebookPosts } from "./actions";
import PostsClient from "./posts-client";
import { Post } from "./types";

interface Props {
  page?: string;
  cursor?: string;
}

export default async function PostsPage({ page, cursor }: Props) {
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  let posts: Post[] = [];
  let error: string | null = null;
  let nextCursor: string | null = null;
  let previousCursor: string | null = null;

  try {
    const result = await getFacebookPosts(cursor);
    posts = result.posts;
    nextCursor = result.nextCursor;
    previousCursor = result.previousCursor;
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <PostsClient
      initialPosts={posts}
      error={error}
      currentPage={currentPage}
      nextCursor={nextCursor}
      previousCursor={previousCursor}
    />
  );
}