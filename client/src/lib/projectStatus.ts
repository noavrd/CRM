export type ProjectStatus =
  | "quote"
  | "pre_visit"
  | "post_visit"
  | "in_work"
  | "review"
  | "done";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "quote",
  "pre_visit",
  "post_visit",
  "in_work",
  "review",
  "done",
];

// תצוגה: תווית + צבע (לגרפים/תגיות)
export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; color: string; short?: string }
> = {
  quote: { label: "הצעת מחיר", color: "#7E9AE8", short: "הצעה" },
  pre_visit: { label: "טרום ביקור", color: "#F5A623", short: "טרום" },
  post_visit: { label: "לאחר ביקור", color: "#F2780C", short: "אחרי" },
  in_work: { label: "בעבודה", color: "#7BC67B", short: "עבודה" },
  review: { label: "בבדיקה", color: "#B07CC6", short: "בדיקה" },
  done: { label: "הושלם", color: "#9AA0A6", short: "הושלם" },
};

export const statusLabel = (s: ProjectStatus) => PROJECT_STATUS_META[s].label;
export const statusColor = (s: ProjectStatus) => PROJECT_STATUS_META[s].color;
