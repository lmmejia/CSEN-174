"use client";
import { useState } from "react";
import Friends from "./friends/friends";
import Groups from "./groups/groups";
import Bookmarks from "./bookmarks";

export default function Profile() {
  const [openPopup, setOpenPopup] = useState(null);

  return (
    <main>
      <h1>Profile</h1>

      <button onClick={() => setOpenPopup("groups")}>groups</button>
      <button onClick={() => setOpenPopup("friends")}>friends</button>
      <button onClick={() => setOpenPopup("bookmarks")}>bookmarks</button>

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

      {openPopup === "bookmarks" && (
        <Bookmarks onClose={() => setOpenPopup(null)} />
      )}
    </main>
  );
}