
import { Suspense } from "react";
import AnalyticsClient from "./analytics-client";
import { getAnalyticsData } from "./actions";

export default async function AnalyticsContent() {
  // Single action that returns the fully-shaped AnalyticsData (+ any error string)
  const { data, error } = await getAnalyticsData();

  // AnalyticsClient expects { data: AnalyticsData | null, error: string | null }
  return <AnalyticsClient data={data} error={error} />;
}