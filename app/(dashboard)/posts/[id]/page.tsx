
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getFacebookPostById } from "@/features/posts/actions";
import PostDetailClient from "@/features/posts/post-detail-client";


//export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function PostDetail({ id }: { id: string }) {
  let post = null;
  let error: string | null = null;

  try {
    post = await getFacebookPostById(id);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!post && !error) notFound();

  return <PostDetailClient post={post} error={error} />;
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading post…
        </div>
      }
    >
      <PostDetail id={id} />
    </Suspense>
  );
}