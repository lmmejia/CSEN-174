"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { avatars } from "../signup/profilepics";
import { tags } from "../signup/tags";
import Friends from "./friends/friends";
import Groups from "./groups/groups";
import "../styles/profile.css";

export default function Profile() {
  const [openPopup, setOpenPopup] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [bioMessage, setBioMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const bioSynced = useRef(false);

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#FBF6F0";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  useEffect(() => {
    let unsubUser = null;
    let unsubGroups = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubUser) unsubUser();
      if (unsubGroups) unsubGroups();
      bioSynced.current = false;

      if (!user) {
        setUserId(null);
        setProfile(null);
        setBio("");
        setFriends([]);
        setGroups([]);
        return;
      }

      setUserId(user.uid);

      unsubUser = onSnapshot(doc(db, "users", user.uid), async (snap) => {
        const data = snap.data() || {};
        setProfile(data);
        if (!bioSynced.current) {
          setBio(data.bio || "");
          bioSynced.current = true;
        }

        const ids = data.friends || [];
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
        setFriends(
          docs
            .filter((entry) => entry.exists())
            .map((entry) => ({
              id: entry.id,
              name: `${entry.data().firstName} ${entry.data().lastName}`,
            }))
        );
      });

      unsubGroups = onSnapshot(
        query(collection(db, "groups"), where("members", "array-contains", user.uid)),
        (snap) => {
          setGroups(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
      if (unsubGroups) unsubGroups();
    };
  }, []);

  const avatar = avatars.find((item) => item.id === profile?.avatar) || avatars[0];
  const firstName = profile?.firstName || "";
  const displayName = firstName ? firstName.toUpperCase() : "PROFILE";
  const interestLabels = (profile?.interests || []).map(
    (id) => tags.find((tag) => tag.id === id)?.label || id
  );
  const bookmarks = profile?.bookmarks || [];

  async function handleSaveBio() {
    setBioMessage("");
    if (!userId) {
      setBioMessage("Log in first");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { bio });
      setEditingBio(false);
    } catch (error) {
      setBioMessage(error.message);
    }
  }

  async function handleRemoveBookmark(placeName) {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId), {
      bookmarks: arrayRemove(placeName),
    });
  }

  return (
    <main className="profile-page">
      <div className="profile-layout">
        <section className="profile-card profile-identity">
          <div className="profile-top">
            <img className="profile-pic" src={avatar.src} alt={avatar.label} />
            <div className="profile-intro">
              <h1>{displayName}</h1>
              {profile?.friendCode && (
                <p className="profile-code">Friend Code: {profile.friendCode}</p>
              )}
              {interestLabels.length > 0 && (
                <div className="profile-tags">
                  {interestLabels.map((label) => (
                    <span key={label} className="profile-tag">{label.toLowerCase()}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <h2>{firstName ? `${firstName.toLowerCase()} bio` : "bio"}</h2>
          <div className="profile-bio-wrap">
            {editingBio ? (
              <textarea
                className="profile-bio"
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  setBioMessage("");
                }}
                placeholder="write a little about yourself"
              />
            ) : (
              <p className={bio ? "profile-bio-text" : "profile-bio-text profile-empty"}>
                {bio || "write a little about yourself"}
              </p>
            )}
            <button
              className="profile-bio-edit"
              type="button"
              aria-label={editingBio ? "Cancel editing bio" : "Edit bio"}
              onClick={() => {
                if (editingBio) {
                  setBio(profile?.bio || "");
                  setBioMessage("");
                  setEditingBio(false);
                  return;
                }
                setBioMessage("");
                setEditingBio(true);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.8 6.7l3.5 3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </div>
          {editingBio && (
            <button className="profile-save" type="button" onClick={handleSaveBio}>
              save bio
            </button>
          )}
          {bioMessage && <p className="profile-note">{bioMessage}</p>}

          <h2>bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="profile-empty">none :c</p>
          ) : (
            <ul className="profile-list">
              {bookmarks.map((placeName) => (
                <li key={placeName}>
                  <span>{placeName}</span>
                  <button
                    className="profile-trash"
                    type="button"
                    aria-label={`Remove ${placeName}`}
                    onClick={() => handleRemoveBookmark(placeName)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 7h16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 7V5h6v2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 7l1 13h10l1-13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="profile-card profile-side">
          <h2>current group</h2>
          {groups.length === 0 ? (
            <p className="profile-empty">none :c</p>
          ) : (
            <ul className="profile-list">
              {groups.map((group) => (
                <li key={group.id}>{group.name}</li>
              ))}
            </ul>
          )}
          <button
            className={openPopup === "groups" ? "profile-open active" : "profile-open"}
            type="button"
            onClick={() => setOpenPopup("groups")}
          >
            groups
          </button>
        </section>

        <section className="profile-card profile-side">
          <h2>friends</h2>
          {friends.length === 0 ? (
            <p className="profile-empty">none :c</p>
          ) : (
            <ul className="profile-list">
              {friends.map((friend) => (
                <li key={friend.id}>{friend.name}</li>
              ))}
            </ul>
          )}
          <button
            className={openPopup === "friends" ? "profile-open active" : "profile-open"}
            type="button"
            onClick={() => setOpenPopup("friends")}
          >
            friends
          </button>
        </section>
      </div>

      {openPopup && (
        <div
          className="profile-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenPopup(null)}
        >
          <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
            {openPopup === "friends" && (
              <Friends onClose={() => setOpenPopup(null)} />
            )}
            {openPopup === "groups" && (
              <Groups onClose={() => setOpenPopup(null)} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
