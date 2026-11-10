"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { tags } from "./tags";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { avatars } from "./profilepics";
import styles from "./signup.module.css";

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

      setMessage("Account created successfully!");
    } catch (error) {
      setMessage(`Signup failed: ${error.code}`);
    }
  };

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={handleSignup}>
        <h1 className={styles.title}>Let's Create Your Squirrel!</h1>
        <p className={styles.subtitle}>choose your profile</p>
        <div className={styles.avatars}>
          {avatars.map((a) => (
            <label key={a.id}
              className={`${styles.avatar} ${avatar === a.id ? styles.selected : ""}`}>
              <input
                type="radio"
                name="avatar"
                className={styles.hidden}
                value={a.id}
                checked={avatar === a.id}
                onChange={() => setAvatar(a.id)}
              />
              <img src={a.src} alt={a.label} className={styles.avatarImg} />
              <span className={styles.avatarLabel}>{a.label}</span>
            </label>
          ))}
        </div>

        <div className={styles.fields}>
          <input
          className={styles.input}  
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password (6+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />

          <input
            className={styles.input}
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />

          <input
            className={styles.input}
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          </div>

          {/* display interests and store them in state */}
          <h2 className={styles.title}>Choose Your Interests</h2>
          <p className={styles.subtitle}>select all that apply</p>
          <div className={styles.tags}>
            {tags.map((tag) => {
            const isChecked = interests.includes(tag.id);
            return (
            <label key={tag.id}
              className={`${styles.tag} ${isChecked ? styles.selected : ""}`}>
              <input
                type="checkbox"
                className={styles.hidden}
                checked={isChecked}
                onChange={() =>
                  setInterests((prev) =>
                    isChecked ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                  )
                }
              />

              <span className={styles.dot}></span>
              {tag.label}
            </label>
            );
            })}
          </div>

          <button className={styles.button} type="submit">Sign Up</button>
      </form>

      <p role="status">{message}</p>
    </main >
  );
}