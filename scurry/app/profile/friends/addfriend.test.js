import { describe, it, expect } from "vitest";
import { AddFriend } from "./addFriend";

describe("Add Friend", () => {
    const addFriend = new AddFriend();

    it("should display an error for an invalid username", () => {
        const username = "invaliduser123";

        expect(() => addFriend.addFriend(username))
            .toThrow("Username does not exist");
    });

    it("should reject a user trying to add themselves", () => {
    const currentUser = "Paulina";
    const username = "Paulina";

    expect(() => addFriend.addFriend(username, [], currentUser))
        .toThrow("Cannot add yourself as a friend");
    });

    it("should reject an empty username", () => {
        const username = "";

        expect(() => addFriend.addFriend(username)).toThrow("Username cannot be empty");
    });

    it("should successfully add a friend with a valid username", () => {
    const username = "paulina123";

    const result = addFriend.addFriend(username);

    expect(result).toBe("paulina123");
    });

    it("should reject a user who is already a friend", () => {
    const friends = ["Leslie", "Daniela", "John"];
    const username = "Leslie";

    expect(() => addFriend.addFriend(username, friends))
        .toThrow("User is already a friend");
    });
});