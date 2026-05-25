
import { InsightValue, PageInsight } from "@/features/analytics/types";
import { FacebookAttachment, FacebookPost, FacebookPostsResponse, Post } from "@/features/posts/types";

export function getEnv() {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  
  if (!token || !pageId) {
    throw new Error("Missing FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_PAGE_ID env vars.");
  }
  
  return { token, pageId };
}
export function findMetric(insights: PageInsight[], name: string): InsightValue[] {
  return insights.find((i) => i.name === name)?.values ?? [];
}
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function deriveMediaType(post: FacebookPostsResponse["data"][number]): Post["mediaType"] {
  const attachment = post.attachments?.data?.[0];
  const type = attachment?.type ?? "";
  const mediaType = attachment?.media_type ?? "";

  if (type === "album" || type === "photo") return "photo";
  if (type === "video_inline" || type === "video") return "video";
  if (mediaType === "photo" || mediaType === "image") return "photo";
  if (mediaType === "video") return "video";
  if (attachment?.media?.image?.src) return "photo";
  return "text";
}

export function extractImages(attachment: FacebookAttachment | undefined): string[] {
  if (!attachment) return [];
  if (attachment.type === "album" && attachment.subattachments?.data?.length) {
    return attachment.subattachments.data
      .map((s) => s.media?.image?.src)
      .filter(Boolean) as string[];
  }
  if (attachment.media?.image?.src) return [attachment.media.image.src];
  return [];
}

export function mapToPost(p: FacebookPost): Post {
  const attachment = p.attachments?.data?.[0];
  const mediaUrls = extractImages(attachment);
  return {
    id: p.id,
    content: p.message ?? "(No text)",
    status: "published",
    mediaType: deriveMediaType(p as any),
    mediaUrl: mediaUrls[0],
    mediaUrls,
    publishedAt: formatDate(p.created_time),
    stats: {
      likes: p.likes?.summary.total_count ?? 0,
      comments: p.comments?.summary.total_count ?? 0,
      shares: p.shares?.count ?? 0,
      reach: 0,
    },
  };
}
