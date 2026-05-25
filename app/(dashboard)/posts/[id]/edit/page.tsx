import { redirect } from "next/navigation";

import {
  uploadDraftMedia, getSignedUrl, deleteDraftMedia,
  saveDraft, publishDraft, 
} from "@/features/drafts/actions";
import { getUser } from "@/features/user/actions";
import { getFacebookPostById,updateFacebookPost } from "@/features/posts/actions";
import { PostEditor } from "@/features/posts/post-editor";
 
export const dynamic = "force-dynamic";
 
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [user, post] = await Promise.all([
    getUser(),
    getFacebookPostById(id),
  ]);

  if (user.role !== "admin") redirect("/drafts");
  if (!post) redirect("/posts");

  return (
    <PostEditor
      mode="edit-post"
      role={user.role}
      fbPostId={id}
      fbPostContent={post.content}
       fbMediaUrls={post.mediaUrls} 
actions={{ uploadDraftMedia, getSignedUrl, deleteDraftMedia, saveDraft, publishDraft, updateFacebookPost }}
    />
  );
}