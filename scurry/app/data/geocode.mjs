 import fs from "node:fs/promises";

const filePath = "app/data/geocoded.json";

// Locations that Nominatim couldn't find by name
const places = [
  {
    name: "Shawarmaji",
    address: "2281 The Alameda, Santa Clara, CA 95050"
  },
  {
    name: "Caffe:Inn",
    address: "2421 The Alameda #101, Santa Clara, CA 95050"
  },
  {
    name: "TOGOS",
    address: "1000 Lafayette St, Santa Clara, CA 95050"
  },
  {
    name: "Card Shop Santa Clara",
    address: "1171 Homestead Rd, Santa Clara, CA 95050"
  },
  {
    name: "Gamer's Heaven",
    address: "1171 Homestead Rd, Santa Clara, CA 95050"
  },
  {
    name: "Ike's Sandwiches",
    address: "2235 The Alameda, Santa Clara, CA 95050"
  },
  {
    name: "Westfield Valley Fair",
    address: "2855 Stevens Creek Blvd, Santa Clara, CA 95050"
  },
  {
    name: "7 Leaves Cafe",
    address: "375 Saratoga Ave, San Jose, CA 95129"
  },
  {
    name: "Su's Mongolian BBQ",
    address: "1111 El Camino Real, Santa Clara, CA 95050"
  }
];

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Load existing locations
let results = [];

try {
  const file = await fs.readFile(filePath, "utf8");
  results = JSON.parse(file);

  console.log(`Loaded ${results.length} existing locations`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;

  console.log("No existing file found. Starting fresh.");
}

// Search for missing locations
for (const place of places) {

  // Skip locations already saved
  const exists = results.some(
    location => location.name === place.name
  );

  if (exists) {
    console.log(`Skipping existing: ${place.name}`);
    continue;
  }

  const url = new URL(
    "https://nominatim.openstreetmap.org/search"
  );

  url.searchParams.set("q", place.address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "ScurryStudentProject/1.0 (lmmejia@scu.edu)"
    }
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.length > 0) {
    results.push({
      name: place.name,
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      address: place.address
    });

    // Save without deleting existing locations
    await fs.writeFile(
      filePath,
      JSON.stringify(results, null, 2)
    );

    console.log(`Added: ${place.name}`);

  } else {
    console.log(`Not found: ${place.name}`);
  }

  // Wait between requests
  await sleep(1500);
}

console.log("Finished!");
