import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Stack,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import {
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
  statusLabel,
} from "@/lib/projectStatus";

import { ProjectsMap } from "./ProjectsMap";
import { encodeStatuses, MAP_STATUSES_QUERY_KEY } from "./mapStatusQuery";

export default function ProjectsMapCard() {
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([
    ...PROJECT_STATUS_ORDER,
  ]);

  const openUrl = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set(MAP_STATUSES_QUERY_KEY, encodeStatuses(selectedStatuses));
    return `/projects/map?${qs.toString()}`;
  }, [selectedStatuses]);

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center">
            <Typography variant="h6">מפת פרויקטים</Typography>

            <Tooltip title="פתיחה במפה גדולה">
              <IconButton
                size="small"
                component="a"
                href={openUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <FormControl size="small" sx={{ width: 220 }}>
              <InputLabel id="map-status-filter-label">סטטוס</InputLabel>
              <Select
                labelId="map-status-filter-label"
                label="סטטוסים"
                multiple
                value={selectedStatuses}
                onChange={(e) =>
                  setSelectedStatuses(e.target.value as ProjectStatus[])
                }
                MenuProps={{ PaperProps: { sx: { maxWidth: 260 } } }}
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
                      }}
                      title={labels}
                    >
                      {labels}
                    </Box>
                  );
                }}
              >
                {PROJECT_STATUS_ORDER.map((s) => (
                  <MenuItem key={s} value={s}>
                    <Checkbox checked={selectedStatuses.includes(s)} />
                    <ListItemText primary={statusLabel(s)} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        }
      />

      <CardContent sx={{ flex: 1, p: 0, position: "relative" }}>
        <ProjectsMap selectedStatuses={selectedStatuses} height="100%" />
      </CardContent>
    </Card>
  );
}
