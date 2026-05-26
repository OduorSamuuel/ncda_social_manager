import { getUser } from "@/features/user/actions";
import { getFacebookPosts } from "./actions";
import PostsClient from "./posts-client";
import { Post } from "./types";

interface Props {
  searchParams: Promise<{ page?: string; cursor?: string }>;
}

export default async function PostsPage({ searchParams }: Props) {
  const { page, cursor } = await searchParams;
  const currentPage = Number(page ?? 1);

  let posts: Post[] = [];
  let error: string | null = null;
  let nextCursor: string | null = null;
  let previousCursor: string | null = null;

  const [user, result] = await Promise.allSettled([
    getUser(),
    getFacebookPosts(cursor), // ← pass the cursor
  ]);

  const role = user.status === "fulfilled" ? user.value.role : "user";

  if (result.status === "fulfilled") {
    posts = result.value.posts;
    nextCursor = result.value.nextCursor;
    previousCursor = result.value.previousCursor;
  } else {
    error = (result.reason as Error).message;
  }

  return (
    <PostsClient
      initialPosts={posts}
      error={error}
      currentPage={currentPage}
      nextCursor={nextCursor}
      previousCursor={previousCursor}
      role={role}
    />
  );
}