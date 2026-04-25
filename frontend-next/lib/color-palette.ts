import type { CategoryColor } from "@/types/transaction";

export const APP_COLOR_OPTIONS = [
  {
    name: "Blue",
    walletTone: "blue",
    color: "#007aff",
    categoryColor: "indigo",
  },
  {
    name: "Green",
    walletTone: "green",
    color: "#30d158",
    categoryColor: "emerald",
  },
  {
    name: "Orange",
    walletTone: "orange",
    color: "#ff9f0a",
    categoryColor: "amber",
  },
  {
    name: "Graphite",
    walletTone: "slate",
    color: "#1c1c1e",
    categoryColor: "violet",
  },
  {
    name: "BCA",
    walletTone: "blue",
    color: "#1155cc",
    categoryColor: "sky",
  },
  {
    name: "Gold",
    walletTone: "orange",
    color: "#b8860b",
    categoryColor: "rose",
  },
] as const satisfies readonly {
  name: string;
  walletTone: "blue" | "green" | "orange" | "slate";
  color: string;
  categoryColor: CategoryColor;
}[];

export const CATEGORY_COLOR_HEX: Record<CategoryColor, string> =
  APP_COLOR_OPTIONS.reduce(
    (map, option) => {
      map[option.categoryColor] = option.color;
      return map;
    },
    {} as Record<CategoryColor, string>,
  );
