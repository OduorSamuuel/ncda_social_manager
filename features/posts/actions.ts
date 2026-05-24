"use server";
import { BASE, PAGE_SIZE } from "@/utils/constants";
import { getEnv, mapToPost } from "@/utils/helpers";
import { FacebookPost, FacebookPostsResponse, Post, PostsPage } from "./types";



export async function getFacebookPosts(cursor?: string): Promise<PostsPage> {

  const { token, pageId } = getEnv();

  const url = new URL(`${BASE}/${pageId}/posts`);
  url.searchParams.set(
    "fields",
    "id,message,created_time,attachments{media_type,type,media{image{src}},subattachments{media{image{src}},type,url},url},likes.summary(true),comments.summary(true),shares"
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", String(PAGE_SIZE));
  if (cursor) url.searchParams.set("after", cursor);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });

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
}

export async function getFacebookPostById(id: string): Promise<Post> {
  const { token } = getEnv();

  const url = new URL(`${BASE}/${id}`);
  url.searchParams.set(
    "fields",
    "id,message,created_time,attachments{media_type,type,media{image{src}},subattachments{media{image{src}},type,url},url},likes.summary(true),comments.summary(true),shares"
  );
  url.searchParams.set("access_token", token);

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to fetch post");
  }

  const p: FacebookPost = await res.json();
  return mapToPost(p);
}
export async function updateFacebookPost(
  id: string,
  message: string
): Promise<{ success: boolean }> {
  const { token } = getEnv();

  const res = await fetch(`${BASE}/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to update post");
  }

  return { success: true };
}
