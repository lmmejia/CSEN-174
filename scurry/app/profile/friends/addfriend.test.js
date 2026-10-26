import { describe, it, expect } from "vitest";
import { AddFriend } from "./addFriend";

describe("Add Friend", () => {
    const addFriend = new AddFriend();

    //tests that invalid usernames do not go through
    it("should display an error for an invalid username", () => {
        const username = "invaliduser123";

        expect(() => addFriend.addFriend(username))
            .toThrow("Username does not exist");
    });

    //tests that a user cannot add themselves as a friend
    it("should reject a user trying to add themselves", () => {
    const currentUser = "Paulina";
    const username = "Paulina";

    expect(() => addFriend.addFriend(username, [], currentUser))
        .toThrow("Cannot add yourself as a friend");
    });

    //tests that an empty username is rejected
    it("should reject an empty username", () => {
        const username = "";

        expect(() => addFriend.addFriend(username)).toThrow("Username cannot be empty");
    });

    //succesfully add friend
    it("should successfully add a friend with a valid username", () => {
    const username = "paulina123";

    const result = addFriend.addFriend(username);

    expect(result).toBe("paulina123");
    });

    //cannnot add friend twice
    it("should reject a user who is already a friend", () => {
    const friends = ["Leslie", "Daniela", "John"];
    const username = "Leslie";

    expect(() => addFriend.addFriend(username, friends))
        .toThrow("User is already a friend");
    });
});