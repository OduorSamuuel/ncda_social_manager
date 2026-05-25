import { getDraftById ,getSignedUrl,uploadDraftMedia,deleteDraftMedia,saveDraft,publishDraft} from "@/features/drafts/actions";
import { PostEditor } from "@/features/posts/post-editor";
import { getUser } from "@/features/user/actions";
import { updateFacebookPost } from "@/features/posts/actions";
import { redirect } from "next/navigation";


export const dynamic = "force-dynamic";
 
export default async function EditDraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, draft] = await Promise.all([
    getUser(),
    getDraftById(id),
  ]);

  if (!draft) redirect("/drafts");

  return (
    <PostEditor
      mode="edit-draft"
      role={user.role}
      draft={draft}
      actions={{ uploadDraftMedia, getSignedUrl, deleteDraftMedia, saveDraft, publishDraft, updateFacebookPost }}
    />
  );
}