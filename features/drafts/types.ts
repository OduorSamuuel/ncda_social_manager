export interface DraftRow {
  id: string;
  user_id: string;
  content: string;
  link_url: string | null;
  media_paths: string[];
  scheduled_for: string | null;
  status: "pending" | "approved" | "rejected" | "published";
  rejection_note: string | null;
  fb_post_id: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
}
