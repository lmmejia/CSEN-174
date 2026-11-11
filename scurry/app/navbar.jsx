"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import "./styles/navbar.css";

export default function Navbar() {
  const pathname = usePathname();

  // hide the nav on the landing and login pages
  if (pathname === "/" || pathname === "/login") return null;

  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  return (
    <nav className="navbar">
      <ul>
        <li><Link href="/profile">Profile</Link></li>
        <li><Link href="/map">Map</Link></li>
        <li><Link href="/randomizer">Randomizer</Link></li>
        <li>
          <button type="button" onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
}
