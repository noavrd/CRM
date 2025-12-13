import { DateTime } from "luxon";
import type { ServerTask, Task } from "../types";

export function serverTaskToTask(t: ServerTask): Task {
  return {
    id: t.id,
    projectId: t.projectId,
    assignee: t.assignee ?? undefined,
    description: t.description ?? "",
    status: t.status ?? "todo",
    dueDate: t.dueDate ? DateTime.fromISO(t.dueDate) : undefined,
  };
}

export function taskToServerPayload(t: Task) {
  return {
    projectId: t.projectId,
    assignee: t.assignee ?? null,
    description: t.description,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.toISODate() : null, // YYYY-MM-DD
  };
}
