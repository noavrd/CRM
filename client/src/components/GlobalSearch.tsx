// src/components/GlobalSearch.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Autocomplete,
  Box,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { api } from "@/api/http";

type SearchKind = "project" | "task" | "visit" | "event";

type Snippet = {
  fieldLabel: string;
  before: string;
  match: string;
  after: string;
};

type SearchOption = {
  kind: SearchKind;
  id: string;
  label: string;
  secondary?: string;
  snippet?: Snippet | null;
  to: string; // לאן לנווט
};

// ---- טיפוסים מינימליים (לא תלויים בקבצי types שלך) ----
type Project = {
  id: string;
  name?: string;
  customer?: { name?: string; phone?: string };
  address?: { city?: string; street?: string; number?: string };
};

type UiTask = {
  id: string;
  title?: string;
  description?: string;
  projectId?: string;
};

type UpcomingVisit = {
  id: string;
  projectId: string;
  projectName?: string;
  addressText?: string | null;
  startsAt?: string;
};

function norm(x: any) {
  return String(x ?? "")
    .toLowerCase()
    .trim();
}

function findSnippet(
  query: string,
  parts: Array<{ label: string; text: string }>
) {
  const q = norm(query);
  if (!q) return null;

  for (const p of parts) {
    const t = String(p.text ?? "");
    const hay = t.toLowerCase();
    const idx = hay.indexOf(q);
    if (idx === -1) continue;

    // חותכים סביב ההתאמה כדי להציג "…"
    const PAD = 18;
    const start = Math.max(0, idx - PAD);
    const end = Math.min(t.length, idx + q.length + PAD);

    const prefix = start > 0 ? "…" : "";
    const suffix = end < t.length ? "…" : "";

    const before = t.slice(start, idx);
    const match = t.slice(idx, idx + q.length);
    const after = t.slice(idx + q.length, end);

    return {
      fieldLabel: p.label,
      before: prefix + before,
      match,
      after: after + suffix,
    };
  }

  return null;
}

function useDebouncedValue<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function GlobalSearch() {
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const q = useDebouncedValue(input, 800);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [visits, setVisits] = useState<UpcomingVisit[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const s = q.trim();
      if (s.length < 2) {
        if (!cancelled) {
          setProjects([]);
          setTasks([]);
          setVisits([]);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setLoading(true);

      try {
        const [p, t, v] = await Promise.all([
          api<Project[]>("/api/projects"),
          api<{ items: UiTask[] }>("/api/tasks").then((r) => r.items ?? []),
          api<{ count: number; items: UpcomingVisit[] }>("/api/visits/upcoming")
            .then((r) => (Array.isArray(r?.items) ? r.items : []))
            .catch(() => []),
        ]);

        if (cancelled) return;

        setProjects(Array.isArray(p) ? p : []);
        setTasks(Array.isArray(t) ? (t as any) : []);
        setVisits(Array.isArray(v) ? v : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [q]);

  const options: SearchOption[] = useMemo(() => {
    const s = norm(q);
    if (!s || s.length < 2) return [];

    const projectHits: SearchOption[] = projects
      .filter((p) => {
        const addr = `${p.address?.street ?? ""} ${p.address?.number ?? ""} ${
          p.address?.city ?? ""
        }`;
        return (
          norm(p.name).includes(s) ||
          norm(p.customer?.name).includes(s) ||
          norm(p.customer?.phone).includes(s) ||
          norm(addr).includes(s)
        );
      })
      .slice(0, 8)
      .map((p) => {
        const addr = `${p.address?.street ?? ""} ${p.address?.number ?? ""} ${
          p.address?.city ?? ""
        }`.trim();

        const parts = [
          { label: "שם פרויקט", text: p.name ?? "" },
          { label: "שם לקוח", text: p.customer?.name ?? "" },
          { label: "טלפון", text: p.customer?.phone ?? "" },
          { label: "כתובת", text: addr },
        ];

        const snippet = findSnippet(q, parts);

        return {
          kind: "project",
          id: p.id,
          label: p.name || "פרויקט ללא שם",
          secondary: `${p.customer?.name ?? ""} · ${addr}`.trim(),
          snippet,
          to: `/projects/${p.id}`,
        };
      });

    const taskHits: SearchOption[] = tasks
      .filter(
        (t) => norm(t.title).includes(s) || norm(t.description).includes(s)
      )
      .slice(0, 8)
      .map((t) => {
        const parts = [
          { label: "כותרת", text: t.title ?? "" },
          { label: "תיאור", text: t.description ?? "" },
        ];

        const snippet = findSnippet(q, parts);

        return {
          kind: "task",
          id: t.id,
          label: t.title || "משימה ללא כותרת",
          secondary: t.description || "",
          snippet,
          to: `/tasks/${t.id}`,
        };
      });

    const visitHits: SearchOption[] = visits
      .filter(
        (v) =>
          norm(v.projectName).includes(s) || norm(v.addressText).includes(s)
      )
      .slice(0, 8)
      .map((v) => {
        const parts = [
          { label: "שם פרויקט", text: v.projectName ?? "" },
          { label: "כתובת", text: v.addressText ?? "" },
        ];

        const snippet = findSnippet(q, parts);

        return {
          kind: "visit",
          id: v.id,
          label: v.projectName ? `ביקור · ${v.projectName}` : "ביקור",
          secondary: v.addressText ?? "",
          snippet,
          to: `/projects/${v.projectId}`,
        };
      });

    // סדר: פרויקטים, משימות, ביקורים
    return [...projectHits, ...taskHits, ...visitHits];
  }, [projects, tasks, visits, q]);

  const onPick = (opt: SearchOption | null) => {
    if (!opt) return;
    setOpen(false);
    // ניקוי נחמד אחרי ניווט
    setInput("");
    navigate(opt.to);
  };

  const groupLabel = (k: SearchKind) => {
    if (k === "project") return "פרויקטים";
    if (k === "task") return "משימות";
    if (k === "visit") return "ביקורים";
    return "יומן";
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 520 }}>
      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        loading={loading}
        value={null}
        inputValue={input}
        onInputChange={(_, v) => setInput(v)}
        onChange={(_, v) => onPick(v)}
        filterOptions={(x) => x} // כבר סיננו בעצמנו
        getOptionLabel={(o) => o.label}
        groupBy={(o) => groupLabel(o.kind)}
        noOptionsText={
          q.trim().length < 2 ? "התחילי להקליד (לפחות 2 תווים)" : "אין תוצאות"
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="חיפוש כללי… (שם, כתובת, טלפון, וכו׳)"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "background.paper",
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={18} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, opt) => (
          <li {...props} key={`${opt.kind}_${opt.id}`}>
            <Box
              sx={{ display: "flex", flexDirection: "column", width: "100%" }}
            >
              <Typography sx={{ fontWeight: 800 }} noWrap>
                {opt.label}
              </Typography>
              {opt.secondary ? (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {opt.secondary}
                </Typography>
              ) : null}
              {opt.snippet ? (
                <Typography
                  variant="body2"
                  sx={{ mt: 0.25, opacity: 0.85 }}
                  noWrap
                >
                  {opt.snippet.fieldLabel}: {opt.snippet.before}
                  <Box
                    component="span"
                    sx={{ fontWeight: 900, textDecoration: "underline" }}
                  >
                    {opt.snippet.match}
                  </Box>
                  {opt.snippet.after}
                </Typography>
              ) : null}
            </Box>
          </li>
        )}
      />
    </Box>
  );
}
