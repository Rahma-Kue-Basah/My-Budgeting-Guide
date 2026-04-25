import type { CSSProperties } from "react";

import { CATEGORY_COLOR_HEX } from "@/lib/color-palette";
import type { CategoryColor } from "@/types/transaction";

export const CHART_COLOR_PALETTE = {
  violet: CATEGORY_COLOR_HEX.violet,
  amber: CATEGORY_COLOR_HEX.amber,
  rose: CATEGORY_COLOR_HEX.rose,
  emerald: CATEGORY_COLOR_HEX.emerald,
  sky: CATEGORY_COLOR_HEX.sky,
  indigo: CATEGORY_COLOR_HEX.indigo,
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
