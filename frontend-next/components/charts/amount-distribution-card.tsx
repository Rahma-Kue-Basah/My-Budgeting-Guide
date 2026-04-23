"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "@/lib/charts";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import {
  buildAmountAnomalyStats,
  buildAmountDistributionChart,
} from "@/lib/review-alerts";
import type { ProcessedTransaction } from "@/lib/transaction-review";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type AmountDistributionRange = {
  rangeLabel: string;
  rangeStart: number;
  rangeEnd: number;
  filterMax: number;
};

export function AmountDistributionCard({
  transactions,
  isHydrated,
  selectedRange,
  onSelectRange,
  onClearSelectedRange,
  onOpenSelectedRange,
}: {
  transactions: ProcessedTransaction[];
  isHydrated: boolean;
  selectedRange?: AmountDistributionRange | null;
  onSelectRange?: (range: AmountDistributionRange) => void;
  onClearSelectedRange?: () => void;
  onOpenSelectedRange?: () => void;
}) {
  const anomalyStats = useMemo(
    () => buildAmountAnomalyStats(transactions),
    [transactions],
  );

  const distributionChart = useMemo(
    () => buildAmountDistributionChart(transactions),
    [transactions],
  );

  const chartData = useMemo(
    () => [...distributionChart].reverse(),
    [distributionChart],
  );

  const thresholdMarkers = useMemo(() => {
    if (chartData.length === 0) {
      return [];
    }

    const fallbackBucket = chartData[chartData.length - 1];
    const rawMarkers = [
      {
        id: "mean",
        label: "Mean",
        value: anomalyStats.mean,
        color: "rgb(52 211 153)",
      },
      {
        id: "plus_1sigma",
        label: "+1sigma",
        value: anomalyStats.mean + anomalyStats.stdDev,
        color: "rgb(56 189 248)",
      },
      {
        id: "plus_2sigma",
        label: "+2sigma",
        value: anomalyStats.zScoreThreshold,
        color: "rgb(251 113 133)",
      },
      {
        id: "iqr_upper",
        label: "IQR upper",
        value: anomalyStats.iqrUpper,
        color: "rgb(251 191 36)",
      },
    ];

    return rawMarkers.map((marker) => {
      const bucket =
        chartData.find(
          (item, index) =>
            marker.value >= item.rangeStart &&
            (marker.value < item.rangeEnd || index === chartData.length - 1),
        ) ?? fallbackBucket;

      return {
        ...marker,
        rangeLabel: bucket.rangeLabel,
      };
    });
  }, [anomalyStats, chartData]);

  const chartHeight = Math.max(320, chartData.length * 36);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Amount distribution analysis</CardTitle>
        <CardDescription>
          Histogram nominal transaksi processed. Sumbu X menunjukkan jumlah
          transaksi, dan sumbu Y menunjukkan rentang nominal.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isHydrated || chartData.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
            Belum ada data yang cukup untuk analisis distribusi.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">Mean</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatCurrency(Math.round(anomalyStats.mean))}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">Std dev</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatCurrency(Math.round(anomalyStats.stdDev))}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">+2sigma</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatCurrency(Math.round(anomalyStats.zScoreThreshold))}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-xs text-muted-foreground">IQR upper</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatCurrency(Math.round(anomalyStats.iqrUpper))}
                </p>
              </div>
            </div>

            <div className="w-full" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  barCategoryGap={10}
                  margin={{ top: 8, right: 16, bottom: 0, left: 12 }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID_STROKE}
                    strokeDasharray="3 3"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={CHART_AXIS_TICK}
                    tickFormatter={formatCompactNumber}
                  />
                  <YAxis
                    dataKey="rangeLabel"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={132}
                    tick={CHART_AXIS_TICK}
                  />
                  <RechartsTooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload;

                      if (!item) {
                        return "Rentang nominal";
                      }

                      return `Rentang nominal: ${formatCurrency(item.rangeStart)} - ${formatCurrency(item.rangeEnd)}`;
                    }}
                    formatter={(value) =>
                      typeof value === "number"
                        ? [formatCompactNumber(value), "Transactions"]
                        : ["-", "Transactions"]
                    }
                  />
                  {thresholdMarkers.map((marker) => (
                    <ReferenceLine
                      key={marker.id}
                      y={marker.rangeLabel}
                      stroke={marker.color}
                      strokeDasharray="4 4"
                      label={{ value: marker.label, fill: marker.color }}
                    />
                  ))}
                  <Bar
                    dataKey="count"
                    name="Transactions"
                    barSize={18}
                    radius={[0, 8, 8, 0]}
                  >
                    {chartData.map((item) => {
                      const isSelected =
                        selectedRange?.rangeStart === item.rangeStart &&
                        selectedRange?.rangeEnd === item.rangeEnd;

                      return (
                        <Cell
                          key={`${item.rangeStart}-${item.rangeEnd}`}
                          fill={
                            isSelected
                              ? "rgb(79 70 229)"
                              : "rgb(129 140 248)"
                          }
                          className={onSelectRange ? "cursor-pointer" : undefined}
                          onClick={() =>
                            onSelectRange?.({
                              rangeLabel: item.rangeLabel,
                              rangeStart: item.rangeStart,
                              rangeEnd: item.rangeEnd,
                              filterMax: Math.max(
                                item.rangeStart,
                                item.rangeEnd - 1,
                              ),
                            })
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {selectedRange ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-3">
                <p className="text-sm text-foreground">
                  Active bucket:{" "}
                  <span className="font-medium">
                    {formatCurrency(selectedRange.rangeStart)} -{" "}
                    {formatCurrency(selectedRange.filterMax)}
                  </span>
                </p>
                {onClearSelectedRange ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onClearSelectedRange}
                  >
                    Clear bucket
                  </Button>
                ) : null}
                {onOpenSelectedRange ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onOpenSelectedRange}
                  >
                    Open in Transactions
                  </Button>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {thresholdMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs text-muted-foreground"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: marker.color }}
                  />
                  <span>
                    {marker.label}: {formatCurrency(Math.round(marker.value))}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Garis horizontal menunjukkan bucket nominal tempat threshold
              statistik jatuh pada histogram ini.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
