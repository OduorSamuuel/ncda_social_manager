import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { Check, X, CalendarClock } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";



import { Role } from "@/features/user/types";
import { EditorMode } from "@/lib/config";
import { DraftRow } from "@/features/drafts/types";

export interface MediaFile {
  id: string;
  storagePath?: string;
  previewUrl: string;
  uploading?: boolean;
  error?: string;
}

export interface PostActions {
  uploadDraftMedia: (fd: FormData) => Promise<{ path: string }>;
  getSignedUrl: (path: string) => Promise<{ url: string }>;
  deleteDraftMedia: (path: string) => Promise<void>;
  saveDraft: (
    content: string,
    opts: {
      linkUrl?: string;
      mediaPaths?: string[];
      scheduledFor?: string;
      draftId?: string;
    }
  ) => Promise<void>;
  publishDraft: (
    draftId: string,
    opts: { content: string; scheduledFor?: string }
  ) => Promise<void>;
  updateFacebookPost: (fbPostId: string, content: string) => Promise<void>;
}

interface UsePostEditorParams {
  mode: EditorMode;
  role: Role;
  actions: PostActions;
  draft?: DraftRow | null;
  fbPostId?: string;
  fbPostContent?: string;
}

const MAX_CHARS = 63206;

export function usePostEditor({
  mode,
  role,
  actions,
  draft,
  fbPostId,
  fbPostContent,
}: UsePostEditorParams) {
  const router = useRouter();
  const isAdmin = role === "admin";
  const isEditPost = mode === "edit-post";

  // ── Content ─────────────────────────────────────────────────────────────────
  const [content, setContent] = useState(
    isEditPost ? (fbPostContent ?? "") : (draft?.content ?? "")
  );
  const [linkUrl, setLinkUrl] = useState(draft?.link_url ?? "");

  // ── Schedule ─────────────────────────────────────────────────────────────────
  const [scheduled, setScheduled] = useState(!!draft?.scheduled_for);
  const [scheduleDate, setScheduleDate] = useState(
    draft?.scheduled_for ? draft.scheduled_for.slice(0, 10) : ""
  );
  const [scheduleTime, setScheduleTime] = useState(
    draft?.scheduled_for ? draft.scheduled_for.slice(11, 16) : ""
  );

  // ── Media ────────────────────────────────────────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Submission state ─────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isUploading = mediaFiles.some((m) => m.uploading);
  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  const canAct =
    content.trim().length > 0 && !isSubmitting && !isSaving && !isUploading;

  // ── Load existing draft media ─────────────────────────────────────────────────
  useEffect(() => {
    if (!draft?.media_paths?.length) return;
    (async () => {
      const loaded: MediaFile[] = await Promise.all(
        draft.media_paths.map(async (path) => {
          try {
            const { url } = await actions.getSignedUrl(path);
            return { id: path, storagePath: path, previewUrl: url };
          } catch {
            return {
              id: path,
              storagePath: path,
              previewUrl: "",
              error: "Failed to load preview",
            };
          }
        })
      );
      setMediaFiles(loaded);
    })();
  }, [draft]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File upload ───────────────────────────────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newFiles: MediaFile[] = Array.from(files).map((file) => ({
        id: `local-${file.name}-${Date.now()}-${Math.random()}`,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);

      for (let i = 0; i < newFiles.length; i++) {
        const mf = newFiles[i];
        const file = Array.from(files)[i];
        try {
          const fd = new FormData();
          fd.append("file", file);
          const { path } = await actions.uploadDraftMedia(fd);
          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === mf.id ? { ...m, uploading: false, storagePath: path } : m
            )
          );
        } catch (err) {
          setMediaFiles((prev) =>
            prev.map((m) =>
              m.id === mf.id
                ? { ...m, uploading: false, error: (err as Error).message }
                : m
            )
          );
        }
      }
    },
    [actions]
  );

  const removeMedia = useCallback(
    async (id: string) => {
      const m = mediaFiles.find((f) => f.id === id);
      if (!m) return;
      if (m.previewUrl.startsWith("blob:")) URL.revokeObjectURL(m.previewUrl);
      if (m.storagePath) {
        try {
          await actions.deleteDraftMedia(m.storagePath);
        } catch {
          // best-effort
        }
      }
      setMediaFiles((prev) => prev.filter((f) => f.id !== id));
    },
    [mediaFiles, actions]
  );

  // ── DnD ───────────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleDragStart = useCallback(
    (e: DragStartEvent) => setActiveId(e.active.id as string),
    []
  );

  const handleDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setMediaFiles((prev) => {
        const oldIdx = prev.findIndex((m) => m.id === active.id);
        const newIdx = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  }, []);

  const activeItem = mediaFiles.find((m) => m.id === activeId);

  // ── Save draft ────────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    if (!canAct) return;
    setIsSaving(true);
    try {
      const mediaPaths = mediaFiles
        .filter((m) => m.storagePath && !m.error)
        .map((m) => m.storagePath!);

      await actions.saveDraft(content, {
        linkUrl: linkUrl || undefined,
        mediaPaths,
        scheduledFor:
          scheduled && scheduleDate && scheduleTime
            ? `${scheduleDate}T${scheduleTime}`
            : undefined,
        draftId: draft?.id,
      });

      notifications.show({
        title: draft?.id ? "Draft updated" : "Draft saved",
        message: "It's waiting in the drafts queue.",
        color: "green",
        icon: <Check size={16} />,
        autoClose: 4000,
      });
 
  setTimeout(() => router.push("/drafts"), 1500);

    } catch (err) {
      notifications.show({
        title: "Failed to save draft",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setIsSaving(false);
    }
  }, [canAct, mediaFiles, actions, content, linkUrl, scheduled, scheduleDate, scheduleTime, draft,router]);

  // ── Publish / update ──────────────────────────────────────────────────────────
  const handleConfirmedSubmit = useCallback(async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditPost && fbPostId) {
        await actions.updateFacebookPost(fbPostId, content);
        notifications.show({
          title: "Post updated",
          message: "Changes are now live on Facebook.",
          color: "green",
          icon: <Check size={16} />,
          autoClose: 4000,
        });
      } else if (draft?.id) {
        const scheduledFor =
          scheduled && scheduleDate && scheduleTime
            ? `${scheduleDate}T${scheduleTime}`
            : undefined;

        await actions.publishDraft(draft.id, { content, scheduledFor });

        notifications.show(
          scheduledFor
            ? {
                title: "Post scheduled",
                message: `Will go live on ${scheduleDate} at ${scheduleTime}.`,
                color: "blue",
                icon: <CalendarClock size={16} />,
                autoClose: 5000,
              }
            : {
                title: "Post published",
                message: "Now live on Facebook.",
                color: "green",
                icon: <Check size={16} />,
                autoClose: 4000,
              }
        );
      }

      setSubmitSuccess(true);
      setTimeout(() => router.push("/drafts"), 1500);
    } catch (err) {
      const message = (err as Error).message;
      setSubmitError(message);
      notifications.show({
        title: "Something went wrong",
        message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
      setIsSubmitting(false);
    }
  }, [isEditPost, fbPostId, draft, actions, content, scheduled, scheduleDate, scheduleTime, router]);

  return {
    // Content
    content, setContent,
    linkUrl, setLinkUrl,
    // Schedule
    scheduled, setScheduled,
    scheduleDate, setScheduleDate,
    scheduleTime, setScheduleTime,
    // Media
    mediaFiles,
    fileInputRef,
    handleFiles,
    removeMedia,
    activeItem,
    sensors,
    handleDragStart,
    handleDragEnd,
    // Status
    isUploading,
    charsLeft,
    isOverLimit,
    canAct,
    isSubmitting,
    isSaving,
    submitError,
    submitSuccess,
    confirmOpen, setConfirmOpen,
    // Actions
    handleSaveDraft,
    handleConfirmedSubmit,
  };
}