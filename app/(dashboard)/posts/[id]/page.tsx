import { Suspense } from "react";
import { notFound } from "next/navigation";

import { getFacebookPostById } from "@/features/posts/actions";
import { getUser } from "@/features/user/actions";
import PostDetailClient from "@/features/posts/post-detail-client";
import { PageLoader } from "@/components/shared/loading";

interface Props {
  params: Promise<{ id: string }>;
}

async function PostDetail({ id }: { id: string }) {
  let post = null;
  let error: string | null = null;

  const user = await getUser();

  try {
    post = await getFacebookPostById(id);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!post && !error) notFound();

  return <PostDetailClient post={post} error={error} role={user.role} />;
}

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<PageLoader />}>
      <PostDetail id={id} />
    </Suspense>
  );
}