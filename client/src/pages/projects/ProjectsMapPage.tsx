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
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText as MListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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

function formatAddress(p: ProjectMapItem) {
  const a = p.address || {};
  const parts = [
    a.street && a.number ? `${a.street} ${a.number}` : a.street,
    a.city,
    a.neighborhood && `שכונת ${a.neighborhood}`,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function ProjectsMapPage() {
  const [params, setParams] = useSearchParams();

  const initialStatuses = useMemo(
    () => decodeStatuses(params.get(MAP_STATUSES_QUERY_KEY)),
    [params]
  );
  const [selectedStatuses, setSelectedStatuses] =
    useState<ProjectStatus[]>(initialStatuses);

  // items from BE for lat/lng
  const [visibleItems, setVisibleItems] = useState<ProjectMapItem[]>([]);
  const visibleById = useMemo(
    () => new Map(visibleItems.map((x) => [x.id, x])),
    [visibleItems]
  );
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
  const [orderedStops, setOrderedStops] = useState<ProjectMapItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const resetRouteOutputs = () => {
    setDirections(null);
    setRouteSummary(null);
    setRouteError(null);
    setOrderedStops([]);
    setDrawerOpen(false);
  };

  const onChangeStatuses = (next: ProjectStatus[]) => {
    setSelectedStatuses(next);

    const p = new URLSearchParams(params);
    p.set(MAP_STATUSES_QUERY_KEY, encodeStatuses(next));
    setParams(p, { replace: true });

    // reset route
    setRouteIds([]);
    resetRouteOutputs();
  };

  const onToggleRouteId = (id: string) => {
    // clean old route
    setRouteError(null);
    setDirections(null);
    setRouteSummary(null);
    setOrderedStops([]);
    setDrawerOpen(false);

    setRouteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearRoute = () => {
    setRouteIds([]);
    resetRouteOutputs();
  };

  const computeRoute = async () => {
    setRouteError(null);
    setRouteLoading(true);
    setDirections(null);
    setRouteSummary(null);
    setOrderedStops([]);
    setDrawerOpen(false);

    try {
      if (routeIds.length < 2) {
        setRouteError("כדי לחשב מסלול צריך לבחור לפחות 2 נקודות.");
        return;
      }

      // items chosen by order
      const chosen = routeIds
        .map((id) => visibleById.get(id))
        .filter(Boolean) as ProjectMapItem[];

      if (chosen.length < 2) {
        setRouteError(
          "לא נמצאו נקודות חוקיות למסלול (בדקי שהן קיימות במפה אחרי הסינון)."
        );
        return;
      }

      const points = chosen.map((p) => ({
        lat: p.address.lat,
        lng: p.address.lng,
      }));

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

      const route = res.routes?.[0];
      const order = route?.waypoint_order ?? [];

      const originItem = chosen[0];
      const destinationItem = chosen[chosen.length - 1];
      const middle = chosen.slice(1, -1);

      const optimizedMiddle = order.map((idx) => middle[idx]).filter(Boolean);

      const finalStops = [originItem, ...optimizedMiddle, destinationItem];
      setOrderedStops(finalStops);

      // calculate time + distance
      const legs = route?.legs ?? [];
      const totalMeters = legs.reduce(
        (s, leg) => s + (leg.distance?.value ?? 0),
        0
      );
      const totalSeconds = legs.reduce(
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

      setDrawerOpen(true);
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

  const drawerWidth = 420;

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Typography variant="h6">מפת פרויקטים</Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={routeMode ? "contained" : "outlined"}
              onClick={() => {
                setRouteMode((v) => !v);
                resetRouteOutputs();
              }}
            >
              {routeMode ? "סגירת מסלול" : "יצירת מסלול"}
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
                בחר נקודות ע״י לחיצה על הסיכות במפה (לפחות 2)
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

              <Button
                variant="outlined"
                onClick={() => setDrawerOpen(true)}
                disabled={orderedStops.length < 2}
              >
                הצג מסלול
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

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: drawerWidth,
            maxWidth: "90vw",
            direction: "rtl",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">המסלול</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {!orderedStops.length && (
            <Typography color="text.secondary">
              אין מסלול להצגה עדיין. חשבי מסלול כדי לראות סדר עצירות.
            </Typography>
          )}

          {routeSummary && (
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Typography sx={{ fontWeight: 700 }}>סיכום</Typography>
              <Typography sx={{ mt: 0.5 }}>
                זמן: {routeSummary.durationText}
              </Typography>
              <Typography>מרחק: {routeSummary.distanceText}</Typography>
            </Paper>
          )}

          {orderedStops.length >= 2 && (
            <>
              <Box
                sx={{ display: "flex", gap: 1.5, mb: 1 }}
                alignContent="center"
              >
                <Button
                  size="small"
                  onClick={clearRoute}
                  sx={{ flex: 0.3, py: 0.75 }}
                >
                  נקה
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={computeRoute}
                  disabled={routeIds.length < 2 || routeLoading}
                  sx={{ flex: 0.3, py: 0.75 }}
                >
                  חשב מחדש
                </Button>
              </Box>

              <List dense>
                {orderedStops.map((p, idx) => (
                  <ListItem key={p.id} alignItems="flex-start" sx={{ py: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
                        {idx + 1}
                      </Avatar>
                    </ListItemAvatar>

                    <MListItemText
                      primary={
                        <Typography sx={{ fontWeight: 700 }}>
                          {p.name}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" sx={{ opacity: 0.85 }}>
                            {formatAddress(p) || "כתובת לא זמינה"}
                          </Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            סטטוס: {statusLabel(p.status)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
