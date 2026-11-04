'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import locations from '../data/geocoded.json';

const SCU_CENTER = [37.3496, -121.9390];

export default function MapPage() {
    const containerRef = useRef(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedTransport, setSelectedTransport] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);

    const filteredPlaces = useMemo(() => {
        return locations.filter((location) => {
        const matchesCategory =
            selectedTags.length > 0 &&
            location.categories.some((category) =>
                selectedTags.includes(category)
            );

        const matchesTransport =
            selectedTransport.length === 0 ||
            selectedTransport.includes(location.transport);

        const matchesPrice =
            selectedPrices.length === 0 ||
            selectedPrices.includes(location.price);

        return matchesCategory && matchesTransport && matchesPrice;
        });    
    }, [selectedTags, selectedTransport, selectedPrices]);


    useEffect(() => {
        let map;
        let cancelled = false;

        (async () => {
        const L = (await import('leaflet')).default;

        const markerIcon = L.icon({
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        });

        if (cancelled || !containerRef.current) return;

        map = L.map(containerRef.current).setView(SCU_CENTER, 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        
        filteredPlaces.forEach((location) => {
            L.marker([location.lat, location.lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(location.name);
        });

        })();

        return () => {
        cancelled = true;
        if (map) map.remove();
        };
    }, [filteredPlaces]);

    return (
        <div>
        <div>
        {['food', 'coffee', 'shopping', 'activity'].map((tag) => (
            <button key={tag}
            onClick={() =>
                setSelectedTags((prev) =>
                prev.includes(tag)
                    ? prev.filter((t) => t !== tag)
                    : [...prev, tag]
                )
            }
            >
            {tag}
            </button>
        ))}
        </div>

        <div>
            <h3>Transportation</h3>

            {['walking', 'car'].map((transport) => (
                <button
                key={transport}
                onClick={() =>
                    setSelectedTransport((prev) =>
                    prev.includes(transport)
                        ? prev.filter((t) => t !== transport)
                        : [...prev, transport]
                    )
                }
                >
                {transport}
                </button>
            ))}

            <h3>Price</h3>

            {["$", "$$", "$$$"].map((price) => (
                <button
                key={price}
                onClick={() =>
                    setSelectedPrices((prev) =>
                    prev.includes(price)
                        ? prev.filter((p) => p !== price)
                        : [...prev, price]
                    )
                }
                >
                {price}
                </button>
            ))}
        </div>

        <div
        ref={containerRef}
        style={{ height: '100vh', width: '100%' }}
        />
        </div>
    );
}
