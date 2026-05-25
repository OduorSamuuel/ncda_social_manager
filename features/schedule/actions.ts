import { extractImages, getEnv } from "@/utils/helpers";
import { BASE } from "@/utils/constants";
import { ScheduledPost } from "./types";

export async function publishNow(postId: string): Promise<void> {
  const { token } = getEnv();
  const res = await fetch(`${BASE}/${postId}`, {
    method: "POST",
    headers: { "Conten`t-Type": "application/json" },
    body: JSON.stringify({ is_published: true, access_token: token }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to publish post");
  }
}

export async function getScheduledPosts(): Promise<ScheduledPost[]> {
  const { token, pageId } = getEnv();

  const url = new URL(`${BASE}/${pageId}/scheduled_posts`);
  url.searchParams.set(
    "fields",
    "id,message,scheduled_publish_time,attachments{media_type,type,media{image{src}},subattachments{media{image{src}},type,url}}"
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("limit", "50");

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to fetch scheduled posts");
  }

  return ((await res.json()).data ?? []).map((p: any): ScheduledPost => {
    const attachment = p.attachments?.data?.[0];
    const mediaUrls = extractImages(attachment);
    let mediaType: ScheduledPost["mediaType"] = "text";
    if (attachment?.type === "album" || attachment?.type === "photo") mediaType = "photo";
    else if (attachment?.type === "video_inline" || attachment?.type === "video") mediaType = "video";

    return {
      id: p.id,
      content: p.message ?? "(No text)",
      scheduledFor: new Date(p.scheduled_publish_time * 1000).toISOString(),
      mediaType,
      mediaUrl: mediaUrls[0],
      mediaUrls,
    };
  });
}
export async function cancelScheduledPost(postId: string): Promise<void> {
  const { token } = getEnv();
  const res = await fetch(`${BASE}/${postId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: token }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to cancel post");
  }
}
export async function reschedulePost(
  postId: string,
  newUnixTime: number
): Promise<void> {
  const { token } = getEnv();
  const res = await fetch(`${BASE}/${postId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scheduled_publish_time: newUnixTime,
      published: false,
      access_token: token,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Failed to reschedule post");
  }
}
