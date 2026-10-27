    import fs from "node:fs/promises";

    const places = [
    "Ramen Taka, Santa Clara, California",
    "Voyager Craft Coffee, Santa Clara, California",
    "Starbucks, Santa Clara, California"
    ];

    const results = [];
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const place of places) {
    const url = new URL("https://nominatim.openstreetmap.org/search");

    url.searchParams.set("q", place);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
        headers: {
        // Replace with your own contact email
        "User-Agent": "ScurryStudentProject/1.0 (lmmejia@scu.edu)"
        }
    });

    if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.length > 0) {
        results.push({
        name: place,
        lat: Number(data[0].lat),
        lng: Number(data[0].lon),
        address: data[0].display_name
        });

        console.log("Found:", place);
    } else {
        console.log("Not found:", place);
    }

    // Save progress so completed searches are not lost
    await fs.mkdir("app/data", { recursive: true });
    await fs.writeFile(
        "app/data/geocoded.json",
        JSON.stringify(results, null, 2)
    );

    // Stay below the public API rate limit
    await sleep(1500);
    }

    console.log("Finished!");

