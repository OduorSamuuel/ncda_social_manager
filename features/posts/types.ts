export type FacebookMediaType = "photo" | "video" | "text";
export type PostStatus = "published" | "scheduled" | "draft";
export interface Post {
  id: string;
  content: string;
  status: PostStatus;
  mediaType: FacebookMediaType;
  publishedAt?: string;
  scheduledFor?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  stats?: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
  };
}
export interface FacebookPostsResponse {
  data: FacebookPost[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}
export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  attachments?: { data: FacebookAttachment[] };
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
}
export interface FacebookAttachment {
  media_type?: string;
  type: string;
  media?: {
    image?: { src: string; width: number; height: number };
  };
  subattachments?: {
    data: Array<{
      media: { image: { src: string; width: number; height: number } };
      type: string;
      url: string;
      target?: { id: string; url: string };
    }>;
  };
  title?: string;
  url?: string;
  target?: { id: string; url: string };
}
export interface PostsPage {
  posts: Post[];
  nextCursor: string | null;
  previousCursor: string | null;
}
