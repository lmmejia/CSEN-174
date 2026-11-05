"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { BookmarkManager } from "../map/bookmarks";

const bookmarkManager = new BookmarkManager();

export default function Bookmarks({ onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");

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
      unsubSnapshot = onSnapshot(doc(db, "users", user.uid), (snap) => {
        setBookmarks(snap.data()?.bookmarks || []);
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  async function handleRemove(placeName) {
    setError("");
    try {
      if (!userId) {
        setError("Log in first");
        return;
      }

      bookmarkManager.removeBookmark(bookmarks, placeName);
      await updateDoc(doc(db, "users", userId), {
        bookmarks: arrayRemove(placeName),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Bookmarks</h2>
      <button onClick={onClose}>Close</button>

      {error && <p>{error}</p>}

      {bookmarks.length === 0 ? (
        <p>No bookmarked places yet.</p>
      ) : (
        <ul>
          {bookmarks.map((placeName) => (
            <li key={placeName}>
              {placeName}{" "}
              <button onClick={() => handleRemove(placeName)}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
