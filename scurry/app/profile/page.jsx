// Profile page for the Scurry app
"use client";
import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";

export default function Profile() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <main>
            <h1>Profile</h1>
            {user ? (
                <div>
                    <p>Email: {user.email}</p>
                    <p>User ID: {user.uid}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </main>
    );
}