"use client";

import { useEffect, useState } from "react";
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
import { tags } from "../data/tags";
import Friends from "./friends/friends";
import Groups from "./groups/groups";
import "../styles/signup.css";
import "../styles/profile.css";

export default function Profile() {
  const [openPopup, setOpenPopup] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);

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

      if (!user) {
        setUserId(null);
        setProfile(null);
        setFriends([]);
        setGroups([]);
        return;
      }

      setUserId(user.uid);

      unsubUser = onSnapshot(doc(db, "users", user.uid), async (snap) => {
        const data = snap.data() || {};
        setProfile(data);

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

  function startEdit() {
    if (!userId) {
      setEditMessage("Log in first");
      return;
    }
    setDraft({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      bio: profile?.bio || "",
      avatar: profile?.avatar || avatars[0].id,
      interests: [...(profile?.interests || [])],
    });
    setEditMessage("");
    setOpenPopup("edit");
  }

  function toggleInterest(id) {
    setDraft((current) => {
      const selected = current.interests.includes(id);
      return {
        ...current,
        interests: selected
          ? current.interests.filter((item) => item !== id)
          : [...current.interests, id],
      };
    });
  }

  async function handleSaveProfile() {
    setEditMessage("");
    if (!userId || !draft) {
      setEditMessage("Log in first");
      return;
    }
    const firstNameValue = draft.firstName.trim();
    if (!firstNameValue) {
      setEditMessage("First name is required");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), {
        firstName: firstNameValue,
        lastName: draft.lastName.trim(),
        bio: draft.bio,
        avatar: draft.avatar,
        interests: draft.interests,
      });
      setOpenPopup(null);
      setDraft(null);
    } catch (error) {
      setEditMessage(error.message);
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
              <button type="button" onClick={startEdit}>edit profile</button>
              {editMessage && openPopup !== "edit" && <p>{editMessage}</p>}
            </div>
          </div>

          <h2>{firstName ? `${firstName.toLowerCase()} bio` : "bio"}</h2>
          <div className="profile-bio-wrap">
            <p className={profile?.bio ? "profile-bio-text" : "profile-bio-text profile-empty"}>
              {profile?.bio || "write a little about yourself"}
            </p>
          </div>

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
          onClick={() => {
            setOpenPopup(null);
            setDraft(null);
            setEditMessage("");
          }}
        >
          <div className="profile-modal-card" onClick={(event) => event.stopPropagation()}>
            {openPopup === "friends" && (
              <Friends onClose={() => setOpenPopup(null)} />
            )}
            {openPopup === "groups" && (
              <Groups onClose={() => setOpenPopup(null)} />
            )}
            {openPopup === "edit" && draft && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSaveProfile();
                }}
              >
                <h2>edit profile</h2>
                <p>profile picture</p>
                <div className="signup-avatars">
                  {avatars.map((item) => (
                    <label
                      key={item.id}
                      className={`signup-avatar ${draft.avatar === item.id ? "signup-selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="avatar"
                        className="signup-hidden"
                        checked={draft.avatar === item.id}
                        onChange={() => setDraft((current) => ({ ...current, avatar: item.id }))}
                      />
                      <img src={item.src} alt={item.label} className="signup-avatar-img" />
                      <span className="signup-avatar-label">{item.label}</span>
                    </label>
                  ))}
                </div>
                <p>
                  <label>
                    First name{" "}
                    <input
                      type="text"
                      value={draft.firstName}
                      onChange={(event) => setDraft((current) => ({ ...current, firstName: event.target.value }))}
                      required
                    />
                  </label>
                </p>
                <p>
                  <label>
                    Last name{" "}
                    <input
                      type="text"
                      value={draft.lastName}
                      onChange={(event) => setDraft((current) => ({ ...current, lastName: event.target.value }))}
                    />
                  </label>
                </p>
                <p>
                  <label>
                    Bio{" "}
                    <textarea
                      value={draft.bio}
                      onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))}
                    />
                  </label>
                </p>
                <p>preferences</p>
                <div className="signup-tags">
                  {tags.map((tag) => {
                    const selected = draft.interests.includes(tag.id);
                    return (
                      <label
                        key={tag.id}
                        className={`signup-tag ${selected ? "signup-selected" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="signup-hidden"
                          checked={selected}
                          onChange={() => toggleInterest(tag.id)}
                        />
                        <span className="signup-dot"></span>
                        {tag.label}
                      </label>
                    );
                  })}
                  {draft.interests
                    .filter((id) => !tags.some((tag) => tag.id === id))
                    .map((id) => (
                      <label key={id} className="signup-tag signup-selected">
                        <input
                          type="checkbox"
                          className="signup-hidden"
                          checked
                          onChange={() => toggleInterest(id)}
                        />
                        <span className="signup-dot"></span>
                        {id}
                      </label>
                    ))}
                </div>
                {editMessage && <p>{editMessage}</p>}
                <button
                  type="button"
                  onClick={() => {
                    setOpenPopup(null);
                    setDraft(null);
                    setEditMessage("");
                  }}
                >
                  cancel
                </button>
                <button type="submit">save</button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
