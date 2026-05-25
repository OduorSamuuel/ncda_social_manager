"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PenLine,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { notifications } from "@mantine/notifications";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DraftRow } from "./types";
import { deleteDraft } from "./actions";


const STATUS_STYLES: Record<DraftRow["status"], string> = {
  pending:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  published: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const STATUS_ICONS: Record<DraftRow["status"], React.ReactNode> = {
  pending:   <Clock size={12} />,
  approved:  <CheckCircle2 size={12} />,
  rejected:  <AlertCircle size={12} />,
  published: <CheckCircle2 size={12} />,
};

interface Props {
  initialDrafts: DraftRow[];
}

export default function UserDraftList({ initialDrafts }: Props) {
  const [drafts, setDrafts] = useState(initialDrafts);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteDraft(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      notifications.show({
        title: "Draft deleted",
        message: "The draft has been removed.",
        color: "green",
        icon: <Check size={16} />,
        autoClose: 4000,
      });
    } catch (err) {
      notifications.show({
        title: "Failed to delete",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My drafts</h1>
        <Button size="sm" asChild>
          <Link href="/posts/new">+ New post</Link>
        </Button>
      </div>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PenLine size={32} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No drafts yet.</p>
          <Button asChild size="sm">
            <Link href="/posts/new">Create your first post</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Link
              key={draft.id}
              href={`/drafts/${draft.id}`}
              className="block group"
            >
              <div className="bg-background rounded-xl border border-border p-4 space-y-2 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                {/* Status + date */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
                    STATUS_STYLES[draft.status]
                  )}>
                    {STATUS_ICONS[draft.status]}
                    {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(draft.updated_at).toLocaleString()}
                  </span>
                </div>

                {/* Content preview */}
                <p className="text-sm text-foreground line-clamp-3 leading-relaxed whitespace-pre-wrap">
                  {draft.content}
                </p>

                {/* Rejection feedback */}
                {draft.status === "rejected" && draft.rejection_note && (
                  <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50/60 dark:bg-orange-900/20 px-3 py-2 text-[11px] text-orange-700 dark:text-orange-400">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>{draft.rejection_note}</span>
                  </div>
                )}

                {/* Actions */}
                {(draft.status === "pending" || draft.status === "rejected") && (
                  <div
                    className="flex items-center gap-2 pt-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/drafts/${draft.id}`;
                      }}
                    >
                      <PenLine size={13} /> Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive ml-auto"
                      disabled={deleting === draft.id}
                      onClick={(e) => handleDelete(e, draft.id)}
                    >
                      {deleting === draft.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      Delete
                    </Button>
                  </div>
                )}

                {draft.status === "published" && draft.fb_post_id && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CheckCircle2 size={12} className="text-green-500" />
                    Published to Facebook
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}