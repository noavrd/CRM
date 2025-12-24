import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import {
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
  statusLabel,
} from "@/lib/projectStatus";

import { ProjectsMap } from "./ProjectsMap";
import {
  decodeStatuses,
  encodeStatuses,
  MAP_STATUSES_QUERY_KEY,
} from "./mapStatusQuery";

export default function ProjectsMapPage() {
  const [params, setParams] = useSearchParams();

  const initialStatuses = useMemo(() => {
    return decodeStatuses(params.get(MAP_STATUSES_QUERY_KEY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedStatuses, setSelectedStatuses] =
    useState<ProjectStatus[]>(initialStatuses);

  const onChangeStatuses = (next: ProjectStatus[]) => {
    setSelectedStatuses(next);

    const p = new URLSearchParams(params);
    p.set(MAP_STATUSES_QUERY_KEY, encodeStatuses(next));
    setParams(p, { replace: true });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Typography variant="h6">מפת פרויקטים</Typography>

          <FormControl size="small" sx={{ width: 260 }}>
            <InputLabel id="map-page-status-filter-label">סטטוס</InputLabel>

            <Select
              labelId="map-page-status-filter-label"
              label="סטטוסים"
              multiple
              value={selectedStatuses}
              onChange={(e) =>
                onChangeStatuses(e.target.value as ProjectStatus[])
              }
              MenuProps={{
                PaperProps: { sx: { maxWidth: 260 } },
                anchorOrigin: { vertical: "bottom", horizontal: "right" },
                transformOrigin: { vertical: "top", horizontal: "right" },
              }}
              renderValue={(selected) => {
                const labels = (selected as ProjectStatus[])
                  .map(statusLabel)
                  .join(", ");
                return (
                  <Box
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      direction: "rtl",
                      textAlign: "right",
                    }}
                    title={labels}
                  >
                    {labels}
                  </Box>
                );
              }}
              sx={{ direction: "rtl", textAlign: "right" }}
            >
              {PROJECT_STATUS_ORDER.map((s) => (
                <MenuItem key={s} value={s} sx={{ direction: "rtl" }}>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "row-reverse", // checkbox מימין
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1,
                    }}
                  >
                    <Checkbox checked={selectedStatuses.includes(s)} />
                    <ListItemText primary={statusLabel(s)} />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper sx={{ height: "calc(100vh - 140px)" }}>
        <ProjectsMap selectedStatuses={selectedStatuses} height="100%" />
      </Paper>
    </Box>
  );
}
