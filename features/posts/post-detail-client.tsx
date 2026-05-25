"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Heart, MessageCircle, Share2, Eye,
  Edit, Copy, Trash2, ChevronLeft, ChevronRight,
  X, ZoomIn, ExternalLink, AlertCircle, MoreHorizontal,
  Calendar, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Post } from "./types";


interface Props {
  post: Post | null;
  error: string | null;
}

const statusConfig = {
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  scheduled: { label: "Scheduled", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
};

function formatStat(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Lightbox ─
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
          {index + 1} / {images.length}
        </span>
      )}

      {/* Prev */}
      {images.length > 1 && (
        <button
          className="absolute left-4 text-white/70 hover:text-white transition-colors p-2"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        referrerPolicy="no-referrer"
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          className="absolute right-4 text-white/70 hover:text-white transition-colors p-2"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Dot strip */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === index ? "bg-white" : "bg-white/30"
              )}
              onClick={(e) => { e.stopPropagation(); }}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Gallery grid ─────────────────────────────────────────────────────────────
function GalleryGrid({
  images,
  onOpen,
}: {
  images: string[];
  onOpen: (i: number) => void;
}) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div
        className="relative w-full rounded-xl overflow-hidden cursor-zoom-in group"
        style={{ maxHeight: 480 }}
        onClick={() => onOpen(0)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt="Post photo"
          referrerPolicy="no-referrer"
          className="w-full object-cover"
          style={{ maxHeight: 480 }}
        />
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

  // 3+: one large left, stacked right
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

  // 4–5+
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden" style={{ height: 400 }}>
      {/* Top row: 2 images */}
      {shown.slice(0, 2).map((src, i) => (
        <div key={i} className="relative cursor-zoom-in group" style={{ height: 200 }} onClick={() => onOpen(i)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={`Photo ${i + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </div>
      ))}
      {/* Bottom row: up to 3 images */}
      <div className="col-span-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(shown.length - 2, 3)}, 1fr)`, height: 196 }}>
        {shown.slice(2).map((src, i) => {
          const isLast = i === shown.slice(2).length - 1 && overflow > 0;
          return (
            <div key={i} className="relative cursor-zoom-in group" onClick={() => onOpen(i + 2)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 3}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              {isLast ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold text-xl">
                  +{overflow}
                </div>
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
export default function PostDetailClient({ post, error }: Props) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (error || !post) {
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
            <span>{error ?? "Post not found."}</span>
          </div>
        </div>
      </div>
    );
  }

  const images =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrl
      ? [post.mediaUrl]
      : [];

  const { label, className: statusClass } = statusConfig[post.status];

  const dateLabel =
    post.status === "published"
      ? post.publishedAt
      : post.status === "scheduled"
      ? post.scheduledFor
      : "Draft";

  const prev = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : 0));
  const next = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : 0));

  return (
    <>
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={prev}
          onNext={next}
        />
      )}

      <div className="flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-border bg-background shrink-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 -ml-2">
            <ArrowLeft size={15} /> Back
          </Button>
          <span className="text-sm font-semibold text-foreground flex-1 truncate">Post detail</span>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <Copy size={13} /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/posts/${post.id}/edit`)}>
              <Edit size={13} /> Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hidden sm:flex">
              <Trash2 size={13} /> Delete
            </Button>
            {/* Mobile overflow */}
            <Button variant="ghost" size="sm" className="sm:hidden">
              <MoreHorizontal size={15} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

            {/* ── Meta row ── */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Page avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="text-primary w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">My Business Page</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar size={11} />
                  <span>{dateLabel}</span>
                </div>
              </div>
              <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", statusClass)}>
                {label}
              </span>
            </div>

            {/* ── Content ── */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>

            {/* ── Gallery ── */}
            {post.mediaType === "photo" && images.length > 0 && (
              <GalleryGrid images={images} onOpen={(i) => setLightboxIndex(i)} />
            )}

            {/* ── Stats ── */}
            {post.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Heart,         label: "Likes",    value: post.stats.likes },
                  { icon: MessageCircle, label: "Comments", value: post.stats.comments },
                  { icon: Share2,        label: "Shares",   value: post.stats.shares },
                  { icon: Eye,           label: "Reach",    value: post.stats.reach },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/40 py-4"
                  >
                    <Icon size={16} className="text-muted-foreground" />
                    <span className="text-xl font-bold text-foreground">{formatStat(value)}</span>
                    <span className="text-[11px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Post ID / external link ── */}
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 bg-muted/30">
              <div>
                <p className="text-[11px] text-muted-foreground mb-0.5">Post ID</p>
                <p className="text-xs font-mono text-foreground truncate max-w-[220px]">{post.id}</p>
              </div>
              <a
                href={`https://www.facebook.com/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
              >
                View on Facebook <ExternalLink size={12} />
              </a>
            </div>

            {/* ── Comments placeholder ── */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3">
                Comments
                {post.stats?.comments ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({post.stats.comments})
                  </span>
                ) : null}
              </h2>

              {post.stats?.comments === 0 || !post.stats ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-border text-center">
                  <MessageCircle size={20} className="text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No comments yet</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border">
                  {/* Comments are fetched separately — wire up getFacebookPostComments here */}
                  <div className="px-4 py-3 text-xs text-muted-foreground italic">
                    Connect <code className="font-mono">getFacebookPostComments(post.id)</code> to load comments.
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}