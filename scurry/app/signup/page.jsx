"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { tags } from "./tags";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { avatars } from "./profilepics";

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
        createdAt: serverTimestamp(),
      });

      setMessage("Account created successfully!");
    } catch (error) {
      setMessage(`Signup failed: ${error.code}`);
    }
  };

  return (
    <main>
      <h1>Join Scurry! </h1>

      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <div>
          <h2>Choose Your Squirrel</h2>
          {avatars.map((a) => (
            <label key={a.id}>
              <input
                type="radio"
                name="avatar"
                value={a.id}
                checked={avatar === a.id}
                onChange={() => setAvatar(a.id)}
              />
              <img src={a.src} alt={a.label} width={80} height={80} />
              {a.label}
            </label>
          ))}
        </div>

        {/* display interests and store them in state */}
        <div>
          <h2>Choose Your Interests</h2>
          {tags.map((tag) => (
            <label key={tag.id}>
              <input
                type="checkbox"
                value={tag.id}
                onChange={(e) => {
                  const value = e.target.value;
                  setInterests((prevInterests) =>
                    e.target.checked
                      ? [...prevInterests, value]
                      : prevInterests.filter((id) => id !== value)
                  );
                }}
              />
              {tag.label}
            </label>
          ))}
        </div>

        <button type="submit">Sign Up</button>
      </form>

      <p role="status">{message}</p>
    </main>
  );
}