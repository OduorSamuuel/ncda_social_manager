import { unstable_cache } from 'next/cache';
import { BASE, PAGE_SIZE } from "@/utils/constants";
import { getEnv, mapToPost } from "@/utils/helpers";
import { FacebookPost, FacebookPostsResponse, Post, PostsPage } from "./types";

export const getFacebookPosts = unstable_cache(
  async (cursor?: string): Promise<PostsPage> => {
    const { token, pageId } = getEnv();

    const url = new URL(`${BASE}/${pageId}/posts`);
    url.searchParams.set("fields", "id,message,created_time,attachments{media_type,type,media{image{src}},subattachments{media{image{src}},type,url},url},likes.summary(true),comments.summary(true),shares");
    url.searchParams.set("access_token", token);
    url.searchParams.set("limit", String(PAGE_SIZE));
    if (cursor) url.searchParams.set("after", cursor);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Facebook API error: ${err?.error?.message ?? res.statusText}`);
    }

    const json: FacebookPostsResponse = await res.json();
    return {
      posts: (json.data ?? []).map(mapToPost),
      nextCursor: json.paging?.cursors?.after ?? null,
      previousCursor: json.paging?.cursors?.before ?? null,
    };
  },
  ['facebook-posts'],
  { revalidate: 300 }
);

export const getFacebookPostById = unstable_cache(
  async (id: string): Promise<Post> => {
    const { token } = getEnv();

    const url = new URL(`${BASE}/${id}`);
    url.searchParams.set("fields", "id,message,created_time,attachments{media_type,type,media{image{src}},subattachments{media{image{src}},type,url},url},likes.summary(true),comments.summary(true),shares");
    url.searchParams.set("access_token", token);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message ?? "Failed to fetch post");
    }

    const p: FacebookPost = await res.json();
    return mapToPost(p);
  },
  ['facebook-post-by-id'],
  { revalidate: 60 }
);