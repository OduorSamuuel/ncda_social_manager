
import { deleteDraftMedia, getSignedUrl, publishDraft, saveDraft, uploadDraftMedia } from "@/features/drafts/actions";
import { updateFacebookPost } from "@/features/posts/actions";
import { PostEditor } from "@/features/posts/post-editor";

import { getUser } from "@/features/user/actions";


export const dynamic = "force-dynamic";
 
export default async function NewPostPage() {
  const user = await getUser();
 
  return (
    <PostEditor

      mode="create"
      role={user.role}
      actions={{ uploadDraftMedia, getSignedUrl, deleteDraftMedia, saveDraft, publishDraft, updateFacebookPost }}
    />
  );
}