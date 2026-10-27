

"use client";


import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth,db } from "../../lib/firebase";
import { tags } from "./tags";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";


export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [interests, setInterests] = useState([]);


  const handleSignup = async (e) => {
    e.preventDefault();


    try {
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


      setMessage("Account created successfully!");
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          interests,
          createdAt: serverTimestamp(),
        });
        setMessage("Account created successfully!");
      }
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
        {/* display interests and store them in state */}
        <div>
          <h1> Choose Your Interests </h1>
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



