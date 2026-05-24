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
