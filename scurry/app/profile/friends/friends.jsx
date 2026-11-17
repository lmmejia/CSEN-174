'use client';
import { useState, useEffect } from "react";
import { auth, db } from "../../../lib/firebase";
import {
  doc, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, getDocs, serverTimestamp
} from "firebase/firestore";
import { avatars } from "../../signup/profilepics";

function personFromUser(userDoc, uid) {
  const data = userDoc.data() || {};
  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  return {
    uid,
    name: userDoc.exists() && name ? name : "Unknown",
    avatar: data.avatar,
  };
}

export default function Friends({ onClose }) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friendCode, setFriendCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    let unsubFriends = null;
    let unsubRequests = null;
    let unsubOutgoing = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubFriends) {
        unsubFriends();
      }
      if (unsubRequests) {
        unsubRequests();
      }
      if (unsubOutgoing) {
        unsubOutgoing();
      }
      if (!user) {
        setFriends([]);
        setRequests([]);
        setOutgoing([]);
        return;
      }

      // live updates: runs again whenever your friends array changes
      unsubFriends = onSnapshot(doc(db, "users", user.uid), async (snap) => {
        const ids = snap.data()?.friends || [];
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
        setFriends(
          docs
            .filter((d) => d.exists())
            .map((d) => ({ id: d.id, name: `${d.data().firstName} ${d.data().lastName}` }))
        );
      });

    //live updated (incoming friend requests)
    unsubRequests = onSnapshot(
      query(collection(db, "friendRequests"), where("toUid", "==",user.uid)),
      async (snap) => {
        const list = await Promise.all(snap.docs.map(async (d) => {
          const fromUid = d.data().fromUid;
          const userDoc = await getDoc(doc(db, "users", fromUid));
          return { id: d.id, fromUid, ...personFromUser(userDoc, fromUid) };
        }));
        setRequests(list);
      }
    );

    unsubOutgoing = onSnapshot(
      query(collection(db, "friendRequests"), where("fromUid", "==", user.uid)),
      async (snap) => {
        const list = await Promise.all(snap.docs.map(async (d) => {
          const toUid = d.data().toUid;
          const userDoc = await getDoc(doc(db, "users", toUid));
          return { id: d.id, toUid, ...personFromUser(userDoc, toUid) };
        }));
        setOutgoing(list);
      }
    );
  });
    return () => {
      unsubAuth();
      if (unsubFriends) unsubFriends();
      if (unsubRequests) unsubRequests();
      if (unsubOutgoing) unsubOutgoing();
    };
  }, []);


  async function handleSendRequest() {
    setError("");
    setInfo("");
    try {
      const myUid = auth.currentUser?.uid;
      if(!myUid) {
        setError("Log in first");
        return;
      }
      const myDoc = await getDoc(doc(db, "users", myUid));
      const code = friendCode.trim();
      if(!code) {
        setError("Enter a friend code");
        return;
      }
      const snap = await getDocs(query(collection(db, "users"), where("friendCode", "==", code)));
      if(snap.empty) {
        setError("No user found with that friend code");
        return;
      }
      const friendUid = snap.docs[0].id;
      if (friendUid === myUid) {
        setError("You cannot add yourself as a friend");
        return;
      }

      //check for already friends
      if((myDoc.data()?.friends || []).includes(friendUid)) {
        setError("User is already a friend");
        return;
      }

      //check if request already sent to you: accept it
      const incoming = await getDoc(doc(db, "friendRequests", `${friendUid}_${myUid}`));
      if(incoming.exists()) {
        setError("Friend request already sent to you. Accept it below");
        return;
      }

      //you already sent a request to them
      const outgoing = await getDoc(doc(db, "friendRequests", `${myUid}_${friendUid}`));
      if(outgoing.exists()) {
        setError("You already sent a friend request to this user");
        return;
      }
      
      await setDoc(doc(db, "friendRequests", `${myUid}_${friendUid}`), {
        fromUid: myUid,
        toUid: friendUid,
        timestamp: serverTimestamp(),
      });
      setFriendCode("");
      setInfo("Friend request sent!");
    }catch(err) {
      setError(err.message);
    }
  }

  async function handleAccept(req) {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }
      // Add the user to your friends list
      await updateDoc(doc(db, "users", myUid), {
        friends: arrayUnion(req.fromUid),
      });

      // Add you to their friends list
      await updateDoc(doc(db, "users", req.fromUid), {
        friends: arrayUnion(myUid),
      });
      // Remove the friend request
      await deleteDoc(doc(db, "friendRequests", req.id));

    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDecline(req) {
    setError("");
    try {
      const myUid = auth.currentUser?.uid;
      if (!myUid) {
        setError("Log in first");
        return;
      }

      // Remove the friend request
      await deleteDoc(doc(db, "friendRequests", req.id));
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
      <h2 className="profile-subhead">Incoming</h2>
      {requests.length === 0 ? (
        <p className="profile-empty-card">No incoming requests.</p>
      ) : (
        <ul className="profile-rows">
          {requests.map((r) => {
            const requestAvatar = avatars.find((item) => item.id === r.avatar) || avatars[0];
            return (
              <li key={r.id} className="profile-row">
                <img className="profile-avatar" src={requestAvatar.src} alt="" />
                <div className="profile-person">
                  <p className="profile-name">{r.name}</p>
                </div>
                <div className="profile-row-actions">
                  <button className="profile-mini" type="button" onClick={() => handleAccept(r)}>accept</button>
                  <button className="profile-mini profile-mini-ghost" type="button" onClick={() => handleDecline(r)}>decline</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="profile-subhead">Sent</h2>
      {outgoing.length === 0 ? (
        <p className="profile-empty-card">No sent requests.</p>
      ) : (
        <ul className="profile-rows">
          {outgoing.map((r) => {
            const requestAvatar = avatars.find((item) => item.id === r.avatar) || avatars[0];
            return (
              <li key={r.id} className="profile-row">
                <img className="profile-avatar" src={requestAvatar.src} alt="" />
                <div className="profile-person">
                  <p className="profile-name">{r.name}</p>
                </div>
                <div className="profile-row-actions">
                  <span className="profile-pill">Pending</span>
                  <button className="profile-mini profile-mini-ghost" type="button" onClick={() => handleDecline(r)}>cancel</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2>Your Friends</h2>
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
        placeholder="Enter friend code"
      />

      <button onClick={handleSendRequest}>send request</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {info && <p style={{ color: "green" }}>{info}</p>}

      <button onClick={onClose}>close</button>
    </div>
  );
}