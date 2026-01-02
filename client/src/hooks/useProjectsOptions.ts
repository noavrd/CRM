import { useEffect, useState } from "react";
import { api } from "@/api/http";
import type { ProjectOption } from "../pages/types";

type Options = {
  //case no project
  allowNone?: boolean;
  noneLabel?: string;
};

export type ProjectOptionWithNone = ProjectOption | null;

export function useProjectsOptions(options: Options = {}) {
  const { allowNone = false, noneLabel = "ללא פרויקט" } = options;

  const [projects, setProjects] = useState<ProjectOptionWithNone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api<any[]>("/api/projects");
      const arr = Array.isArray(res) ? res : [];

      const mapped: ProjectOption[] = arr.map((p) => ({
        id: String(p.id),
        name: String(p.name ?? ""),
      }));

      setProjects(
        allowNone ? [{ id: "", name: noneLabel } as any, ...mapped] : mapped
      );
    } catch (e) {
      console.error("useProjectsOptions error:", e);
      setError("שגיאה בטעינת פרויקטים");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    projects,
    loading,
    error,
    reload: load,
  };
}
