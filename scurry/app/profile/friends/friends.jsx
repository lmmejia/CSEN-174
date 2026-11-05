'use client';
import { useState, useEffect} from "react";
import { auth, db } from "../../../lib/firebase";
import {
  doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, getDocs,
} from "firebase/firestore";

export default function Friends({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [friendCode, setFriendCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubSnapshot = null; // Initialize unsubSnapshot to null

    const unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (unsubSnapshot) {
        unsubSnapshot(); // Unsubscribe from the previous snapshot listener
      }
      const u = user;
      if (!u) return;

      // live updates: runs again whenever your friends array changes
      unsubSnapshot = onSnapshot(doc(db, "users", u.uid), async (snap) => {
        const ids = snap.data()?.friends || [];
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
        setFriends(
          docs
            .filter((d) => d.exists())
            .map((d) => ({ id: d.id, name: `${d.data().firstName} ${d.data().lastName}` }))
        );
      });
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);


  async function handleAdd() {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      const code = friendCode.trim();
      if (!code) {
        setError("Friend code cannot be empty");
        return;
      }

      // Check if the friend code exists
      const snap = await getDocs(query(collection(db, "users"), where("friendCode", "==", code)));
      if (snap.empty) {
        setError("Friend code does not exist");
        return;
      }

      const friendDoc = snap.docs[0];
      const friendUid = friendDoc.id;

      // Prevent adding yourself as a friend
      if (friendUid === myUid) {
        setError("Cannot add yourself as a friend");
        return;
      }

      // Check if already friends
      const myDoc = await getDoc(doc(db, "users", myUid));
      const myFriends = myDoc.data()?.friends || [];
      if (myFriends.includes(friendUid)) {
        setError("User is already a friend");
        return;
      }

      // Add friend to both users' friends arrays
      await updateDoc(doc(db, "users", myUid), {
        friends: arrayUnion(friendUid),
      });
      await updateDoc(doc(db, "users", friendUid), {
        friends: arrayUnion(myUid),
      });
      setFriendCode("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(friendUid) {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      // Remove this person from both users' friends arrays
      await updateDoc(doc(db, "users", myUid), {
        friends: arrayRemove(friendUid),
      });
      await updateDoc(doc(db, "users", friendUid), {
        friends: arrayRemove(myUid),
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Add a Friend</h1>
      {friends.length === 0 ? (
        <p>none :c</p>
      ) : (
        <ul>
          {friends.map((f) => (
            <li key={f.id}>
              {f.name} <button onClick={() => handleRemove(f.id)}>remove</button>
            </li>
          ))}
        </ul>
      )}

      <input
        value={friendCode}
        onChange={(e) => setFriendCode(e.target.value)}
        placeholder="enter friend code"
      />
      <button onClick={handleAdd}>add</button>
      {error && <p>{error}</p>}

      <button onClick={onClose}>close</button>
    </div>
  );
}