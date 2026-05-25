"use server";

import { connection } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import { getEnv } from "@/utils/helpers";
import { BASE } from "@/utils/constants";
import { AnalyticsData, PostPerformance } from "./types";


export async function getPagePosts() {
  const { token, pageId } = getEnv();
  
  const url = `${BASE}/${pageId}/published_posts` +
    `?fields=id,message,created_time,likes.summary(true),comments.summary(true),shares` +
    `,insights.metric(post_media_view).period(lifetime)` +
    `&limit=25&access_token=${token}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    
    if (json.error) {
      console.error("[getPagePosts] API Error:", json.error);
      return [];
    }
    
    return (json.data ?? []) as any[];
  } catch (error) {
    console.error("[getPagePosts]", error);
    return [];
  }
}
/**
 * Fetch page-level insights using v25.0 replacement metrics
 * Per Meta v25.0 docs: page_impressions_unique → page_total_media_view_unique
 */
async function getPageInsights(currentTotalFollowers: number): Promise<{
  reach: { date: string; value: number }[];
  impressions: { date: string; value: number }[];
  followerGrowth: { date: string; value: number }[];
}> {
  const { token, pageId } = getEnv();
  
  const metrics = [
    "page_total_media_view_unique",
    "page_media_view",
    "page_daily_follows_unique"  // Daily NEW followers (delta)
  ];
  
  const since = new Date();
  since.setDate(since.getDate() - 28);
  const sinceStr = since.toISOString().split('T')[0];
  
  const url = `${BASE}/${pageId}/insights` +
    `?metric=${metrics.join(",")}` +
    `&period=day` +
    `&since=${sinceStr}` +
    `&access_token=${token}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    
    if (json.error) {
      console.error("[getPageInsights] API Error:", json.error);
      return { reach: [], impressions: [], followerGrowth: [] };
    }
    
    let dailyNewFollowers: { date: string; value: number }[] = [];
    const result = {
      reach: [] as { date: string; value: number }[],
      impressions: [] as { date: string; value: number }[],
      followerGrowth: [] as { date: string; value: number }[],
    };
    
    // Parse the API response
    for (const item of json.data ?? []) {
      const values = (item.values ?? []).map((v: any) => ({
        date: v.end_time?.slice(0, 10) || "",
        value: typeof v.value === "number" ? v.value : 0,
      }));
      
      if (item.name === "page_total_media_view_unique") {
        result.reach = values;
      } else if (item.name === "page_media_view") {
        result.impressions = values;
      } else if (item.name === "page_daily_follows_unique") {
        dailyNewFollowers = values;
      }
    }
    
    // Calculate CUMULATIVE follower growth (total followers over time)
    if (dailyNewFollowers.length > 0) {
      // API usually returns newest first, so reverse to get oldest first
      const sortedDailyNew = [...dailyNewFollowers].reverse();
      
      // Calculate starting total (current total minus all daily new followers in the period)
      const totalNewInPeriod = sortedDailyNew.reduce((sum, day) => sum + day.value, 0);
      let runningTotal = currentTotalFollowers - totalNewInPeriod;
      
      // Build cumulative array
      result.followerGrowth = sortedDailyNew.map(day => {
        runningTotal += day.value;
        return {
          date: day.date,
          value: runningTotal
        };
      });
      
      console.log("[getPageInsights] Cumulative follower growth calculated:", result.followerGrowth);
    }
    
    return result;
  } catch (error) {
    console.error("[getPageInsights]", error);
    return { reach: [], impressions: [], followerGrowth: [] };
  }
}
async function getFollowerCount(): Promise<number> {
  const { token, pageId } = getEnv();
  
  const url = `${BASE}/${pageId}?fields=followers_count&access_token=${token}`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const json = await res.json();
    return json.followers_count ?? 0;
  } catch (error) {
    console.error("[getFollowerCount]", error);
    return 0;
  }
}

// ─── Heatmap builder ──────────────────────────────────────────────────────────

function buildHeatmap(posts: any[]): number[][] {
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  
  for (const post of posts) {
    if (!post.created_time) continue;
    const d = new Date(post.created_time);
    const day = d.getDay();
    const hour = d.getHours();
    const engagement = (post.likes?.summary?.total_count ?? 0) +
      (post.comments?.summary?.total_count ?? 0) +
      (post.shares?.count ?? 0);
    heatmap[day][hour] += engagement;
  }
  return heatmap;
}


// ─── Post transformer ─────────────────────────────────────────────────────────

function transformPosts(raw: any[]): PostPerformance[] {
  return raw.map((p) => {
    let reach = 0;
    if (p.insights?.data) {
      const mediaViewData = p.insights.data.find(
        (m: any) => m.name === "post_media_view"
      );
      if (mediaViewData?.values?.[0]) {
        reach = typeof mediaViewData.values[0].value === "number" 
          ? mediaViewData.values[0].value 
          : 0;
      }
    }
    
    return {
      id: p.id,
      content: p.message ?? "",
      publishedAt: p.created_time
        ? new Date(p.created_time).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—",
      likes: p.likes?.summary?.total_count ?? 0,
      comments: p.comments?.summary?.total_count ?? 0,
      shares: p.shares?.count ?? 0,
      reach,
    };
  });
}


// ─── Main exported action ─────────────────────────────────────────────────────

export async function getAnalyticsData(): Promise<{
  data: AnalyticsData | null;
  error: string | null;
}> {
  noStore();
  await connection();

  try {
    // First get current total followers
    const followerCount = await getFollowerCount();
    
    // Then get insights and calculate cumulative growth using the current total
    const [insights, rawPosts] = await Promise.all([
      getPageInsights(followerCount),
      getPagePosts(),
    ]);

    const data: AnalyticsData = {
      reach: insights.reach,
      impressions: insights.impressions,
      followerGrowth: insights.followerGrowth, // Now this is CUMULATIVE total followers over time!
      followerCount,
      bestTimeHeatmap: buildHeatmap(rawPosts),
      postPerformance: transformPosts(rawPosts),
    };

    return { data, error: null };
  } catch (err: any) {
    console.error("[getAnalyticsData]", err);
    return { data: null, error: err?.message ?? "Failed to load analytics." };
  }
}