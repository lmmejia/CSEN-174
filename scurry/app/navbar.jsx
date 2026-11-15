"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { avatars } from "./signup/profilepics";
import "./styles/navbar.css";

export default function Navbar() {
  const pathname = usePathname();
  const [avatar, setAvatar] = useState(avatars[0]);

  useEffect(() => {
    let unsubUser = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubUser) unsubUser();
      if (!user) {
        setAvatar(avatars[0]);
        return;
      }

      unsubUser = onSnapshot(doc(db, "users", user.uid), (snap) => {
        const id = snap.data()?.avatar;
        setAvatar(avatars.find((item) => item.id === id) || avatars[0]);
      });
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  if (pathname === "/" || pathname === "/login" || pathname === "/signup") return null;

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link href="/profile" className="navbar-avatar-link" aria-label="Profile">
            <img className="navbar-avatar" src={avatar.src} alt="" />
          </Link>
        </li>
        <li>
          <Link href="/profile" className={pathname === "/profile" ? "active" : ""}>Friends</Link>
        </li>
        <li>
          <Link href="/map" className={pathname === "/map" ? "active" : ""}>Map</Link>
        </li>
        <li>
          <Link href="/randomizer" className={pathname === "/randomizer" ? "active" : ""}>Randomizer</Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
