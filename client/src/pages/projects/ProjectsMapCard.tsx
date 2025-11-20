import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { api } from "@/api/http";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { statusLabel } from "@/lib/projectStatus";

type ProjectMapItem = {
  id: string;
  name: string;
  status?: string; // נשתמש ב־statusLabel בצד הקליינט
  address?: {
    lat?: number;
    lng?: number;
    city?: string;
    street?: string;
    number?: string;
  };
};

const containerStyle = {
  width: "100%",
  height: "100%",
};

// מרכז ברירת מחדל – אמצע ישראל בערך
const DEFAULT_CENTER = { lat: 31.771959, lng: 35.217018 };

export default function ProjectsMapCard() {
  const [items, setItems] = useState<ProjectMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const hasKey = Boolean(apiKey);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey || "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api<any[]>("/api/projects");
        const arr = Array.isArray(data) ? data : [];

        // מסננים רק כאלה עם קואורדינטות, וממפים לסוג המצומצם שלנו
        const withCoords: ProjectMapItem[] = arr
          .filter((p) => {
            const lat = p.address?.lat;
            const lng = p.address?.lng;
            return (
              lat != null &&
              lng != null &&
              !Number.isNaN(Number(lat)) &&
              !Number.isNaN(Number(lng))
            );
          })
          .map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status ?? p.pipelineStatus,
            address: p.address,
          }));

        setItems(withCoords);
      } catch (e) {
        console.error("Failed loading projects map:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // חישוב מרכז מפה – ממוצע של ה־lat/lng או ברירת מחדל
  const center = useMemo(() => {
    if (!items.length) return DEFAULT_CENTER;

    const lats = items
      .map((p) => Number(p.address!.lat))
      .filter((v) => !Number.isNaN(v));
    const lngs = items
      .map((p) => Number(p.address!.lng))
      .filter((v) => !Number.isNaN(v));

    if (!lats.length || !lngs.length) return DEFAULT_CENTER;

    const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const avgLng = lngs.reduce((s, v) => s + v, 0) / lngs.length;
    return { lat: avgLat, lng: avgLng };
  }, [items]);

  // אם אין פרויקטים – זום יותר רחב
  const zoom = items.length ? 11 : 7;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <CardHeader title="מפת פרויקטים" />
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
              center={center}
              zoom={zoom}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
              }}
            >
              {items.map((p) =>
                p.address?.lat != null && p.address?.lng != null ? (
                  <MarkerF
                    key={p.id}
                    position={{
                      lat: Number(p.address.lat),
                      lng: Number(p.address.lng),
                    }}
                    title={p.name}
                    onMouseOver={() => setHoverId(p.id)}
                    onMouseOut={() =>
                      setHoverId((cur) => (cur === p.id ? null : cur))
                    }
                  />
                ) : null
              )}

              {/* בועת מידע על ה־hover */}
              {items.map((p) =>
                hoverId === p.id && p.address?.lat && p.address.lng ? (
                  <InfoWindowF
                    key={`info-${p.id}`}
                    position={{
                      lat: Number(p.address.lat),
                      lng: Number(p.address.lng),
                    }}
                    onCloseClick={() => setHoverId(null)}
                  >
                    <div style={{ direction: "rtl" }}>
                      <strong>{p.name}</strong>
                      {p.status && (
                        <div>סטטוס: {statusLabel(p.status as any)}</div>
                      )}
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
