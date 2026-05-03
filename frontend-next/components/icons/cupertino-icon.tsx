import type { ReactNode, SVGProps } from "react";

import { cn } from "@/lib/utils";

export type CupertinoIconName =
  | "alert"
  | "barChart"
  | "calendar"
  | "check"
  | "chevronDown"
  | "close"
  | "database"
  | "download"
  | "folder"
  | "help"
  | "home"
  | "layout"
  | "list"
  | "more"
  | "paperclip"
  | "pie"
  | "piggy"
  | "plus"
  | "receipt"
  | "repeat"
  | "search"
  | "settings"
  | "store"
  | "tag"
  | "upload"
  | "users"
  | "wallet"
  | "logout";

const paths: Record<CupertinoIconName, ReactNode> = {
  alert: (
    <>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 8.5v5" />
      <path d="M12 17.2v.1" />
    </>
  ),
  barChart: (
    <>
      <path d="M4.5 19.5h15" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M8 3.5v4" />
      <path d="M16 3.5v4" />
      <path d="M4 10h16" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  chevronDown: <path d="m6.5 9 5.5 5.5L17.5 9" />,
  close: (
    <>
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
      <path d="M4 9h16" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.3a2.8 2.8 0 0 1 5.1 1.6c0 2.4-2.7 2.4-2.7 4.2" />
      <path d="M12 18v.1" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  layout: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),
  list: (
    <>
      <path d="M9 7h11" />
      <path d="M9 12h11" />
      <path d="M9 17h11" />
      <path d="M4.5 7h.1" />
      <path d="M4.5 12h.1" />
      <path d="M4.5 17h.1" />
    </>
  ),
  more: (
    <>
      <circle cx="6.5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="17.5" cy="12" r="1" />
    </>
  ),
  paperclip: <path d="M20 11.5 11 20a5 5 0 0 1-7-7l10-10a3.5 3.5 0 0 1 5 5L9.5 17a2 2 0 1 1-2.8-2.8L15 6" />,
  pie: (
    <>
      <path d="M12 3.5v8.5h8.5" />
      <path d="M20.1 15A8.5 8.5 0 1 1 9 3.9" />
      <path d="M14 3.8a8.5 8.5 0 0 1 6.2 6.2H14V3.8Z" />
    </>
  ),
  piggy: (
    <>
      <path d="M5 12.5c0-3.2 2.8-5.5 7-5.5h3.5l2-2v3.2A4.8 4.8 0 0 1 19 12v2.5a3 3 0 0 1-3 3h-.5l-.8 2h-2.2l-.8-2H9.2l-.8 2H6.2l-.8-2A4.5 4.5 0 0 1 5 12.5Z" />
      <path d="M8 9.2c-.8-.9-1.8-1.2-3-1" />
      <path d="M16 11h.1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 4h12v16l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2L6 20V4Z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </>
  ),
  repeat: (
    <>
      <path d="M17 4.5 20 7.5 17 10.5" />
      <path d="M4 11V9.5a2 2 0 0 1 2-2h14" />
      <path d="M7 19.5 4 16.5 7 13.5" />
      <path d="M20 13v1.5a2 2 0 0 1-2 2H4" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2" />
      <path d="M12 18.5v2" />
      <path d="M4.6 7.8l1.7 1" />
      <path d="m17.7 15.2 1.7 1" />
      <path d="m4.6 16.2 1.7-1" />
      <path d="m17.7 8.8 1.7-1" />
    </>
  ),
  store: (
    <>
      <path d="M5 10h14l-1.2-5H6.2L5 10Z" />
      <path d="M6.5 10v9h11v-9" />
      <path d="M9 19v-5h6v5" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.5V5h7.5L20 13.5 13.5 20 4 12.5Z" />
      <path d="M8 8h.1" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V5" />
      <path d="m8 9 4-4 4 4" />
      <path d="M5 19h14" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 19c.5-3 2.4-5 5.2-5s4.7 2 5.2 5" />
      <path d="M15 11.5a2.7 2.7 0 1 0-.2-5.1" />
      <path d="M15.5 14.2c2.4.4 4 2.2 4.5 4.8" />
    </>
  ),
  wallet: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="3" />
      <path d="M16 12h4.5v4H16a2 2 0 0 1 0-4Z" />
      <path d="M6.5 9h8" />
    </>
  ),
  logout: (
    <>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="m10 16 4-4-4-4" />
      <path d="M14 12H4" />
    </>
  ),
};

export function CupertinoIcon({
  name,
  className,
  strokeWidth = 1.8,
  ...props
}: SVGProps<SVGSVGElement> & {
  name: CupertinoIconName;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      aria-hidden="true"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
