import type { CSSProperties } from "react";

import type { CategoryColor } from "@/types/transaction";

export const CHART_COLOR_PALETTE = {
  violet: "rgb(167 139 250)",
  amber: "rgb(251 191 36)",
  rose: "rgb(251 113 133)",
  emerald: "rgb(52 211 153)",
  sky: "rgb(56 189 248)",
  indigo: "rgb(129 140 248)",
} as const;

export const CATEGORY_CHART_COLORS: Record<CategoryColor, string> = {
  indigo: CHART_COLOR_PALETTE.indigo,
  sky: CHART_COLOR_PALETTE.sky,
  emerald: CHART_COLOR_PALETTE.emerald,
  amber: CHART_COLOR_PALETTE.amber,
  rose: CHART_COLOR_PALETTE.rose,
  violet: CHART_COLOR_PALETTE.violet,
};

export const CHART_GRID_STROKE = "rgb(226 232 240)";
export const CHART_AXIS_TICK = { fontSize: 12, fill: "rgb(100 116 139)" } as const;
export const CHART_TOOLTIP_STYLE: CSSProperties = {
  borderRadius: 10,
  border: `1px solid ${CHART_GRID_STROKE}`,
  backgroundColor: "white",
};

export function getCategoryChartColor(color: CategoryColor) {
  return CATEGORY_CHART_COLORS[color];
}
