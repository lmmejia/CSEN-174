"use client";

import { useState } from "react";
import Link from "next/link";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import "../styles/login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "/profile";
        } catch {
            setMessage("Could not log in. Check your email and password.");
        }
    };

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        setMessage("");
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "/profile";
        } catch {
            setMessage("Google sign-in was cancelled or failed.");
        }
    };

    const handleForgot = async () => {
        if (!email) {
            setMessage("Enter your email, then click Forgot Password.");
            return;
        }
        setMessage("");
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent.");
        } catch {
            setMessage("Could not send a reset email. Check the address.");
        }
    };

    return (
        <main className="login-page">
            <div className="login-shell">
                <section className="login-aside">
                    <h1 className="login-title">Welcome Back</h1>
                    <p className="login-subtitle">Log in to keep Scurrying</p>
                </section>
                <form className="login-body" onSubmit={handleLogin}>
                    <label className="login-label">
                        Email
                        <input
                            type="email"
                            placeholder="email@campus.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label className="login-label">
                        Password
                        <input
                            type="password"
                            placeholder="••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    <button type="button" className="login-forgot" onClick={handleForgot}>
                        Forgot Password?
                    </button>

                    {message ? (
                        <p className="login-status" role="status">{message}</p>
                    ) : null}

                    <button type="submit" className="login-submit">Log in</button>
                    <button type="button" className="login-google" onClick={handleGoogleLogin}>
                        Continue with Google
                    </button>

                    <div className="login-divider" aria-hidden="true">
                        <span>or</span>
                    </div>

                    <p className="login-switch">
                        Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                    </p>
                </form>
            </div>
            <div className="login-foot" />
        </main>
    );
}
