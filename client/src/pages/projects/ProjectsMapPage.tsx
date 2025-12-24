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
  Button,
  Divider,
  Alert,
} from "@mui/material";
import { useSearchParams } from "react-router-dom";

import {
  PROJECT_STATUS_ORDER,
  type ProjectStatus,
  statusLabel,
} from "@/lib/projectStatus";

import { ProjectsMap, type ProjectMapItem } from "./ProjectsMap";
import {
  decodeStatuses,
  encodeStatuses,
  MAP_STATUSES_QUERY_KEY,
} from "./mapStatusQuery";

export default function ProjectsMapPage() {
  const [params, setParams] = useSearchParams();

  const initialStatuses = useMemo(
    () => decodeStatuses(params.get(MAP_STATUSES_QUERY_KEY)),
    [params]
  );
  const [selectedStatuses, setSelectedStatuses] =
    useState<ProjectStatus[]>(initialStatuses);

  // נשמור את הפריטים המוצגים כדי שנוכל לחשב מסלול לפי ids
  const [visibleItems, setVisibleItems] = useState<ProjectMapItem[]>([]);
  const visibleById = useMemo(
    () => new Map(visibleItems.map((x) => [x.id, x])),
    [visibleItems]
  );

  // --- מסלול ---
  const [routeMode, setRouteMode] = useState(false);
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distanceText: string;
    durationText: string;
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const onChangeStatuses = (next: ProjectStatus[]) => {
    setSelectedStatuses(next);

    const p = new URLSearchParams(params);
    p.set(MAP_STATUSES_QUERY_KEY, encodeStatuses(next));
    setParams(p, { replace: true });

    // שינוי סינון -> כדאי לאפס מסלול (כדי שלא יהיו ids שלא קיימים)
    setRouteIds([]);
    setDirections(null);
    setRouteSummary(null);
    setRouteError(null);
  };

  const onToggleRouteId = (id: string) => {
    setRouteError(null);
    setDirections(null);
    setRouteSummary(null);

    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearRoute = () => {
    setRouteIds([]);
    setDirections(null);
    setRouteSummary(null);
    setRouteError(null);
  };

  const computeRoute = async () => {
    setRouteError(null);
    setRouteLoading(true);
    setDirections(null);
    setRouteSummary(null);

    try {
      if (routeIds.length < 2) {
        setRouteError("כדי לחשב מסלול צריך לבחור לפחות 2 נקודות.");
        return;
      }

      const points = routeIds
        .map((id) => visibleById.get(id))
        .filter(Boolean)
        .map((p) => ({ lat: p!.address.lat, lng: p!.address.lng }));

      if (points.length < 2) {
        setRouteError(
          "לא נמצאו נקודות חוקיות למסלול (בדקי שהן קיימות במפה אחרי הסינון)."
        );
        return;
      }

      const origin = points[0];
      const destination = points[points.length - 1];
      const waypoints = points
        .slice(1, -1)
        .map((p) => ({ location: p, stopover: true }));

      const svc = new google.maps.DirectionsService();
      const res = await svc.route({
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirections(res);

      const legSum = res.routes?.[0]?.legs ?? [];
      const totalMeters = legSum.reduce(
        (s, leg) => s + (leg.distance?.value ?? 0),
        0
      );
      const totalSeconds = legSum.reduce(
        (s, leg) => s + (leg.duration?.value ?? 0),
        0
      );

      const distanceText = totalMeters
        ? totalMeters >= 1000
          ? `${(totalMeters / 1000).toFixed(1)} ק״מ`
          : `${totalMeters} מ׳`
        : "—";

      const durationText = totalSeconds
        ? totalSeconds >= 3600
          ? `${Math.floor(totalSeconds / 3600)}ש׳ ${Math.round(
              (totalSeconds % 3600) / 60
            )}ד׳`
          : `${Math.round(totalSeconds / 60)} ד׳`
        : "—";

      setRouteSummary({ distanceText, durationText });
    } catch (e: any) {
      console.error(e);
      setRouteError(
        e?.message ||
          "שגיאה בחישוב מסלול. בדקי שה־Directions API מופעל ושיש Billing."
      );
    } finally {
      setRouteLoading(false);
    }
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

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={routeMode ? "contained" : "outlined"}
              onClick={() => {
                setRouteMode((v) => !v);
                setDirections(null);
                setRouteSummary(null);
                setRouteError(null);
              }}
            >
              מצב מסלול
            </Button>

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
                        flexDirection: "row-reverse",
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
        </Stack>

        {routeMode && (
          <>
            <Divider sx={{ my: 2 }} />

            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              flexWrap="wrap"
            >
              <Typography sx={{ direction: "rtl" }}>
                בחרי נקודות ע״י לחיצה על הסיכות במפה (צריך לפחות 2).
              </Typography>

              <Button onClick={clearRoute} disabled={!routeIds.length}>
                נקה בחירה
              </Button>

              <Button
                variant="contained"
                onClick={computeRoute}
                disabled={routeIds.length < 2 || routeLoading}
              >
                חשב מסלול
              </Button>

              {routeSummary && (
                <Typography sx={{ direction: "rtl" }}>
                  סה״כ: {routeSummary.durationText} ·{" "}
                  {routeSummary.distanceText}
                </Typography>
              )}
            </Stack>

            {routeError && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="warning" sx={{ direction: "rtl" }}>
                  {routeError}
                </Alert>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Paper sx={{ height: "calc(100vh - 140px)" }}>
        <ProjectsMap
          selectedStatuses={selectedStatuses}
          height="100%"
          fitToFiltered
          routeMode={routeMode}
          selectedRouteIds={routeIds}
          onToggleRouteId={onToggleRouteId}
          directions={directions}
          onItemsLoaded={setVisibleItems}
        />
      </Paper>
    </Box>
  );
}
