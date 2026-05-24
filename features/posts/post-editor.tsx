"use client";

import { useMemo } from "react";
import { deriveConfig, type EditorMode } from "@/lib/config";
import { usePostEditor, type PostActions } from "@/hooks/use-post-editor";
import { PostEditorShell } from "./post-editor-shell";
import type { Role } from "@/features/user/actions";
import type { DraftRow } from "@/features/drafts/types";

interface PostEditorProps {
  mode: EditorMode;
  role: Role;
  actions: PostActions;
  draft?: DraftRow | null;
  fbPostId?: string;
  fbPostContent?: string;
}

export function PostEditor({ mode, role, actions, draft, fbPostId, fbPostContent }: PostEditorProps) {
  const editor = usePostEditor({ mode, role, actions, draft, fbPostId, fbPostContent });

  const config = useMemo(
    () => deriveConfig(mode, role, draft, fbPostId, editor.scheduled),
    [mode, role, draft, fbPostId, editor.scheduled]
  );

  return (
    <PostEditorShell
      config={config}
      draft={draft}
      content={editor.content}
      onContentChange={editor.setContent}
      linkUrl={editor.linkUrl}
      onLinkUrlChange={editor.setLinkUrl}
      charsLeft={editor.charsLeft}
      isOverLimit={editor.isOverLimit}
      scheduled={editor.scheduled}
      onScheduledChange={editor.setScheduled}
      scheduleDate={editor.scheduleDate}
      onScheduleDateChange={editor.setScheduleDate}
      scheduleTime={editor.scheduleTime}
      onScheduleTimeChange={editor.setScheduleTime}
      mediaFiles={editor.mediaFiles}
      fileInputRef={editor.fileInputRef}
      onFiles={editor.handleFiles}
      onRemoveMedia={editor.removeMedia}
      activeItem={editor.activeItem}
      dndSensors={editor.sensors}
      onDragStart={editor.handleDragStart}
      onDragEnd={editor.handleDragEnd}
      canAct={editor.canAct}
      isSubmitting={editor.isSubmitting}
      isSaving={editor.isSaving}
      submitError={editor.submitError}
      submitSuccess={editor.submitSuccess}
      confirmOpen={editor.confirmOpen}
      onConfirmOpenChange={editor.setConfirmOpen}
      onSaveDraft={editor.handleSaveDraft}
      onConfirmedSubmit={editor.handleConfirmedSubmit}
    />
  );
}