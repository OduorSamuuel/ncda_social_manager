import UserDraftList from "@/features/drafts/user-draft-list";
import { getUser } from "@/features/user/actions";
import AdminDraftQueue from "@/features/drafts/admin-draft-queue";
import { getDrafts } from "@/features/drafts/actions";
import { Suspense } from "react";
import { PageLoader } from "@/components/shared/loading";

export const dynamic = "force-dynamic";

async function Drafts() {
  const user = await getUser();
  const drafts = await getDrafts();

  if (user.role === "admin") {
    return <AdminDraftQueue initialDrafts={drafts} />;
  }

  return <UserDraftList initialDrafts={drafts} />;
}

export default function DraftsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Drafts />
    </Suspense>
  );
}