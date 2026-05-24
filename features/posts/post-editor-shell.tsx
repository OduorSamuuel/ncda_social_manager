"use client";

import Link from "next/link";
import {
  ArrowLeft, ImagePlus, Link2, CalendarClock, ThumbsUp,
  MessageSquare, Share2, Globe, Send, X, Loader2,
  AlertCircle, CheckCircle2, GripVertical, Clock,
} from "lucide-react";
import {
  DndContext, closestCenter, DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { MediaFile } from "@/hooks/use-post-editor";
import { PostEditorConfig } from "@/lib/config";
import { DraftRow } from "../drafts/types";



// ─── Sortable item 
function SortableMediaItem({
  item, index, isFirst, onRemove,
}: {
  item: MediaFile; index: number; isFirst: boolean; onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.previewUrl} alt={`Media ${index + 1}`} className="w-full h-full object-cover" draggable={false} />

      {isFirst && (
        <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold bg-black/70 text-white px-1.5 py-0.5 rounded-full pointer-events-none">
          Cover
        </span>
      )}
      {item.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 size={16} className="text-white animate-spin" />
        </div>
      )}
      {item.error && (
        <div className="absolute inset-0 bg-destructive/60 flex flex-col items-center justify-center gap-1 p-2">
          <AlertCircle size={14} className="text-white" />
          <span className="text-[9px] text-white text-center leading-tight line-clamp-2">{item.error}</span>
        </div>
      )}
      {!item.uploading && !item.error && (
        <button
          className="absolute top-1 left-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder" {...attributes} {...listeners}
        >
          <GripVertical size={11} />
        </button>
      )}
      {!item.uploading && (
        <button
          onClick={() => onRemove(item.id)}
          className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function DragPreview({ item }: { item: MediaFile }) {
  return (
    <div className="w-24 aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-xl rotate-3 opacity-90">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" draggable={false} />
    </div>
  );
}

// ─── Shell props ──────────────────────────────────────────────────────────────

export interface PostEditorShellProps {
  config: PostEditorConfig;
  draft?: DraftRow | null;

  // Content
  content: string;
  onContentChange: (v: string) => void;
  linkUrl: string;
  onLinkUrlChange: (v: string) => void;
  charsLeft: number;
  isOverLimit: boolean;

  // Schedule
  scheduled: boolean;
  onScheduledChange: (v: boolean) => void;
  scheduleDate: string;
  onScheduleDateChange: (v: string) => void;
  scheduleTime: string;
  onScheduleTimeChange: (v: string) => void;

  // Media
  mediaFiles: MediaFile[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFiles: (files: FileList | null) => void;
  onRemoveMedia: (id: string) => void;
  activeItem?: MediaFile;
  dndSensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
  onDragStart: (e: import("@dnd-kit/core").DragStartEvent) => void;
  onDragEnd: (e: import("@dnd-kit/core").DragEndEvent) => void;

  // Status
  canAct: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  submitError: string | null;
  submitSuccess: boolean;
  confirmOpen: boolean;
  onConfirmOpenChange: (v: boolean) => void;

  // Handlers
  onSaveDraft: () => void;
  onConfirmedSubmit: () => void;
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function PostEditorShell({
  config,
  draft,
  content, onContentChange,
  linkUrl, onLinkUrlChange,
  charsLeft, isOverLimit,
  scheduled, onScheduledChange,
  scheduleDate, onScheduleDateChange,
  scheduleTime, onScheduleTimeChange,
  mediaFiles, fileInputRef, onFiles, onRemoveMedia,
  activeItem, dndSensors, onDragStart, onDragEnd,
  canAct, isSubmitting, isSaving, submitError, submitSuccess,
  confirmOpen, onConfirmOpenChange,
  onSaveDraft, onConfirmedSubmit,
}: PostEditorShellProps) {

  // Resolve the live primary label (reflects in-progress and success states)
  const resolvedPrimaryLabel = isSubmitting
    ? config.primaryLabelLoading
    : submitSuccess
    ? config.primaryLabelSuccess
    : config.primaryLabel;

  return (
    <>
      {/* ── Confirm dialog ─────────────────────────────────────────────────── */}
      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {config.confirmDescription(scheduleDate, scheduleTime)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmedSubmit}>
              {config.confirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-full">
        {/* ── Action bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 md:px-6 h-12 border-b border-border bg-background/60 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
            <Link href={config.backHref}>
              <ArrowLeft size={16} />
              <span className="sr-only">Back</span>
            </Link>
          </Button>

          <div className="flex-1" />

          {/* Save draft button — hidden on edit-post */}
          {!config.canPublish ? null : (
            // Admin: show "Update/Save draft" only when not editing a live post
            config.canEditMedia && (
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
                disabled={!canAct}
                onClick={onSaveDraft}
              >
                {isSaving && <Loader2 size={13} className="animate-spin mr-1.5" />}
                {config.saveDraftLabel}
              </Button>
            )
          )}

          {/* Non-admin always sees the save draft button */}
          {!config.canPublish && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              disabled={!canAct}
              onClick={onSaveDraft}
            >
              {isSaving && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {config.saveDraftLabel}
            </Button>
          )}

          {/* Primary CTA */}
          <Button
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={config.canPublish ? () => onConfirmOpenChange(true) : onSaveDraft}
            disabled={config.canPublish ? !canAct || submitSuccess : !canAct}
          >
            {isSubmitting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : submitSuccess ? (
              <CheckCircle2 size={13} />
            ) : config.canPublish ? (
              <Send size={13} />
            ) : (
              <Clock size={13} />
            )}
            {config.canPublish ? resolvedPrimaryLabel : isSaving ? "Saving…" : config.primaryLabel}
          </Button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">

            {/* Left column */}
            <div className="space-y-3">
              {/* Error banner */}
              {submitError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Rejection note */}
              {config.showRejectionNote && draft?.rejection_note && (
                <div className="flex items-start gap-2 rounded-lg border border-orange-300/50 bg-orange-50/60 dark:bg-orange-900/20 dark:border-orange-700/40 px-4 py-3 text-xs text-orange-800 dark:text-orange-300">
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-0.5">Returned with feedback</p>
                    <p>{draft.rejection_note}</p>
                  </div>
                </div>
              )}

              {/* Edit-post warning */}
              {config.editPostWarning && (
                <div className="flex items-center gap-2 rounded-lg border border-yellow-300/50 bg-yellow-50/60 dark:bg-yellow-900/20 dark:border-yellow-700/40 px-4 py-3 text-xs text-yellow-800 dark:text-yellow-300">
                  <AlertCircle size={13} className="shrink-0" />
                  {config.editPostWarning}
                </div>
              )}

              {/* Post content */}
              <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                <h2 className="text-xs font-medium text-foreground">Post content</h2>
                <Textarea
                  placeholder="What do you want to share with your audience?"
                  className="min-h-36 resize-none text-sm leading-relaxed bg-muted/40 border-border focus-visible:ring-primary/30"
                  value={content}
                  onChange={(e) => onContentChange(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Use emojis, links, and hashtags freely
                  </span>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      isOverLimit
                        ? "text-destructive font-medium"
                        : charsLeft < 200
                        ? "text-yellow-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {charsLeft.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Media */}
              {config.canEditMedia && (
                <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium text-foreground">Media</h2>
                    {mediaFiles.length > 1 && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <GripVertical size={11} /> Drag to reorder · first is cover
                      </span>
                    )}
                  </div>

                  {mediaFiles.length > 0 && (
                    <DndContext
                      sensors={dndSensors}
                      collisionDetection={closestCenter}
                      onDragStart={onDragStart}
                      onDragEnd={onDragEnd}
                    >
                      <SortableContext items={mediaFiles.map((m) => m.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {mediaFiles.map((mf, i) => (
                            <SortableMediaItem
                              key={mf.id}
                              item={mf}
                              index={i}
                              isFirst={i === 0}
                              onRemove={onRemoveMedia}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      <DragOverlay>
                        {activeItem ? <DragPreview item={activeItem} /> : null}
                      </DragOverlay>
                    </DndContext>
                  )}

                  <label
                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-muted/40 transition-colors"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                  >
                    <ImagePlus size={24} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground text-center">
                      Drag & drop or{" "}
                      <span className="text-primary font-medium">browse</span>{" "}
                      to upload
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      Photos stored securely until post is published
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => onFiles(e.target.files)}
                    />
                  </label>
                </div>
              )}

              {/* Link */}
              {config.canAttachLink && (
                <div className="bg-background rounded-xl border border-border p-4 space-y-2">
                  <h2 className="text-xs font-medium text-foreground">Attach link</h2>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3">
                    <Link2 size={14} className="text-muted-foreground shrink-0" />
                    <Input
                      type="url"
                      placeholder="https://yourwebsite.com/page"
                      className="border-0 bg-transparent px-0 text-sm focus-visible:ring-0 h-9"
                      value={linkUrl}
                      onChange={(e) => onLinkUrlChange(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Mobile buttons */}
              <div className="flex gap-2 sm:hidden">
                {!config.canPublish && (
                  <Button variant="outline" className="flex-1" disabled={!canAct} onClick={onSaveDraft}>
                    {isSaving && <Loader2 size={13} className="animate-spin mr-1.5" />}
                    {config.saveDraftLabel}
                  </Button>
                )}
                {config.canPublish && config.canEditMedia && (
                  <Button variant="outline" className="flex-1" disabled={!canAct} onClick={onSaveDraft}>
                    {isSaving && <Loader2 size={13} className="animate-spin mr-1.5" />}
                    {config.saveDraftLabel}
                  </Button>
                )}
                {config.canPublish && (
                  <Button
                    className="flex-1 gap-1.5 rounded-full"
                    disabled={!canAct || submitSuccess}
                    onClick={() => onConfirmOpenChange(true)}
                  >
                    {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {resolvedPrimaryLabel}
                  </Button>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="space-y-3">
              {/* Page info */}
              <div className="bg-background rounded-xl border border-border p-4 space-y-2">
                <h2 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <svg className="text-primary w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook page
                </h2>
                <div className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/40">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">MB</div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-foreground">My Business Page</p>
                    <p className="text-[11px] text-muted-foreground">
                      {config.canPublish ? "Connected · Admin" : "Posts require admin approval"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule — admin only, not on edit-post */}
              {config.canSchedule && (
                <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                  <h2 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-primary" /> Schedule
                  </h2>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule-toggle" className="text-xs text-muted-foreground cursor-pointer">
                      Schedule for later
                    </Label>
                    <Switch id="schedule-toggle" checked={scheduled} onCheckedChange={onScheduledChange} />
                  </div>
                  {scheduled && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Date</Label>
                        <Input type="date" className="h-8 text-xs" value={scheduleDate}
                          onChange={(e) => onScheduleDateChange(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Time</Label>
                        <Input type="time" className="h-8 text-xs" value={scheduleTime}
                          onChange={(e) => onScheduleTimeChange(e.target.value)} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Draft status */}
              {config.showDraftStatus && draft && (
                <div className="bg-background rounded-xl border border-border p-4 space-y-2">
                  <h2 className="text-xs font-medium text-foreground">Draft status</h2>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full",
                    draft.status === "pending" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                    draft.status === "rejected" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                    draft.status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                    draft.status === "published" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                  )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                  </div>
                  {draft.author_name && (
                    <p className="text-[11px] text-muted-foreground">by {draft.author_name}</p>
                  )}
                </div>
              )}

              {/* Live preview */}
              <div className="bg-background rounded-xl border border-border p-4 space-y-3">
                <h2 className="text-xs font-medium text-foreground">Preview</h2>
                <div className="rounded-lg bg-muted/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-[11px] font-semibold text-primary shrink-0">MB</div>
                    <div>
                      <p className="text-xs font-medium text-foreground leading-tight">My Business Page</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        Just now · <Globe size={9} />
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {content || (
                      <span className="text-muted-foreground italic">Your post will appear here…</span>
                    )}
                  </p>

                  {linkUrl && (
                    <div className="rounded border border-border bg-background p-2">
                      <p className="text-[10px] text-muted-foreground truncate">{linkUrl}</p>
                    </div>
                  )}

                  {mediaFiles.length > 0 ? (
                    <div className={cn(
                      "grid gap-1 rounded overflow-hidden",
                      mediaFiles.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {mediaFiles.slice(0, 4).map((mf, i) => (
                        <div key={mf.id} className="relative aspect-square bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mf.previewUrl} alt="" className="w-full h-full object-cover" />
                          {i === 3 && mediaFiles.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs font-semibold">
                              +{mediaFiles.length - 4}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded bg-muted h-16 flex items-center justify-center">
                      <ImagePlus size={16} className="text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-1 border-t border-border">
                    {[
                      { Icon: ThumbsUp, label: "Like" },
                      { Icon: MessageSquare, label: "Comment" },
                      { Icon: Share2, label: "Share" },
                    ].map(({ Icon, label }) => (
                      <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Icon size={11} /> {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}