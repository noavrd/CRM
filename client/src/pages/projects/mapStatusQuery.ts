import { PROJECT_STATUS_ORDER, type ProjectStatus } from "@/lib/projectStatus";

const KEY = "statuses";

export function encodeStatuses(statuses: ProjectStatus[]) {
  return statuses.join(",");
}

export function decodeStatuses(
  value: string | null | undefined
): ProjectStatus[] {
  if (!value) return [...PROJECT_STATUS_ORDER];
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ProjectStatus[];
  // clean not valid values
  const allowed = new Set(PROJECT_STATUS_ORDER);
  const clean = parts.filter((s) => allowed.has(s));
  return clean.length ? clean : [...PROJECT_STATUS_ORDER];
}

export const MAP_STATUSES_QUERY_KEY = KEY;
