import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { api } from "@/api/http";
import {
  PROJECT_STATUS_META,
  type ProjectStatus,
  statusLabel,
} from "@/lib/projectStatus";
import { useNavigate } from "react-router-dom";

export type ProjectMapItem = {
  id: string;
  name: string;
  status: ProjectStatus;
  customer?: { name?: string; phone?: string; city?: string };
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

const DEFAULT_CENTER = { lat: 31.771959, lng: 35.217018 };
const containerStyle = { width: "100%", height: "100%" };

const PIN_PATH =
  "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";

function isValidLatLng(lat: any, lng: any) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return false;
  if (la === 0 && ln === 0) return false;
  return true;
}

function formatAddress(p: ProjectMapItem) {
  const a = p.address || {};
  const parts = [
    a.street && a.number ? `${a.street} ${a.number}` : a.street,
    a.city,
    a.neighborhood && `שכונת ${a.neighborhood}`,
  ].filter(Boolean);
  return parts.join(", ");
}

type Props = {
  selectedStatuses: ProjectStatus[];
  height?: number | string;
  fitToFiltered?: boolean;

  onItemsLoaded?: (items: ProjectMapItem[]) => void;

  routeMode?: boolean;
  selectedRouteIds?: string[];
  onToggleRouteId?: (id: string) => void;
  directions?: google.maps.DirectionsResult | null;
};

export function ProjectsMap({
  selectedStatuses,
  height = "100%",
  fitToFiltered = true,
  routeMode = false,
  selectedRouteIds = [],
  onToggleRouteId,
  directions = null,
  onItemsLoaded,
}: Props) {
  const [items, setItems] = useState<ProjectMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoId, setInfoId] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasKey = Boolean(apiKey);

  const navigate = useNavigate();
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  const filteredItems = useMemo(() => {
    if (!selectedStatuses?.length) return [];
    const allowed = new Set(selectedStatuses);
    return items.filter((p) => allowed.has(p.status));
  }, [items, selectedStatuses]);

  const selectedSet = useMemo(
    () => new Set(selectedRouteIds),
    [selectedRouteIds]
  );

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
      onItemsLoaded?.(withCoords);
    } catch (e) {
      console.error("Failed loading projects map:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    const handler = () => loadProjects();
    window.addEventListener("projects:changed", handler);
    return () => window.removeEventListener("projects:changed", handler);
  }, []);

  //filter by fit bounds
  useEffect(() => {
    if (!map) return;

    const list = fitToFiltered ? filteredItems : items;
    if (!list.length) return;

    const bounds = new window.google.maps.LatLngBounds();
    list.forEach((p) =>
      bounds.extend({ lat: p.address.lat, lng: p.address.lng })
    );
    map.fitBounds(bounds);

    if (list.length === 1) map.setZoom(14);
  }, [map, items, filteredItems, fitToFiltered]);

  const zoom = items.length ? 11 : 7;

  const handleMarkerClick = (id: string) => {
    if (routeMode) {
      onToggleRouteId?.(id);
      return;
    }
    setInfoId((cur) => (cur === id ? null : id));
  };

  return (
    <Box sx={{ width: "100%", height }}>
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

      {hasKey && isLoaded && !loadError && !loading && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={DEFAULT_CENTER}
          zoom={zoom}
          onLoad={(m) => setMap(m)}
          options={{
            fullscreenControl: true,
            streetViewControl: false,
            mapTypeControl: false,
          }}
          onClick={() => setInfoId(null)}
        >
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
              }}
            />
          )}

          {filteredItems.map((p) => {
            const color = PROJECT_STATUS_META[p.status].color;
            const isSelected = selectedSet.has(p.id);

            return (
              <MarkerF
                key={p.id}
                position={{ lat: p.address.lat, lng: p.address.lng }}
                title={`${p.name} – ${statusLabel(p.status)}`}
                icon={{
                  path: PIN_PATH,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeColor: isSelected ? "#000000" : "#ffffff",
                  strokeWeight: isSelected ? 2.5 : 1.5,
                  scale: isSelected ? 1.7 : 1.4,
                  anchor: new window.google.maps.Point(12, 24),
                }}
                onClick={() => handleMarkerClick(p.id)}
              />
            );
          })}

          {!routeMode &&
            filteredItems.map((p) =>
              infoId === p.id ? (
                <InfoWindowF
                  key={`info-${p.id}`}
                  position={{ lat: p.address.lat, lng: p.address.lng }}
                  onCloseClick={() => setInfoId(null)}
                >
                  <div style={{ direction: "rtl" }}>
                    <strong>{p.name}</strong>
                    <div>סטטוס: {statusLabel(p.status)}</div>
                    {p.customer?.name && <div>לקוח/ה: {p.customer.name}</div>}
                    {formatAddress(p) && <div>{formatAddress(p)}</div>}
                    <a
                      href={`/projects/${p.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/projects/${p.id}`);
                      }}
                      style={{ display: "inline-block", marginTop: 8 }}
                    >
                      פרטים מלאים
                    </a>
                  </div>
                </InfoWindowF>
              ) : null
            )}
        </GoogleMap>
      )}
    </Box>
  );
}
