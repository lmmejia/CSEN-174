'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import locations from '../data/geocoded.json';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { BookmarkManager } from './bookmarks';
import '../styles/map.css';

const SCU_CENTER = [37.3496, -121.9390];
const PIN_IMAGES = {
    food: '/food-icon.png',
    coffee: '/coffee-icon.png',
    shopping: '/shopping-icon.png',
    activity: '/activity-icon.png',
    default: '/bookmark-icon.png',
}
const bookmarkManager = new BookmarkManager();

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function buildPopupHtml(location, bookmarked) {
    const label = bookmarked ? 'Remove from Bookmarks' : 'Save to Bookmarks';
    return `
        <div>
            <strong>${escapeHtml(location.name)}</strong>
            <br />
            <button type="button" class="bookmark-btn">${label}</button>
            <p class="bookmark-msg"></p>
        </div>
    `;
}

export default function MapPage() {
    const containerRef = useRef(null);
    const bookmarksRef = useRef([]);
    const userIdRef = useRef(null);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedTransport, setSelectedTransport] = useState([]);
    const [selectedPrices, setSelectedPrices] = useState([]);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [bookmarks, setBookmarks] = useState([]);
    const [userId, setUserId] = useState(null);

    const filteredPlaces = useMemo(() => {
        return locations.filter((location) => {
        const matchesBookmarks =
            !showBookmarksOnly ||
            bookmarkManager.isBookmarked(bookmarks, location.name);

        const matchesCategory = showBookmarksOnly
            ? selectedTags.length === 0 ||
              location.categories.some((category) =>
                selectedTags.includes(category)
              )
            : selectedTags.length > 0 &&
              location.categories.some((category) =>
                selectedTags.includes(category)
              );

        const matchesTransport =
            selectedTransport.length === 0 ||
            selectedTransport.includes(location.transport);

        const matchesPrice =
            selectedPrices.length === 0 ||
            selectedPrices.includes(location.price);

        return matchesBookmarks && matchesCategory && matchesTransport && matchesPrice;
        });    
    }, [selectedTags, selectedTransport, selectedPrices, showBookmarksOnly, bookmarks]);

    useEffect(() => {
        bookmarksRef.current = bookmarks;
    }, [bookmarks]);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    useEffect(() => {
        let unsubSnapshot = null;

        const unsubAuth = auth.onAuthStateChanged((user) => {
            if (unsubSnapshot) {
                unsubSnapshot();
                unsubSnapshot = null;
            }

            if (!user) {
                setUserId(null);
                setBookmarks([]);
                return;
            }

            setUserId(user.uid);
            unsubSnapshot = onSnapshot(doc(db, 'users', user.uid), (snap) => {
                setBookmarks(snap.data()?.bookmarks || []);
            });
        });

        return () => {
            unsubAuth();
            if (unsubSnapshot) unsubSnapshot();
        };
    }, []);

    useEffect(() => {
        let map;
        let cancelled = false;

        (async () => {
        const L = (await import('leaflet')).default;

        const icons = {};
        Object.entries(PIN_IMAGES).forEach(([key, url]) => {
            icons[key] = L.icon({
                iconUrl: url,
                shadowUrl: '/marker-shadow.png',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32], 
                shadowSize: [41, 41],
            });
        });

        if (cancelled || !containerRef.current) return;

        map = L.map(containerRef.current).setView(SCU_CENTER, 15);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        
        filteredPlaces.forEach((location) => {
            const tag = selectedTags.find((t) => location.categories.includes(t));
            const icon = icons[tag] || icons.default;
            
            const marker = L.marker([location.lat, location.lng], { icon })
            .addTo(map)
            .bindPopup(buildPopupHtml(location, false));

            marker.on('popupopen', () => {
                const bookmarked = bookmarkManager.isBookmarked(
                    bookmarksRef.current,
                    location.name
                );
                marker.setPopupContent(buildPopupHtml(location, bookmarked));

                const popupEl = marker.getPopup()?.getElement();
                const btn = popupEl?.querySelector('.bookmark-btn');
                const msgEl = popupEl?.querySelector('.bookmark-msg');
                if (!btn) return;

                btn.onclick = async () => {
                    if (msgEl) msgEl.textContent = '';

                    const uid = userIdRef.current;
                    if (!uid) {
                        if (msgEl) msgEl.textContent = 'Log in to save bookmarks';
                        return;
                    }

                    try {
                        const currentlyBookmarked = bookmarkManager.isBookmarked(
                            bookmarksRef.current,
                            location.name
                        );

                        if (currentlyBookmarked) {
                            const next = bookmarkManager.removeBookmark(
                                bookmarksRef.current,
                                location.name
                            );
                            bookmarksRef.current = next;
                            setBookmarks(next);
                            await updateDoc(doc(db, 'users', uid), {
                                bookmarks: arrayRemove(location.name),
                            });
                            btn.textContent = 'Save to Bookmarks';
                            if (msgEl) msgEl.textContent = 'Removed from bookmarks';
                        } else {
                            const next = bookmarkManager.addBookmark(
                                bookmarksRef.current,
                                location.name
                            );
                            bookmarksRef.current = next;
                            setBookmarks(next);
                            await updateDoc(doc(db, 'users', uid), {
                                bookmarks: arrayUnion(location.name),
                            });
                            btn.textContent = 'Remove from Bookmarks';
                            if (msgEl) msgEl.textContent = 'Saved to bookmarks';
                        }
                    } catch (error) {
                        if (msgEl) msgEl.textContent = error.message;
                    }
                };
            });
        });

        })();

        return () => {
        cancelled = true;
        if (map) map.remove();
        };
    }, [filteredPlaces]);

return (
    <main className="map-page">
        <header className="map-header">
            <h1>Find a place to Scurry</h1>
            <p>click a pin to bookmark a hangout spot</p>
        </header>

        <div className="map-content">
            <div ref={containerRef} className="map-container" />

            <aside className="map-panel">
            <div className="filter-buttons">
                <h2>Categories</h2>
                {['food', 'coffee', 'shopping', 'activity'].map((tag) => (
                <button
                    key={tag}
                    className={selectedTags.includes(tag) ? 'filter-btn active' : 'filter-btn'}
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
                <button 
                    className={showBookmarksOnly ? 'filter-btn active' : 'filter-btn'}
                    onClick={() => setShowBookmarksOnly((prev) => !prev)}>
                bookmarks
                </button>
            </div>

            <div className="filter-group">
                <h2>Filters</h2>
                <p>Once picked a category, apply these filters!</p>
                <h3>Transportation</h3>
                <div className="filter-buttons">
                {['walking', 'car'].map((transport) => (
                    <button
                    key={transport}
                    className={selectedTransport.includes(transport) ? 'filter-btn active' : 'filter-btn'}
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
                </div>
            </div>

            <div className="filter-group">
                <h3>Price</h3>
                <div className="filter-buttons">
                {['$', '$$', '$$$'].map((price) => (
                    <button
                    key={price}
                    className={selectedPrices.includes(price) ? 'filter-btn active' : 'filter-btn'}
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
            </div>
            </aside>
        </div>
    </main>
    );
}
