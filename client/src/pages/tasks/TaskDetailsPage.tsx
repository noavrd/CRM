import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/api/http";
import { DetailsShell } from "@/components/details/DetailsShell";
import { Col, DetailsSection, KV } from "@/components/details/DetailsBits";
import type { ServerTask } from "../types";
import { Chip } from "@mui/material";

function statusChip(status?: string) {
  const map: Record<
    string,
    { label: string; color: "default" | "warning" | "success" }
  > = {
    todo: { label: "פתוחה", color: "warning" },
    open: { label: "פתוחה", color: "warning" },
    "in-progress": { label: "בתהליך", color: "default" },
    done: { label: "בוצעה", color: "success" },
  };

  const meta = status ? map[status] : null;

  return (
    <Chip
      size="small"
      label={meta?.label ?? String(status ?? "-")}
      color={meta?.color ?? "default"}
      variant={status === "in-progress" ? "outlined" : "filled"}
      sx={{ ml: 1 }} // קצת מרווח מהכותרת
    />
  );
}

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [task, setTask] = useState<ServerTask | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setErr(null);
        const full = await api<ServerTask>(`/api/tasks/${id}`);
        setTask(full);
      } catch {
        setErr("שגיאה בטעינת פרטי המשימה");
        setTask(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <DetailsShell
      title={task?.title ? `משימה: ${task.title}` : "פרטי משימה"}
      titleAdornment={task ? statusChip((task as any).status) : null} // ✅ כאן הסטטוס ליד הכותרת
      loading={loading}
      errorText={err}
      onBack={() => navigate(-1)}
    >
      {!task ? null : (
        <>
          <DetailsSection title="כללי">
            <Col>
              <KV label="יעד" value={(task as any).dueDate ?? "-"} />
            </Col>
            <Col>
              <KV label="אחראית" value={(task as any).assignee ?? "-"} />
            </Col>
            <Col>
              <KV
                label="פרויקט"
                value={
                  (task as any).projectName ?? (task as any).projectId ?? "-"
                }
              />
            </Col>
          </DetailsSection>

          <DetailsSection title="פרטים">
            <Col xs={12} md={6}>
              <KV label="תיאור" value={(task as any).description ?? "-"} />
            </Col>
          </DetailsSection>
        </>
      )}
    </DetailsShell>
  );
}
