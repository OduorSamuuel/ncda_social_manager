"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  Edit,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ExternalLink,
  AlertCircle,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Loader2,
  Image as ImageIcon,
  Check,
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
import { cn } from "@/lib/utils";
import { DraftRow } from "./types";
import { deleteDraft, getSignedUrl, publishDraft } from "./actions";
import { Role } from "../user/types";

interface Props {
  draft: DraftRow | null;
  error: string | null;
  role: Role;
}

interface MediaItem {
  storagePath: string;
  signedUrl: string;
  loading: boolean;
  error?: string;
}

const statusConfig = {
  pending:   { label: "Pending Review", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  approved:  { label: "Approved",       className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected:  { label: "Rejected",       className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  published: { label: "Published",      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  images, index, onClose, onPrev, onNext,
}: {
  images: string[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
        <X size={24} />
      </button>

      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {images.length}
        </span>
      )}

      {images.length > 1 && (
        <button className="absolute left-4 text-white/70 hover:text-white transition-colors p-2" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">
          <ChevronLeft size={32} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`Photo ${index + 1}`} referrerPolicy="no-referrer" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />

      {images.length > 1 && (
        <button className="absolute right-4 text-white/70 hover:text-white transition-colors p-2" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next">
          <ChevronRight size={32} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === index ? "bg-white" : "bg-white/30")} onClick={(e) => { e.stopPropagation(); }} aria-label={`Go to image ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gallery grid ─────────────────────────────────────────────────────────────
function GalleryGrid({ mediaItems, onOpen, isLoading }: { mediaItems: MediaItem[]; onOpen: (i: number) => void; isLoading: boolean; }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 rounded-xl border border-border bg-muted/20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const images = mediaItems.filter(m => !m.error).map(m => m.signedUrl);
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden cursor-zoom-in group" style={{ maxHeight: 480 }} onClick={() => onOpen(0)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="Post photo" referrerPolicy="no-referrer" className="w-full object-cover" style={{ maxHeight: 480 }} />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <ZoomIn size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
        </div>
      </div>
    );
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
        {images.map((src, i) => (
          <div key={i} className="relative aspect-square cursor-zoom-in group" onClick={() => onOpen(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${i + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>
    );
  }

  const MAX_SHOW = 5;
  const shown = images.slice(0, MAX_SHOW);
  const overflow = images.length - MAX_SHOW;

  if (images.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ height: 360 }}>
        <div className="relative cursor-zoom-in group row-span-2" onClick={() => onOpen(0)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="Photo 1" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
        {images.slice(1, 3).map((src, i) => (
          <div key={i} className="relative cursor-zoom-in group" onClick={() => onOpen(i + 1)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Photo ${i + 2}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ height: 400 }}>
      {shown.slice(0, 2).map((src, i) => (
        <div key={i} className="relative cursor-zoom-in group" style={{ height: 200 }} onClick={() => onOpen(i)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Photo ${i + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
      ))}
      <div className="col-span-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(shown.length - 2, 3)}, 1fr)`, height: 196 }}>
        {shown.slice(2).map((src, i) => {
          const isLast = i === shown.slice(2).length - 1 && overflow > 0;
          return (
            <div key={i} className="relative cursor-zoom-in group" onClick={() => onOpen(i + 2)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 3}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              {isLast ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-xl">+{overflow}</div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DraftDetailClient({ draft, error, role }: Props) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(true);

  useEffect(() => {
    async function loadMediaUrls() {
      if (!draft?.media_paths?.length) { setLoadingMedia(false); return; }
      setLoadingMedia(true);
      const items: MediaItem[] = [];
      for (const path of draft.media_paths) {
        try {
          const { url } = await getSignedUrl(path);
          items.push({ storagePath: path, signedUrl: url, loading: false });
        } catch (err) {
          items.push({ storagePath: path, signedUrl: "", loading: false, error: (err as Error).message });
        }
      }
      setMediaItems(items);
      setLoadingMedia(false);
    }
    loadMediaUrls();
  }, [draft]);

  if (error || !draft) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border bg-background shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2">
            <ArrowLeft size={15} /> Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle size={16} />
            <span>{error ?? "Draft not found."}</span>
          </div>
        </div>
      </div>
    );
  }

  const validImages = mediaItems.filter(m => !m.error).map(m => m.signedUrl);
  const { label, className: statusClass } = statusConfig[draft.status];

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishDraft(draft.id, { content: draft.content });
      notifications.show({
        title: "Draft published",
        message: "Your post is now live on Facebook.",
        color: "green",
        icon: <Check size={16} />,
        autoClose: 4000,
      });
      router.push("/drafts");
      router.refresh();
    } catch (err) {
      notifications.show({
        title: "Failed to publish",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setIsPublishing(false);
      setPublishDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDraft(draft.id);
      notifications.show({
        title: "Draft deleted",
        message: "The draft has been permanently removed.",
        color: "green",
        icon: <Check size={16} />,
        autoClose: 4000,
      });
      router.push("/drafts");
      router.refresh();
    } catch (err) {
      notifications.show({
        title: "Failed to delete draft",
        message: (err as Error).message,
        color: "red",
        icon: <X size={16} />,
        autoClose: 6000,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleDuplicate = () => {
    sessionStorage.setItem("duplicateDraft", JSON.stringify({
      content: draft.content,
      mediaPaths: draft.media_paths,
      linkUrl: draft.link_url,
    }));
    router.push("/drafts/create");
  };

  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + validImages.length) % validImages.length : 0));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % validImages.length : 0));

  const canPublish = draft.status === "approved" || draft.status === "pending";
  const canEdit = draft.status !== "published";

  return (
    <>
      {lightboxIndex !== null && validImages.length > 0 && (
        <Lightbox images={validImages} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onPrev={prev} onNext={next} />
      )}

      {/* Publish dialog */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This draft will be published to your Facebook page immediately.
              {draft.status === "pending" && " It has been approved and is ready to publish."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The draft and all associated media will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border bg-background shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2">
            <ArrowLeft size={15} /> Back
          </Button>
          <span className="text-sm font-semibold text-foreground flex-1 truncate">Draft detail</span>
          <div className="flex items-center gap-1.5">
         
            {canEdit && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/drafts/${draft.id}/edit`)}>
                <Edit size={13} /> Edit
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hidden sm:flex" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 size={13} /> Delete
            </Button>
          {canPublish && role === "admin" && (
  <Button size="sm" className="gap-1.5" onClick={() => setPublishDialogOpen(true)}>
    <Send size={13} /> Publish
  </Button>
)}
            <Button variant="ghost" size="sm" className="sm:hidden">
              <MoreHorizontal size={15} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="text-primary w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">My Business Page</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar size={11} />
                  <span>Created {new Date(draft.created_at).toLocaleDateString()}</span>
                  {draft.updated_at !== draft.created_at && (
                    <><Clock size={11} /><span>Updated {new Date(draft.updated_at).toLocaleDateString()}</span></>
                  )}
                </div>
              </div>
              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusClass)}>
                {label}
              </span>
            </div>

            {/* Rejection note */}
            {draft.status === "rejected" && draft.rejection_note && (
              <div className="flex items-start gap-2 rounded-lg border border-red-300/50 bg-red-50/60 dark:bg-red-900/20 dark:border-red-700/40 px-4 py-3 text-xs text-red-800 dark:text-red-300">
                <XCircle size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-0.5">Rejection reason</p>
                  <p>{draft.rejection_note}</p>
                </div>
              </div>
            )}

            {/* Approval note */}
            {draft.status === "approved" && (
              <div className="flex items-start gap-2 rounded-lg border border-green-300/50 bg-green-50/60 dark:bg-green-900/20 dark:border-green-700/40 px-4 py-3 text-xs text-green-800 dark:text-green-300">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-0.5">Approved</p>
                  <p>This draft has been approved and is ready to publish.</p>
                </div>
              </div>
            )}

            {/* Content */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{draft.content}</p>

            {/* Gallery */}
            {draft.media_paths && draft.media_paths.length > 0 && (
              <GalleryGrid mediaItems={mediaItems} onOpen={(i) => setLightboxIndex(i)} isLoading={loadingMedia} />
            )}

            {/* Link */}
            {draft.link_url && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[11px] text-muted-foreground mb-1.5">Attached link</p>
                <a href={draft.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all flex items-center gap-1">
                  {draft.link_url} <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-lg border border-border px-4 py-3 bg-muted/30 space-y-2">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Draft ID</p>
                <p className="text-xs font-mono text-foreground">{draft.id}</p>
              </div>
              {draft.author_name && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Created by</p>
                  <p className="text-xs text-foreground">{draft.author_name}</p>
                </div>
              )}
              {draft.scheduled_for && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-0.5">Scheduled for</p>
                  <p className="text-xs text-foreground">{new Date(draft.scheduled_for).toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Media load errors */}
            {mediaItems.some(m => m.error) && (
              <div className="rounded-lg border border-yellow-300/50 bg-yellow-50/60 dark:bg-yellow-900/20 dark:border-yellow-700/40 px-4 py-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle size={14} />
                  Some images failed to load. They may have been deleted or moved.
                </p>
              </div>
            )}

            {/* Workflow info */}
            <div className="rounded-lg border border-border p-4 bg-muted/20">
              <h2 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <AlertCircle size={12} className="text-muted-foreground" /> Draft workflow
              </h2>
              <div className="text-[11px] text-muted-foreground">
                {draft.status === "pending"   && <p>This draft is waiting for admin review. You'll be notified once it's approved or rejected.</p>}
                {draft.status === "approved"  && <p>This draft has been approved! Click "Publish" to share it to your Facebook page.</p>}
                {draft.status === "rejected"  && <p>This draft was rejected. Please review the feedback above and make necessary changes.</p>}
                {draft.status === "published" && <p>This draft has been published to Facebook. You can view the live post in your published posts.</p>}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}