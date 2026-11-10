"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./styles/navbar.css";

export default function Navbar() {
const pathname = usePathname();

// hide the nav on the landing page
if (pathname === "/") return null;

return (
    <nav className ="navbar">
    <ul>
        <li><Link href="/profile">Profile</Link></li>
        <li><Link href="/map">Map</Link></li>
        <li><Link href="/randomizer">Randomizer</Link></li>
    </ul>
    </nav>
);
}