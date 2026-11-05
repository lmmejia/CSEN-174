"use client";
import { useState } from "react";
import Friends from "./friends/friends";
import Groups from "./groups/groups";

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
        <Groups onClose={() => setOpenPopup(null)} />
      )}
    </main>
  );
}