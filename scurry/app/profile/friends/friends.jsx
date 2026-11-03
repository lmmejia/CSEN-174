'use client';
import { useState } from "react";

export default function Friends({friends = [], onAddFriend, onClose}) {
  
  const [friendCode, setFriendCode] = useState("");
  const [error, setError] = useState("");

  async function handleAdd(){
    setError("");
    try{
        await onAddFriend(friendCode);
        setFriendCode("");
    } catch (err){
        setError(err.message);
    }       
  }

  return(
    <div>
        <h1>Add a Friend</h1>
      {friends.length === 0 ? (
        <p>none :c</p>
      ) : (
        <ul>
          {friends.map((f) => (
            <li key={f.id}>{f.name}</li>
          ))}
        </ul>
      )}

      <input
        value={friendCode}
        onChange={(e) => setFriendCode(e.target.value)}
        placeholder="enter friend code"
      />
      <button onClick={handleAdd}>add</button>
      {error && <p>{error}</p>}

      <button onClick={onClose}>close</button>
    </div>
  );
}