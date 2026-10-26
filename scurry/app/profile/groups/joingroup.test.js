import { describe, it, expect, beforeEach, vi } from "vitest";
import { GroupManager } from "./groupManager";

describe("Join group", () => {
    let service;
    let group;

    //this is a groupmanager class to test have a person in charge of the group of friends with different members
    beforeEach(() => {
        service = new GroupManager(["creator", "paulina", "leslie", "sophia"]);

        //here is what the group includes: id, creator, expiration code and time, and different members
        //members are a mockup (it is the creator/manager and another member)
        group = {
        id: "group1",
        creatorId: "creator",
        code: "SCURRY123",
        codeExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // valid for 24h
        members: ["creator", "leslie"],
        };
    });

    //test to check if someone tries to join with wrong code, should throw an error
    it("does not let someone join with an invalid code", () => {
        expect(() => service.joinGroup(group, "paulina", "WRONG")).toThrow(
        "Invalid group code"
        );
    });

    //test to check if someone tries to join with an expired code, should throw an error
    it("does not let someone join with an expired code", () => {
        group.codeExpiresAt = Date.now() - 1000; // expired 1 second ago

        expect(() => service.joinGroup(group, "paulina", "SCURRY123")).toThrow(
            "Group code expired"
        );
    });

    //test to check if someone tries to join a group they are already in, should throw an error
    it("does not let someone join a group they are already in", () => {
        expect(() => service.joinGroup(group, "leslie", "SCURRY123")).toThrow(
            "Already in this group"
        );
    });

    //test to check if someone tries to join a group with valid code, should add them to the group (VALID TEST)
    it("adds the user when the code is valid", () => {
        const result = service.joinGroup(group, "paulina", "SCURRY123");

        expect(result.members).toContain("paulina");
        expect(result.members).toEqual(["creator", "leslie", "paulina"]);
    });

    //test to check if someone tries to join even though they are in the max number of groups, should throw an error
    it("does not let someone join when they are already in 10 groups", () => {
        service.getGroupCount = vi.fn().mockReturnValue(10);

        expect(() => service.joinGroup(group, "paulina", "SCURRY123")).toThrow(
            "You can only be in 10 groups"
        );
    });
});