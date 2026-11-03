"use client";
import { useState } from "react";
import Friends from "./friends/friends";

export default function Profile() {
  const [openPopup, setOpenPopup] = useState(null);

  return (
    <main>
      <h1>Profile</h1>

      <button onClick={() => setOpenPopup("groups")}>groups</button>
      <button onClick={() => setOpenPopup("friends")}>friends</button>

      {openPopup === "friends" && (
        <Friends
          friends={[]}
          onAddFriend={async (code) => console.log("add", code)}
          onClose={() => setOpenPopup(null)}
        />
      )}

      {openPopup === "groups" && (
        <div>
          <h2>groups</h2>
          <button onClick={() => setOpenPopup(null)}>close</button>
        </div>
      )}
    </main>
  );
}