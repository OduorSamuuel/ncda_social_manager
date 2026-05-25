import { getScheduledPosts } from "@/features/schedule/actions";
import ScheduledClient from "@/features/schedule/scheduled-client";
import { ScheduledPost } from "@/features/schedule/types";



export default async function ScheduledPage() {
  let posts: ScheduledPost[] = [];
  let error: string | null = null;
  try {
    posts = await getScheduledPosts();
  } catch (e) {
    error = (e as Error).message;
  }
  return <ScheduledClient initialPosts={posts} error={error} />;
}