'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { locations } from '../data/locations';

const SCU_CENTER = [37.3496, -121.9390];

export default function MapPage() {
const containerRef = useRef(null);

useEffect(() => {
    let map;
    let cancelled = false;

    (async () => {
    const L = (await import('leaflet')).default;

    if (cancelled || !containerRef.current) return;

    map = L.map(containerRef.current).setView(SCU_CENTER, 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Add a marker for Santa Clara University
    L.marker(SCU_CENTER)
        .addTo(map)
        .bindPopup('Santa Clara University 🐿️');

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
