"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { tags } from "../data/tags";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { avatars } from "./profilepics";
import "../styles/signup.css";

//create a custom code for friends
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomCode(length = 6) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

async function generateUniqueCode() {
  while (true) {
    const code = randomCode();
    const snap = await getDocs(query(collection(db, "users"), where("friendCode", "==", code)));
    if (snap.empty) {
      return code;
    }
  }
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interests, setInterests] = useState([]);
  const [avatar, setAvatar] = useState(avatars[0].id); // default to first

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        firstName,
        lastName,
        interests,
        avatar,
        friendCode: await generateUniqueCode(), // generate a unique friend code
        friends: [],
        createdAt: serverTimestamp(),
      });

      window.location.href = "/profile";
    } catch (error) {
      setMessage(`Signup failed: ${error.code}`);
    }
  };

  return (
    <main className="signup-page">
      <form className="signup-card" onSubmit={handleSignup}>
        <h1 className="signup-title">Let's Create Your Squirrel!</h1>
        <p className="signup-subtitle">choose your profile</p>
        <div className="signup-avatars">
          {avatars.map((a) => (
            <label key={a.id}
              className={`signup-avatar ${avatar === a.id ? "signup-selected" : ""}`}>
              <input
                type="radio"
                name="avatar"
                className="signup-hidden"
                value={a.id}
                checked={avatar === a.id}
                onChange={() => setAvatar(a.id)}
              />
              <img src={a.src} alt={a.label} className="signup-avatar-img" />
              <span className="signup-avatar-label">{a.label}</span>
            </label>
          ))}
        </div>

        <div className="signup-fields">
          <input
          className="signup-input"  
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="signup-input"
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <input
            className="signup-input"
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            className="signup-input"
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          </div>

          {/* display interests and store them in state */}
          <h2 className="signup-title">Choose Your Interests</h2>
          <p className="signup-subtitle">select all that apply</p>
          <div className="signup-tags">
            {tags.map((tag) => {
            const isChecked = interests.includes(tag.id);
            return (
            <label key={tag.id}
              className={`signup-tag ${isChecked ? "signup-selected" : ""}`}>
              <input
                type="checkbox"
                className="signup-hidden"
                checked={isChecked}
                onChange={() =>
                  setInterests((prev) =>
                    isChecked ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  )
                }
              />

              <span className="signup-dot"></span>
              {tag.label}
            </label>
            );
            })}
          </div>

          <button className="signup-button" type="submit">Sign Up</button>
      </form>

      <p role="status">{message}</p>
    </main >
  );
}