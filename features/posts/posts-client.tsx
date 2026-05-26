"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

import { cn } from "@/lib/utils";
import { Post, PostStatus } from "./types";
import { PostCard } from "./post-card";
import { Role } from "../user/actions";

const FILTERS: { label: string; value: PostStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Published", value: "published" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Drafts", value: "draft" },
];

interface Props {
  initialPosts: Post[];
  error: string | null;
  currentPage: number;
  nextCursor: string | null;
  previousCursor: string | null;
  role:Role
}

export default function PostsClient({
  initialPosts,
  error,
  currentPage,
  nextCursor,
  previousCursor,
  role,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = initialPosts.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter;
    const matchesSearch = p.content.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const buildHref = (page: number, cursor: string) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("cursor", cursor);
    return `?${params.toString()}`;
  };

  const prevHref =
    currentPage === 2
      ? "?"
      : previousCursor
      ? buildHref(currentPage - 1, previousCursor)
      : null;

  const nextHref = nextCursor ? buildHref(currentPage + 1, nextCursor) : null;

  const showPagination = currentPage > 1 || !!nextCursor;

  return (
    <div className="px-4 md:px-6 py-5 space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter + search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                filter === value
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-52">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search posts…"
            className="pl-7 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              role={role}
              //onEdit={(id) => console.log("edit", id)}
              onDuplicate={(id) => console.log("dup", id)}
              onDelete={(id) => console.log("del", id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-foreground mb-1">No posts found</p>
          <p className="text-xs text-muted-foreground mb-4">
            {search
              ? "Try a different search term."
              : "Create your first post to get started."}
          </p>
          <Button size="sm" asChild>
            <Link href="/posts/create">Create post</Link>
          </Button>
        </div>
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="border-t border-border pt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={prevHref ?? "#"}
                  aria-disabled={!prevHref}
                  className={cn(!prevHref && "pointer-events-none opacity-50")}
                />
              </PaginationItem>

              <PaginationItem>
                <PaginationLink href="#" isActive>
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {nextHref && (
                <PaginationItem>
                  <PaginationLink href={nextHref}>
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  href={nextHref ?? "#"}
                  aria-disabled={!nextHref}
                  className={cn(!nextHref && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}