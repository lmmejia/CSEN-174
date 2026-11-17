"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
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

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "??").slice(0, 2).toUpperCase();
}

export default function Profile() {
  const [openPopup, setOpenPopup] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "var(--paper)";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  useEffect(() => {
    let unsubUser = null;
    let unsubGroups = null;
    let unsubIncoming = null;
    let unsubOutgoing = null;
    let incomingTick = 0;
    let outgoingTick = 0;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubUser) unsubUser();
      if (unsubGroups) unsubGroups();
      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();

      if (!user) {
        setUserId(null);
        setProfile(null);
        setFriends([]);
        setIncoming([]);
        setOutgoing([]);
        setGroups([]);
        return;
      }

      setUserId(user.uid);

      unsubIncoming = onSnapshot(
        query(collection(db, "friendRequests"), where("toUid", "==", user.uid)),
        async (snap) => {
          const tick = ++incomingTick;
          const list = await loadRequestPeople(snap, "fromUid");
          if (tick === incomingTick) setIncoming(list);
        }
      );

      unsubOutgoing = onSnapshot(
        query(collection(db, "friendRequests"), where("fromUid", "==", user.uid)),
        async (snap) => {
          const tick = ++outgoingTick;
          const list = await loadRequestPeople(snap, "toUid");
          if (tick === outgoingTick) setOutgoing(list);
        }
      );

      unsubUser = onSnapshot(doc(db, "users", user.uid), async (snap) => {
        const data = snap.data() || {};
        setProfile(data);

        const ids = data.friends || [];
        const docs = await Promise.all(ids.map((id) => getDoc(doc(db, "users", id))));
        setFriends(
          docs
            .filter((entry) => entry.exists())
            .map((entry) => {
              const data = entry.data();
              const first = data.firstName || "";
              const last = data.lastName || "";
              return {
                id: entry.id,
                name: `${first} ${last}`.trim() || "Friend",
                avatar: data.avatar,
              };
            })
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
      if (unsubIncoming) unsubIncoming();
      if (unsubOutgoing) unsubOutgoing();
    };
  }, []);

  async function loadRequestPeople(snap, uidField) {
    return Promise.all(
      snap.docs.map(async (entry) => {
        const otherUid = entry.data()[uidField];
        const person = await getDoc(doc(db, "users", otherUid));
        const data = person.data() || {};
        const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
        return {
          id: entry.id,
          uid: otherUid,
          name: person.exists() && name ? name : "Unknown",
          avatar: data.avatar,
        };
      })
    );
  }

  const avatar = avatars.find((item) => item.id === profile?.avatar) || avatars[0];
  const firstName = profile?.firstName || "";
  const lastName = profile?.lastName || "";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Your profile";
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

  async function handleAccept(request) {
    if (!userId) return;
    setRequestMessage("");
    try {
      await updateDoc(doc(db, "users", userId), {
        friends: arrayUnion(request.uid),
      });
      await updateDoc(doc(db, "users", request.uid), {
        friends: arrayUnion(userId),
      });
      await deleteDoc(doc(db, "friendRequests", request.id));
    } catch (error) {
      setRequestMessage(error.message);
    }
  }

  async function handleDismissRequest(request) {
    if (!userId) return;
    setRequestMessage("");
    try {
      await deleteDoc(doc(db, "friendRequests", request.id));
    } catch (error) {
      setRequestMessage(error.message);
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
      <header className="profile-head">
        <div>
          <h1 className="profile-title">Scurry Friends</h1>
          <p className="profile-lede">
            See who you&apos;ve added and the crews you&apos;re already part of around campus.
          </p>
        </div>
      </header>

      {editMessage && openPopup !== "edit" && <p className="profile-status">{editMessage}</p>}

      <div className="profile-columns">
      <section className="profile-you">
        <img className="profile-pic" src={avatar.src} alt={avatar.label} />
        <div>
          <p className="profile-you-name">{displayName}</p>
          {profile?.friendCode && (
            <p className="profile-code">Friend code {profile.friendCode}</p>
          )}
          <p className={profile?.bio ? "profile-bio-text" : "profile-bio-text profile-empty"}>
            {profile?.bio || "Write a little about yourself"}
          </p>
          {interestLabels.length > 0 && (
            <div className="profile-tags">
              {interestLabels.map((label) => (
                <span key={label} className="profile-tag">{label.toLowerCase()}</span>
              ))}
            </div>
          )}
        </div>
        <button className="profile-edit" type="button" onClick={startEdit}>
          edit profile
        </button>
        <div className="profile-bookmarks">
          <h2>Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="profile-empty">None yet</p>
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
        </div>
      </section>

        <section className="profile-col">
          <div className="profile-col-head">
            <div>
              <h2>Added Friends</h2>
              <p>Students you&apos;ve already added to your Scurry crew.</p>
            </div>
            <button className="profile-action" type="button" onClick={() => setOpenPopup("friends")}>
              Add Friend
            </button>
          </div>
          {requestMessage && <p className="profile-status">{requestMessage}</p>}

          <div className="profile-requests">
            <div>
              <h3 className="profile-subhead">Incoming</h3>
              {incoming.length === 0 ? (
                <p className="profile-empty-card">No incoming requests.</p>
              ) : (
                <ul className="profile-rows">
                  {incoming.map((request) => {
                    const requestAvatar = avatars.find((item) => item.id === request.avatar) || avatars[0];
                    return (
                      <li key={request.id} className="profile-row">
                        <img className="profile-avatar" src={requestAvatar.src} alt="" />
                        <div className="profile-person">
                          <p className="profile-name">{request.name}</p>
                        </div>
                        <div className="profile-row-actions">
                          <button className="profile-mini" type="button" onClick={() => handleAccept(request)}>
                            Accept
                          </button>
                          <button className="profile-mini profile-mini-ghost" type="button" onClick={() => handleDismissRequest(request)}>
                            Decline
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <h3 className="profile-subhead">Sent</h3>
              {outgoing.length === 0 ? (
                <p className="profile-empty-card">No sent requests.</p>
              ) : (
                <ul className="profile-rows">
                  {outgoing.map((request) => {
                    const requestAvatar = avatars.find((item) => item.id === request.avatar) || avatars[0];
                    return (
                      <li key={request.id} className="profile-row">
                        <img className="profile-avatar" src={requestAvatar.src} alt="" />
                        <div className="profile-person">
                          <p className="profile-name">{request.name}</p>
                        </div>
                        <div className="profile-row-actions">
                          <span className="profile-pill">Pending</span>
                          <button className="profile-mini profile-mini-ghost" type="button" onClick={() => handleDismissRequest(request)}>
                            Cancel
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {friends.length === 0 ? (
            <p className="profile-empty-card">No friends yet. Add someone with their friend code.</p>
          ) : (
            <ul className="profile-rows">
              {friends.map((friend) => {
                const friendAvatar = avatars.find((item) => item.id === friend.avatar) || avatars[0];
                return (
                  <li key={friend.id} className="profile-row">
                    <img
                      className="profile-avatar"
                      src={friendAvatar.src}
                      alt=""
                    />
                    <div className="profile-person">
                      <p className="profile-name">{friend.name}</p>
                    </div>
                    <span className="profile-pill">Added</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="profile-col">
          <div className="profile-col-head">
            <div>
              <h2>Your Groups</h2>
              <p>Crews you&apos;re already part of around campus.</p>
            </div>
            <button className="profile-action" type="button" onClick={() => setOpenPopup("groups")}>
              create/join
            </button>
          </div>
          {groups.length === 0 ? (
            <p className="profile-empty-card">No crews yet. Create one or join with an invite code.</p>
          ) : (
            <ul className="profile-rows">
              {groups.map((group) => {
                const count = (group.members || []).length;
                return (
                  <li key={group.id} className="profile-row">
                    <span className="profile-avatar" aria-hidden="true">{initials(group.name || "Group")}</span>
                    <div className="profile-person">
                      <p className="profile-name">{group.name}</p>
                      <p className="profile-handle">
                        {count} {count === 1 ? "member" : "members"}
                      </p>
                    </div>
                    <span className="profile-pill">Member</span>
                  </li>
                );
              })}
            </ul>
          )}
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
