import { FacebookMediaType } from "../posts/types";

export interface ScheduledPost {
  id: string;
  content: string;
  scheduledFor: string;
  mediaType: FacebookMediaType;
  mediaUrl?: string;
  mediaUrls?: string[];
}