import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_API_KEY) {
  console.warn("⚠️ Missing GOOGLE_MAPS_API_KEY env – Google Places won't work");
}

/** שולף עיר/רחוב/מספר מה address_components */
function pickAddressFromComponents(components: any[]) {
  const get = (type: string) =>
    components.find((c) => c.types?.includes(type))?.long_name ?? "";

  const city =
    get("locality") ||
    get("administrative_area_level_2") ||
    get("administrative_area_level_1") ||
    "";
  const street = get("route") || "";
  const houseNumber = get("street_number") || "";

  return { city, street, houseNumber };
}

/**
 * GET /api/places/autocomplete?q=...
 * מחזיר הצעות כתובת (עיר+רחוב+מספר) בישראל בלבד
 */
router.get("/autocomplete", async (req, res) => {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    if (!q || q.length < 3) {
      return res.json([]);
    }

    if (!GOOGLE_API_KEY) {
      return res
        .status(500)
        .json({ error: "GOOGLE_MAPS_API_KEY not configured" });
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", q);
    url.searchParams.set("key", GOOGLE_API_KEY);
    url.searchParams.set("language", "he");
    url.searchParams.set("components", "country:il");
    url.searchParams.set("types", "address");

    const resp = await fetch(url.toString());
    const data = (await resp.json()) as any;

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places autocomplete error:", data);
      return res.status(500).json({ error: "places autocomplete failed" });
    }

    const items = (data.predictions ?? []).map((p: any) => ({
      placeId: p.place_id as string,
      description: p.description as string,
      mainText: p.structured_formatting?.main_text ?? "",
      secondaryText: p.structured_formatting?.secondary_text ?? "",
    }));

    res.json(items);
  } catch (e: any) {
    console.error("autocomplete error:", e);
    res.status(500).json({ error: e.message ?? "autocomplete error" });
  }
});

/**
 * GET /api/places/details?placeId=...
 * מחזיר כתובת מפורקת + קואורדינטות
 */
router.get("/details", async (req, res) => {
  try {
    const placeId = req.query.placeId as string | undefined;
    if (!placeId) return res.status(400).json({ error: "placeId is required" });

    if (!GOOGLE_API_KEY) {
      return res
        .status(500)
        .json({ error: "GOOGLE_MAPS_API_KEY not configured" });
    }

    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", GOOGLE_API_KEY);
    url.searchParams.set("language", "he");
    url.searchParams.set(
      "fields",
      "formatted_address,address_component,geometry"
    );

    const resp = await fetch(url.toString());
    const data = (await resp.json()) as any;

    if (data.status !== "OK") {
      console.error("Places details error:", data);
      return res.status(500).json({ error: "place details failed" });
    }

    const result = data.result;
    const components = result.address_components ?? [];
    const { city, street, houseNumber } = pickAddressFromComponents(components);
    const location = result.geometry?.location ?? {};

    res.json({
      placeId,
      formattedAddress: result.formatted_address as string,
      city,
      street,
      houseNumber,
      lat: location.lat,
      lng: location.lng,
    });
  } catch (e: any) {
    console.error("details error:", e);
    res.status(500).json({ error: e.message ?? "details error" });
  }
});

export default router;
