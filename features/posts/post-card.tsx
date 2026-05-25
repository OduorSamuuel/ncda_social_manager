"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Share2, Eye, Edit, Copy, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Post } from "./types";


const statusConfig = {
  published: { label: "Published", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  scheduled: { label: "Scheduled", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
};

function formatStat(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

interface PostCardProps {
  post: Post;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, onDuplicate, onDelete }: PostCardProps) {
  const { label, className } = statusConfig[post.status];
  const [imgIndex, setImgIndex] = useState(0);
  const router = useRouter();

  const dateLabel =
    post.status === "published"
      ? post.publishedAt
      : post.status === "scheduled"
      ? post.scheduledFor
      : "Draft";

  const images =
    post.mediaUrls && post.mediaUrls.length > 0
      ? post.mediaUrls
      : post.mediaUrl
      ? [post.mediaUrl]
      : [];

  const hasImages = post.mediaType === "photo" && images.length > 0;
  const isAlbum = images.length > 1;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => (i + 1) % images.length);
  };

  const href = `/posts/${encodeURIComponent(post.id)}`;
  const editHref = `/posts/${encodeURIComponent(post.id)}/edit`;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  
    router.push(editHref);
  };

  return (
    <Link
      href={href}
      className="flex flex-col bg-background rounded-xl border border-border overflow-hidden hover:shadow-md hover:border-border/80 transition-shadow cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative h-40 flex items-center justify-center bg-muted overflow-hidden">
        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imgIndex]}
              alt="Post media"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
            {isAlbum && (
              <>
                <button onClick={prev} className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors" aria-label="Previous image">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={next} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 transition-colors" aria-label="Next image">
                  <ChevronRight size={14} />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                      className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imgIndex ? "bg-white" : "bg-white/50")}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
                <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {imgIndex + 1}/{images.length}
                </span>
              </>
            )}
          </>
        ) : post.mediaType === "video" ? (
          <svg className="text-amber-400 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        ) : (
          <svg className="text-muted-foreground/40 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        )}
        <span className={cn("absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full", className)}>
          {label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        <div className="flex items-center gap-1.5">
          <svg className="text-primary w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="text-[11px] font-medium text-primary truncate">My Business Page</span>
          <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{dateLabel}</span>
        </div>

        <p className="text-xs text-foreground leading-relaxed line-clamp-2 flex-1">{post.content}</p>

        {post.stats ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Heart size={11} /> {formatStat(post.stats.likes)}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MessageCircle size={11} /> {formatStat(post.stats.comments)}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Share2 size={11} /> {formatStat(post.stats.shares)}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto"><Eye size={11} /> {formatStat(post.stats.reach)}</span>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">Not yet published</p>
        )}

        {/* Action buttons — stopPropagation so they don't trigger the Link */}
        <div
          className="flex gap-1.5 pt-1 border-t border-border"
          onClick={(e) => e.preventDefault()}
        >
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-[11px] gap-1"
            onClick={handleEdit}
          >
            <Edit size={11} /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-[11px] gap-1"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDuplicate?.(post.id); }}
          >
            <Copy size={11} /> Duplicate
          </Button>
        </div>
      </div>
    </Link>
  );
}