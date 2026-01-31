const express = require("express");
const fetch = require("node-fetch"); // v2

const app = express();
const PORT = process.env.PORT || 3003;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  throw new Error("Missing GOOGLE_MAPS_API_KEY env var");
}

// Change this to something that uniquely identifies your business
// const QUERY = "Smart Raccoons Design, Latvia";

// async function placesSearchText(text) {
//   const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       "X-Goog-Api-Key": API_KEY,
//       "X-Goog-FieldMask": "places.id,places.displayName,places.googleMapsUri"
//     },
//     body: JSON.stringify({ textQuery: text, maxResultCount: 1, languageCode: "lv" })
//   });

//   if (!res.ok) throw new Error(`searchText failed: ${res.status} ${await res.text()}`);
//   const data = await res.json();
//   if (!data.places?.length) throw new Error("No place found for query");
//   return data.places[0];
// }

async function placeDetails(placeId) {
  // Ask only for what you need (cheaper + faster)
  const fields = [
    "id",
    "displayName",
    "googleMapsUri",
    "rating",
    "userRatingCount",
    "reviews.rating",
    "reviews.relativePublishTimeDescription",
    "reviews.text",
    "reviews.originalText",
    "reviews.authorAttribution",
    "reviews.googleMapsUri"
  ].join(",");

  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=${encodeURIComponent(fields)}&languageCode=lv`, {
    headers: {
      "X-Goog-Api-Key": API_KEY
    }
  });

  if (!res.ok) throw new Error(`details failed: ${res.status} ${await res.text()}`);
  return await res.json();
}
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.get("/api/reviews", async (req, res) => {
  try {
    // const place = await placesSearchText(QUERY);
    const details = await placeDetails('ChIJ6yCSjUH1wUYRhJsJlO2x4iI');//place.id);

    const reviews = (details.reviews || [])
      .slice(0, 15)
      .map(r => ({
        author: r.authorAttribution.displayName || "Anonymous",
        rating: r.rating,
        relativeTime: r.relativePublishTimeDescription || "",
        text: r.text.text || "",
        originalText: r.originalText.text || "",
        authorAttribution: r.authorAttribution,
        googleMapsUri: r.googleMapsUri
      }));

    res.json({
      name: details.displayName.text || "Business",
      rating: details.rating,
      userRatingCount: details.userRatingCount,
      mapsUrl: details.googleMapsUri,
      reviews
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
