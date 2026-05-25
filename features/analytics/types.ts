export interface PageInsight {
  id: string;
  name: string;
  period: string;
  values: InsightValue[];
}
export interface InsightValue {
  value: number | Record<string, number>;
  end_time: string;
}
export interface PostPerformance {
  id: string;
  content: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
}

export interface AnalyticsData {
  reach: { date: string; value: number }[];
  impressions: { date: string; value: number }[];
  followerGrowth: { date: string; value: number }[]; // CUMULATIVE total followers over time
  followerCount: number; // Current total followers
  bestTimeHeatmap: number[][];
  postPerformance: PostPerformance[];
}
