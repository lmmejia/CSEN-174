"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  doc,
  getDoc,
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
  const [names, setNames] = useState({});
  const [uid, setUid] = useState(null);
  const [inviteCode, setInviteCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [createdCode, setCreatedCode] = useState("");
  const [addCodes, setAddCodes] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubSnapshot = null; // Initialize unsubSnapshot to null

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubSnapshot) {
        unsubSnapshot(); // Unsubscribe from the previous snapshot listener
      }
      if (!user) {
        setUid(null);
        setGroups([]);
        setNames({});
        return;
      }

      setUid(user.uid);

      // live updates: runs again whenever a group this user is in changes
      unsubSnapshot = onSnapshot(
        query(collection(db, "groups"), where("members", "array-contains", user.uid)),
        async (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setGroups(list);

          // look up a display name for each member
          const ids = [...new Set(list.flatMap((g) => g.members || []))];
          const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
          const next = {};
          docs.forEach((d) => {
            if (d.exists()) {
              next[d.id] = `${d.data().firstName} ${d.data().lastName}`;
            }
          });
          setNames(next);
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

  async function handleAddMember(group) {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      // only the lead can add people
      if (group.creatorId !== myUid) {
        setError("Only the group creator can add members");
        return;
      }

      const code = (addCodes[group.id] || "").trim();
      if (!code) {
        setError("Friend code cannot be empty");
        return;
      }

      // find the person by the friend code on their account
      const snap = await getDocs(query(collection(db, "users"), where("friendCode", "==", code)));
      if (snap.empty) {
        setError("Friend code does not exist");
        return;
      }

      const memberId = snap.docs[0].id;
      if (memberId === myUid) {
        setError("Cannot add yourself");
        return;
      }
      if ((group.members || []).includes(memberId)) {
        setError("Already in this group");
        return;
      }

      await updateDoc(doc(db, "groups", group.id), {
        members: arrayUnion(memberId),
      });
      setAddCodes((prev) => ({ ...prev, [group.id]: "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemoveMember(group, memberId) {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      // only the lead can remove people, and the lead stays in the group
      if (group.creatorId !== myUid) {
        setError("Only the group creator can remove members");
        return;
      }
      if (memberId === group.creatorId) {
        setError("The group creator cannot be removed");
        return;
      }

      await updateDoc(doc(db, "groups", group.id), {
        members: arrayRemove(memberId),
      });
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
          {groups.map((g) => {
            const isLead = g.creatorId === uid;
            return (
              <li key={g.id}>
                <p>
                  {g.name} — {g.code}
                  {isLead ? " (you are the lead)" : ""}
                </p>
                <ul>
                  {(g.members || []).map((id) => (
                    <li key={id}>
                      {names[id] || "member"}
                      {id === g.creatorId ? " (lead)" : ""}
                      {isLead && id !== g.creatorId && (
                        <button onClick={() => handleRemoveMember(g, id)}>remove</button>
                      )}
                    </li>
                  ))}
                </ul>
                {isLead && (
                  <div>
                    <input
                      value={addCodes[g.id] || ""}
                      onChange={(e) =>
                        setAddCodes((prev) => ({ ...prev, [g.id]: e.target.value }))
                      }
                      placeholder="enter friend code"
                    />
                    <button onClick={() => handleAddMember(g)}>add</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p>{error}</p>}
      <button onClick={onClose}>close</button>
    </div>
  );
}
