'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import locations from '../data/geocoded.json';
import { auth, db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { BookmarkManager } from './bookmarks';

const SCU_CENTER = [37.3496, -121.9390];
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

        const markerIcon = L.icon({
        iconUrl: '/marker-icon.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [32, 32],
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
            const marker = L.marker([location.lat, location.lng], { icon: markerIcon })
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
        <button
            onClick={() => setShowBookmarksOnly((prev) => !prev)}
        >
            bookmarks
        </button>
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
