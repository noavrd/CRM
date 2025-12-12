// src/features/projects/ProjectsMapCard.tsx

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CircularProgress,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Stack,
} from "@mui/material";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_META,
  type ProjectStatus,
  statusLabel,
  PROJECT_STATUS_ORDER,
} from "@/lib/projectStatus";

// ---------- סוגים ----------

type ProjectMapItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  customer?: {
    name?: string;
    phone?: string;
    city?: string;
  };
  address: {
    lat: number;
    lng: number;
    city?: string;
    street?: string;
    number?: string;
    neighborhood?: string;
  };
  notes?: string;
  createdAt?: any;
};

type RawProject = any;

const containerStyle = {
  width: "100%",
  height: "100%",
};

const DEFAULT_CENTER = { lat: 31.771959, lng: 35.217018 };

const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

export default function ProjectsMapCard() {
  const [items, setItems] = useState<ProjectMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<ProjectStatus[]>([
    ...PROJECT_STATUS_ORDER,
  ]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasKey = Boolean(apiKey);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  // ---------- טעינת פרויקטים + מיפוי ----------

  const filteredItems = useMemo(() => {
    if (!selectedStatuses.length) return [];
    const allowed = new Set(selectedStatuses);
    return items.filter((p) => allowed.has(p.status));
  }, [items, selectedStatuses]);

  const isValidLatLng = (lat: any, lng: any) => {
    const la = Number(lat);
    const ln = Number(lng);
    return (
      Number.isFinite(la) &&
      Number.isFinite(ln) &&
      la >= -90 &&
      la <= 90 &&
      ln >= -180 &&
      ln <= 180
    );
  };

  const loadProjects = async () => {
    try {
      setLoading(true);

      const data = await api<RawProject[]>("/api/projects");
      const arr = Array.isArray(data) ? data : [];

      const withCoords: ProjectMapItem[] = arr
        .filter((p) => isValidLatLng(p?.address?.lat, p?.address?.lng))
        .map((p) => {
          const rawStatus =
            (p.status as ProjectStatus | undefined) ??
            (p.pipelineStatus as ProjectStatus | undefined);

          const status: ProjectStatus =
            rawStatus && PROJECT_STATUS_META[rawStatus] ? rawStatus : "quote";

          return {
            id: String(p.id),
            name: p.name ?? "ללא שם",
            status,
            customer: p.customer,
            address: {
              lat: Number(p.address.lat),
              lng: Number(p.address.lng),
              city: p.address.city,
              street: p.address.street,
              number: p.address.number,
              neighborhood: p.address.neighborhood,
            },
            notes: p.notes,
            createdAt: p.createdAt,
          };
        });

      setItems(withCoords);
      console.log("items for map", withCoords); // להשאיר לבינתיים לדיבאג
    } catch (e) {
      console.error("Failed loading projects map:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!map) return;
    if (!items.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    items.forEach((p) =>
      bounds.extend({ lat: p.address.lat, lng: p.address.lng })
    );
    map.fitBounds(bounds);

    if (items.length === 1) {
      map.setZoom(14);
    }
  }, [map, items]);

  useEffect(() => {
    loadProjects();
  }, []);

  // ריענון כשנורה אירוע גלובלי
  useEffect(() => {
    const handler = () => {
      loadProjects();
    };
    window.addEventListener("projects:changed", handler);
    return () => window.removeEventListener("projects:changed", handler);
  }, []);

  // ---------- מרכז מפה ----------

  const center = useMemo(() => {
    if (!items.length) return DEFAULT_CENTER;

    const lats = items
      .map((p) => p.address.lat)
      .filter((v) => !Number.isNaN(Number(v)));
    const lngs = items
      .map((p) => p.address.lng)
      .filter((v) => !Number.isNaN(Number(v)));

    if (!lats.length || !lngs.length) return DEFAULT_CENTER;

    const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const avgLng = lngs.reduce((s, v) => s + v, 0) / lngs.length;
    return { lat: avgLat, lng: avgLng };
  }, [items]);

  const zoom = items.length ? 11 : 7;

  const formatAddress = (p: ProjectMapItem) => {
    const a = p.address || {};
    const parts = [
      a.street && a.number ? `${a.street} ${a.number}` : a.street,
      a.city,
      a.neighborhood && `שכונת ${a.neighborhood}`,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // ---------- רינדור ----------

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHeader
        title="מפת פרויקטים"
        action={
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
              MenuProps={{
                PaperProps: {
                  sx: { maxWidth: 260 },
                },
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
                    }}
                    title={labels} // tooltip מלא בהובר
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
        }
      />

      <CardContent sx={{ flex: 1, p: 0, position: "relative" }}>
        {/* אין מפתח בכלל */}
        {!hasKey && (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 2,
            }}
          >
            <Typography color="text.secondary" align="center">
              לא הוגדר מפתח Google Maps (VITE_GOOGLE_MAPS_API_KEY).
            </Typography>
          </Box>
        )}

        {/* שגיאה בטעינת Maps */}
        {hasKey && loadError && (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              p: 2,
            }}
          >
            <Typography color="text.secondary" align="center">
              לא ניתן לטעון את מפות גוגל. בדקי את מפתח ה־API וההרשאות.
            </Typography>
          </Box>
        )}

        {/* טעינה */}
        {hasKey && !loadError && (!isLoaded || loading) && (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {/* מפה דינמית – גם אם אין פרויקטים */}
        {hasKey && isLoaded && !loadError && !loading && (
          <Box sx={{ width: "100%", height: "100%" }}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={DEFAULT_CENTER}
              zoom={zoom}
              onLoad={(m) => setMap(m)}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
              onClick={() => setInfoId(null)}
            >
              {filteredItems.map((p) => {
                const color = PROJECT_STATUS_META[p.status].color;

                return (
                  <MarkerF
                    key={p.id}
                    position={{
                      lat: p.address.lat,
                      lng: p.address.lng,
                    }}
                    title={`${p.name} – ${statusLabel(p.status)}`}
                    icon={{
                      path: PIN_PATH,
                      fillColor: color,
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 1.5,
                      scale: 1.4, // אפשר לשחק עם זה לגודל
                      anchor: new window.google.maps.Point(12, 24), // שהחוד יהיה על הנקודה
                    }}
                    onClick={() =>
                      setInfoId((cur) => (cur === p.id ? null : p.id))
                    }
                  />
                );
              })}

              {/* tooltip על hover */}
              {filteredItems.map((p) =>
                infoId === p.id ? (
                  <InfoWindowF
                    key={`info-${p.id}`}
                    position={{
                      lat: p.address.lat,
                      lng: p.address.lng,
                    }}
                    onCloseClick={() => setInfoId(null)}
                  >
                    <div style={{ direction: "rtl" }}>
                      <strong>{p.name}</strong>
                      <div>סטטוס: {statusLabel(p.status)}</div>
                      {p.customer?.name && <div>לקוח/ה: {p.customer.name}</div>}
                      {formatAddress(p) && <div>{formatAddress(p)}</div>}
                    </div>
                  </InfoWindowF>
                ) : null
              )}
            </GoogleMap>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
