import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageLoader } from "@/components/shared/loading";
import { getDraftById } from "@/features/drafts/actions";
import { getUser } from "@/features/user/actions";
import DraftDetailClient from "@/features/drafts/draft-detail-client";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

async function DraftDetail({ id }: { id: string }) {
  let draft = null;
  let error: string | null = null;

  const user = await getUser();

  try {
    draft = await getDraftById(id);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!draft && !error) notFound();

  return <DraftDetailClient draft={draft} error={error} role={user.role} />;
}

export default async function DraftDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          <PageLoader />
        </div>
      }
    >
      <DraftDetail id={id} />
    </Suspense>
  );
}