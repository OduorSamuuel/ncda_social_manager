"use client";

import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, Eye, Users, Heart, MessageCircle,
  Share2, AlertCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalyticsData } from "./types";

interface Props {
  data: AnalyticsData | null;
  error: string | null;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? "12am" : i < 12 ? `${i}am` : i === 12 ? "12pm" : `${i - 12}pm`
);

const RANGE_OPTIONS = ["7d", "14d", "28d"] as const;
type Range = typeof RANGE_OPTIONS[number];

function StatCard({
  label, value, delta, icon: Icon, color,
}: {
  label: string; value: string; delta?: number; icon: any; color: string;
}) {
  return (
    <div className="bg-background rounded-xl border border-border p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
          <Icon size={14} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        {delta !== undefined && (
          <p className={cn("text-xs flex items-center gap-0.5 mt-0.5", delta >= 0 ? "text-green-600" : "text-destructive")}>
            {delta >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(delta)}% vs last period
          </p>
        )}
      </div>
    </div>
  );
}

function HeatmapCell({ value, max }: { value: number; max: number }) {
  const intensity = max > 0 ? value / max : 0; // alpha is derived inline below — no dead variable
  return (
    <div
      title={`${value} engagements`}
      className="w-full aspect-square rounded-sm transition-colors"
      style={{ background: `rgba(59,130,246,${intensity * 0.85 + 0.05})` }}
    />
  );
}

export default function AnalyticsClient({ data, error }: Props) {
  const [range, setRange] = useState<Range>("28d");
  // "metric" toggle removed — state was declared but never consumed in the render tree

  const days = range === "7d" ? 7 : range === "14d" ? 14 : 28;

  const slicedReach = (data?.reach ?? []).slice(-days);
  const slicedImpressions = (data?.impressions ?? []).slice(-days);
  const slicedFans = (data?.followerGrowth ?? []).slice(-days);

  const reachImpData = slicedReach.map((r, i) => ({
    date: r.date,
    Reach: r.value,
    Impressions: slicedImpressions[i]?.value ?? 0,
  }));

  const heatmap = data?.bestTimeHeatmap ?? Array.from({ length: 7 }, () => new Array(24).fill(0));
  const heatmapMax = Math.max(...heatmap.flatMap((row) => row));

  const totalReach = slicedReach.reduce((s, r) => s + r.value, 0);
  const totalImpressions = slicedImpressions.reduce((s, r) => s + r.value, 0);
  const latestFans = slicedFans[slicedFans.length - 1]?.value ?? 0;
  const posts = data?.postPerformance ?? [];
  const totalEngagement = posts.reduce((s, p) => s + p.likes + p.comments + p.shares, 0);

  const fmt = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
    : String(n);

  return (
    <div className="flex flex-col h-full">
   

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4">

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={15} className="shrink-0" />{error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total reach"      value={fmt(totalReach)}       icon={Eye}       color="bg-blue-100   text-blue-600   dark:bg-blue-900/40   dark:text-blue-400"   />
          <StatCard label="Impressions"      value={fmt(totalImpressions)} icon={TrendingUp} color="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400" />
          <StatCard label="Total followers"  value={fmt(latestFans)}       icon={Users}     color="bg-green-100  text-green-600  dark:bg-green-900/40  dark:text-green-400"  />
          <StatCard label="Engagements"      value={fmt(totalEngagement)}  icon={Heart}     color="bg-pink-100   text-pink-600   dark:bg-pink-900/40   dark:text-pink-400"   />
        </div>

        {/* Reach & Impressions chart */}
        <div className="bg-background rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Reach & Impressions</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={reachImpData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip
                contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => (typeof v === "number" ? fmt(v) : String(v ?? ""))}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Reach"       stroke="#3b82f6" strokeWidth={2} fill="url(#gReach)" dot={false} />
              <Area type="monotone" dataKey="Impressions" stroke="#a855f7" strokeWidth={2} fill="url(#gImp)"   dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Follower growth chart */}
        <div className="bg-background rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Follower Growth</h2>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart
              data={slicedFans.map((f) => ({ date: f.date, Followers: f.value }))}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="gFans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={fmt} />
              <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => (typeof v === "number" ? fmt(v) : String(v ?? ""))} />
              <Area type="monotone" dataKey="Followers" stroke="#10b981" strokeWidth={2} fill="url(#gFans)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

     

        {/* Post performance table */}
        <div className="bg-background rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Post performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left  px-4 py-2.5 font-medium text-muted-foreground">Post</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground"><Heart         size={11} className="inline mr-0.5" />Likes</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground"><MessageCircle size={11} className="inline mr-0.5" />Comments</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground"><Share2        size={11} className="inline mr-0.5" />Shares</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Reach</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-muted-foreground">No post data available</td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="truncate text-foreground">{p.content || "(No text)"}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{p.publishedAt}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.likes)}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.comments)}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.shares)}</td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(p.reach)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}