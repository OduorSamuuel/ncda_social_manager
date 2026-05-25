import { Suspense } from "react";
import AnalyticsContent from "../../../features/analytics/analytic-content";
import { PageLoader } from "@/components/shared/loading";

export const dynamic = "force-dynamic"; 

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageLoader/>}>
      <AnalyticsContent />
    </Suspense>
  );
}