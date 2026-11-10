"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { avatars } from "../signup/profilepics";
import { Randomizer } from "./randomizer";
import "../styles/randomizer.css";

function avatarFor(id) {
  return avatars.find((item) => item.id === id) || avatars[0];
}

export default function RandomizerPage() {
  const [status, setStatus] = useState("loading");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [members, setMembers] = useState([]);
  const [present, setPresent] = useState({});
  const [winner, setWinner] = useState(null);
  const [error, setError] = useState("");
  const randomizerRef = useRef(new Randomizer());

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#FBF6F0";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  useEffect(() => {
    let unsubGroups = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (unsubGroups) unsubGroups();

      if (!user) {
        setStatus("signed-out");
        setGroups([]);
        setSelectedGroupId(null);
        setMembers([]);
        return;
      }

      unsubGroups = onSnapshot(
        query(collection(db, "groups"), where("members", "array-contains", user.uid)),
        (snap) => {
          const list = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
          setGroups(list);
          setStatus("ready");
          setSelectedGroupId((current) =>
            list.some((group) => group.id === current) ? current : null
          );
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubGroups) unsubGroups();
    };
  }, []);

  useEffect(() => {
    const group = groups.find((entry) => entry.id === selectedGroupId);
    if (!group) {
      setMembers([]);
      return;
    }

    let cancelled = false;
    const ids = group.members || [];

    Promise.all(ids.map((id) => getDoc(doc(db, "users", id))))
      .then((docs) => {
        if (cancelled) return;
        setMembers(
          docs
            .filter((entry) => entry.exists())
            .map((entry) => {
              const data = entry.data();
              const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
              return {
                id: entry.id,
                name: name || "member",
                avatar: data.avatar,
              };
            })
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setMembers([]);
        setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [groups, selectedGroupId]);

  function selectGroup(groupId) {
    setSelectedGroupId(groupId);
    setPresent({});
    setWinner(null);
    setError("");
    randomizerRef.current = new Randomizer();
  }

  function togglePresent(memberId) {
    setPresent((current) => ({ ...current, [memberId]: !current[memberId] }));
    setWinner(null);
    setError("");
    randomizerRef.current = new Randomizer();
  }

  function handleRandomize() {
    const here = members.filter((member) => present[member.id]).map((member) => member.id);

    try {
      const pickId = randomizerRef.current.pickRandom(here);
      setWinner(members.find((member) => member.id === pickId) || null);
      setError("");
    } catch (err) {
      setWinner(null);
      if (here.length === 0) {
        setError("Select who is here first");
      } else if (here.length === 1) {
        setError("Select at least two people who are here");
      } else {
        setError(err.message);
      }
    }
  }

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || null;

  return (
    <main className="randomizer-page">
      <section className="randomizer-card">
        <h1>randomizer</h1>

        {status === "loading" && <p className="randomizer-lead">loading...</p>}

        {status === "signed-out" && (
          <>
            <p className="randomizer-lead">Log in and join a group to pick someone at random.</p>
            <Link className="randomizer-link" href="/login">log in</Link>
          </>
        )}

        {status === "ready" && groups.length === 0 && (
          <>
            <p className="randomizer-lead">Join a friend group before you can randomize.</p>
            <Link className="randomizer-link" href="/profile">go to groups</Link>
          </>
        )}

        {status === "ready" && groups.length > 0 && (
          <>
            <p className="randomizer-lead">Choose a group, then mark who is here.</p>

            <h2>choose a group</h2>
            <div className="randomizer-groups">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={group.id === selectedGroupId ? "randomizer-group selected" : "randomizer-group"}
                  onClick={() => selectGroup(group.id)}
                >
                  {group.name}
                </button>
              ))}
            </div>

            {selectedGroup && (
              <div className="randomizer-section">
                <h2>who is here</h2>
                {members.length === 0 ? (
                  <p className="randomizer-empty">nobody in this group yet</p>
                ) : (
                  <div className="randomizer-members">
                    {members.map((member) => {
                      const avatar = avatarFor(member.avatar);
                      const isPresent = Boolean(present[member.id]);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          className={isPresent ? "randomizer-member present" : "randomizer-member"}
                          aria-pressed={isPresent}
                          onClick={() => togglePresent(member.id)}
                        >
                          <img src={avatar.src} alt="" />
                          <span>{member.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <button className="randomizer-go" type="button" onClick={handleRandomize}>
                  randomize
                </button>
                {error && <p className="randomizer-note">{error}</p>}

                {winner && (
                  <div className="randomizer-winner">
                    <p>the pick</p>
                    <img src={avatarFor(winner.avatar).src} alt="" />
                    <h3>{winner.name}</h3>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
