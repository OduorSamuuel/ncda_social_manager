"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  AlertCircle,
  ImageIcon,
  Link2,
  PenLine,
  Check,
  X,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DraftRow } from "./types";
import { publishDraft, rejectDraft } from "./actions";


const STATUS_STYLES: Record<DraftRow["status"], string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  published: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

interface DraftCardProps {
  draft: DraftRow;
  onPublished: (id: string) => void;
  onRejected: (id: string) => void;
}

function DraftCard({ draft, onPublished, onRejected }: DraftCardProps) {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const handlePublish = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPublishing(true);
    try {
      const { fbPostId } = await publishDraft(draft.id);
      notifications.show({
        title: "Published to Facebook",
        message: `Post ID: ${fbPostId}`,
        color: "green",
        icon: <Check size={16} />,
        autoClose: 4000,
      });
      onPublished(draft.id);
    } catch (err) {
      notifications.show({
        title: "Publish failed",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      await rejectDraft(draft.id, rejectNote || undefined);
      notifications.show({
        title: "Draft returned",
        message: "The contributor has been notified.",
        color: "yellow",
        icon: <XCircle size={16} />,
        autoClose: 4000,
      });
      onRejected(draft.id);
      setRejectOpen(false);
      setRejectNote("");
    } catch (err) {
      notifications.show({
        title: "Failed to return draft",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setRejecting(false);
    }
  };

  const openReject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRejectOpen(true);
  };

  return (
    <>
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return draft to contributor?</AlertDialogTitle>
            <AlertDialogDescription>
              Optionally add feedback so they know what to change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="e.g. Please adjust the tone and add a call-to-action…"
            className="mt-2 text-sm"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive hover:bg-destructive/90"
              disabled={rejecting}
            >
              {rejecting ? <Loader2 size={13} className="animate-spin mr-1.5" /> : null}
              Return draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Link href={`/drafts/${draft.id}`} className="block group">
        <div className="bg-background rounded-xl border border-border p-4 space-y-3 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  STATUS_STYLES[draft.status]
                )}>
                  <span className="w-1 h-1 rounded-full bg-current" />
                  {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                </span>
                {draft.author_name && (
                  <span className="text-[11px] text-muted-foreground">
                    by {draft.author_name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {new Date(draft.created_at).toLocaleString()}
              </p>
            </div>

            {/* Meta icons */}
            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
              {draft.media_paths.length > 0 && (
                <span className="flex items-center gap-1 text-[11px]">
                  <ImageIcon size={12} /> {draft.media_paths.length}
                </span>
              )}
              {draft.link_url && <Link2 size={12} />}
              {draft.scheduled_for && (
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock size={12} />
                  {new Date(draft.scheduled_for).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Content preview */}
          <p className="text-sm text-foreground leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {draft.content}
          </p>

          {/* Rejection note */}
          {draft.rejection_note && (
            <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50/60 dark:bg-orange-900/20 px-3 py-2 text-[11px] text-orange-700 dark:text-orange-400">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              <span>{draft.rejection_note}</span>
            </div>
          )}

          {/* Actions */}
          {draft.status === "pending" && (
            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.preventDefault()}>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={publishing}
                onClick={handlePublish}
              >
                {publishing ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
                Publish now
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/drafts/${draft.id}`);
                }}
              >
                <PenLine size={13} /> Review & edit
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                onClick={openReject}
              >
                <XCircle size={13} /> Return
              </Button>
            </div>
          )}

          {draft.status === "published" && draft.fb_post_id && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CheckCircle2 size={12} className="text-green-500" />
              Published · FB ID: {draft.fb_post_id}
            </div>
          )}
        </div>
      </Link>
    </>
  );
}

// ─── Queue page ───────────────────────────────────────────────────────────────

interface Props {
  initialDrafts: DraftRow[];
}

export default function AdminDraftQueue({ initialDrafts }: Props) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [filter, setFilter] = useState<DraftRow["status"] | "all">("pending");

  const handlePublished = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "published" as const } : d))
    );
  };

  const handleRejected = (id: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "rejected" as const } : d))
    );
  };

  const filtered =
    filter === "all" ? drafts : drafts.filter((d) => d.status === filter);

  const counts = {
    all: drafts.length,
    pending: drafts.filter((d) => d.status === "pending").length,
    published: drafts.filter((d) => d.status === "published").length,
    rejected: drafts.filter((d) => d.status === "rejected").length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Draft queue</h1>
        <Button size="sm" asChild>
          <Link href="/posts/new">+ New post</Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg w-fit">
        {(["all", "pending", "published", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
              filter === s
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s] > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5">
                {counts[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle2 size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "pending" ? "No drafts waiting for review." : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onPublished={handlePublished}
              onRejected={handleRejected}
            />
          ))}
        </div>
      )}
    </div>
  );
}