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

type ProjectStatusMeta = {
  chipColor:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "info"
    | "error";
  // טקסט להצגה
  label: string;
  // צבע HEX לגרפים וכו'
  color: string;
  short?: string;
};

export const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  quote: {
    chipColor: "info",
    label: "הצעת מחיר",
    color: "#7E9AE8",
    short: "הצעה",
  },
  pre_visit: {
    chipColor: "warning",
    label: "טרום ביקור",
    color: "#F5A623",
    short: "טרום",
  },
  post_visit: {
    chipColor: "warning",
    label: "לאחר ביקור",
    color: "#f35642ff",
    short: "אחרי",
  },
  in_work: {
    chipColor: "success",
    label: "בעבודה",
    color: "#7BC67B",
    short: "עבודה",
  },
  review: {
    chipColor: "secondary",
    label: "בבדיקה",
    color: "#B07CC6",
    short: "בדיקה",
  },
  done: {
    chipColor: "default",
    label: "הושלם",
    color: "#9AA0A6",
    short: "הושלם",
  },
};

export const statusLabel = (s: ProjectStatus) => PROJECT_STATUS_META[s].label;
export const statusColor = (s: ProjectStatus) => PROJECT_STATUS_META[s].color;
