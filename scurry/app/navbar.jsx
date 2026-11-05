"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
const pathname = usePathname();

// hide the nav on the landing page
if (pathname === "/") return null;

return (
    <nav>
    <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/profile">Profile</Link></li>
        <li><Link href="/map">Map</Link></li>
        <li><Link href="/setup">Setup</Link></li>
        <li><Link href="/randomizer">Randomizer</Link></li>
        <li><Link href="/login">Login</Link></li>
    </ul>
    </nav>
);
}