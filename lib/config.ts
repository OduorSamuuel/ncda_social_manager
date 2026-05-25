
import { DraftRow } from "@/features/drafts/types";
import { Role } from "@/features/user/types";


export type EditorMode = "create" | "edit-draft" | "edit-post";


export interface PostEditorConfig {
  // ── Permissions / visibility ──────────────────────────────────────────────
  canPublish: boolean;       // admin-only action
  canSchedule: boolean;      // admin + not editing a live post
  canEditMedia: boolean;     // false when editing a live FB post
  canAttachLink: boolean;    // false when editing a live FB post
  showDraftStatus: boolean;  // show the status badge
  showRejectionNote: boolean;

  // ── Labels ───────────────────────────────────────────────────────────────
  saveDraftLabel: string;    // "Save draft" | "Update draft"
  primaryLabel: string;      // "Publish to Facebook" | "Schedule" | "Save changes" | "Submit for review"
  primaryLabelLoading: string;
  primaryLabelSuccess: string;
  confirmTitle: string;
  confirmDescription: (date?: string, time?: string) => string;
  confirmActionLabel: string;

  // ── Navigation ────────────────────────────────────────────────────────────
  backHref: string;

  // ── Warnings ─────────────────────────────────────────────────────────────
  editPostWarning?: string;
}

export function deriveConfig(
  mode: EditorMode,
  role: Role,
  draft?: DraftRow | null,
  fbPostId?: string,
  scheduled?: boolean,
): PostEditorConfig {
  const isAdmin = role === "admin";
  const isEditPost = mode === "edit-post";
  const isEditDraft = mode === "edit-draft";

  const backHref = isEditPost && fbPostId
    ? `/posts/${fbPostId}`
    : isEditDraft && draft
    ? `/drafts/${draft.id}`
    : "/drafts";

  const saveDraftLabel = draft?.id ? "Update draft" : "Save draft";

  // Primary label when idle
  let primaryLabel: string;
  if (isEditPost) {
    primaryLabel = "Save changes";
  } else if (!isAdmin) {
    primaryLabel = "Submit for review";
  } else if (scheduled) {
    primaryLabel = "Schedule";
  } else {
    primaryLabel = "Publish to Facebook";
  }

  const primaryLabelLoading = isEditPost ? "Saving…" : "Publishing…";
  const primaryLabelSuccess = isEditPost ? "Saved!" : "Published!";

  // Confirm dialog copy
  const confirmTitle = isEditPost
    ? "Save changes to this post?"
    : scheduled
    ? "Schedule this post?"
    : "Publish to Facebook?";

  const confirmDescription = (date?: string, time?: string) => {
    if (isEditPost) return "This will update the post text on Facebook immediately.";
    if (scheduled && date && time) return `Will publish on ${date} at ${time}.`;
    return "The post will go live on your Facebook page immediately.";
  };

  const confirmActionLabel = isEditPost ? "Save" : scheduled ? "Schedule" : "Publish";

  return {
    canPublish: isAdmin,
    canSchedule: isAdmin && !isEditPost,
    canEditMedia: !isEditPost,
    canAttachLink: !isEditPost,
    showDraftStatus: !!draft,
    showRejectionNote: draft?.status === "rejected" && !!draft.rejection_note,

    saveDraftLabel,
    primaryLabel,
    primaryLabelLoading,
    primaryLabelSuccess,
    confirmTitle,
    confirmDescription,
    confirmActionLabel,
    backHref,

    editPostWarning: isEditPost
      ? "Facebook only allows editing the post text. Images cannot be changed after publishing."
      : undefined,
  };
}