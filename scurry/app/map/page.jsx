'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import locations from '../data/geocoded.json';

const SCU_CENTER = [37.3496, -121.9390];

export default function MapPage() {
    const containerRef = useRef(null);

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

        
        locations.forEach((location) => {
            L.marker([location.lat, location.lng], { icon: markerIcon })
            .addTo(map)
            .bindPopup(location.name);
        });

        })();

        return () => {
        cancelled = true;
        if (map) map.remove();
        };
    }, []);

    return (
        <div
        ref={containerRef}
        style={{ height: '100vh', width: '100%' }}
        />
    );
}
