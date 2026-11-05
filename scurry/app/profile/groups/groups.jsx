"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";

// characters used to build an invite code like SCURRY-8F2K
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// make one random code: "SCURRY-" plus 4 characters
function randomCode() {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return `SCURRY-${suffix}`;
}

// keep generating until the code is not already used by another group
async function generateUniqueCode() {
  while (true) {
    const code = randomCode();
    const snap = await getDocs(query(collection(db, "groups"), where("code", "==", code)));
    if (snap.empty) return code;
  }
}

export default function Groups({ onClose }) {
  const [groups, setGroups] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubSnapshot = null; // Initialize unsubSnapshot to null

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubSnapshot) {
        unsubSnapshot(); // Unsubscribe from the previous snapshot listener
      }
      if (!user) {
        setGroups([]);
        return;
      }

      // live updates: runs again whenever a group this user is in changes
      unsubSnapshot = onSnapshot(
        query(collection(db, "groups"), where("members", "array-contains", user.uid)),
        (snap) => {
          setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  async function handleJoin() {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      const code = inviteCode.trim().toUpperCase();
      if (!code) {
        setError("Invite code cannot be empty");
        return;
      }

      // Check if the invite code exists
      const snap = await getDocs(query(collection(db, "groups"), where("code", "==", code)));
      if (snap.empty) {
        setError("Invite code does not exist");
        return;
      }

      const groupDoc = snap.docs[0];
      const members = groupDoc.data().members || [];

      // Prevent joining a group you are already in
      if (members.includes(myUid)) {
        setError("Already in this group");
        return;
      }

      // Add this user to the group's members array
      await updateDoc(doc(db, "groups", groupDoc.id), {
        members: arrayUnion(myUid),
      });
      setInviteCode("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreate() {
    setError("");
    setCreatedCode("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      const name = groupName.trim();
      if (!name) {
        setError("Group name cannot be empty");
        return;
      }

      // Save a new group with a fresh invite code; creator starts as the only member
      const code = await generateUniqueCode();
      await addDoc(collection(db, "groups"), {
        name,
        code,
        creatorId: myUid,
        members: [myUid],
        createdAt: serverTimestamp(),
      });

      // Show the code so it can be shared
      setCreatedCode(code);
      setGroupName("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Add to Scurry</h1>
      <p>Join a crew or start your own</p>

      <h2>Join a group</h2>
      <input
        value={inviteCode}
        onChange={(e) => setInviteCode(e.target.value)}
        placeholder="Enter invite code"
      />
      <button onClick={handleJoin}>JOIN GROUP</button>

      <p>or</p>

      <h2>Create a group</h2>
      <input
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        placeholder="Give your group a name"
      />
      <button onClick={handleCreate}>CREATE GROUP</button>

      {/* only show the share box after a group is created */}
      {createdCode && (
        <div>
          <h2>Share your invite code</h2>
          <p>{createdCode}</p>
          <p>Share this code with friends to grow your crew.</p>
        </div>
      )}

      <h2>Your groups</h2>
      {groups.length === 0 ? (
        <p>none</p>
      ) : (
        <ul>
          {groups.map((g) => (
            <li key={g.id}>
              {g.name} — {g.code}
            </li>
          ))}
        </ul>
      )}

      {error && <p>{error}</p>}
      <button onClick={onClose}>close</button>
    </div>
  );
}
