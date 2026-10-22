import { describe, it, expect, beforeEach } from "vitest";
import { GroupManager } from "./groupManager";

describe("Join group", () => {
    let service;
    let group;

    beforeEach(() => {
        service = new GroupManager(["creator", "paulina", "leslie", "sophia"]);

        group = {
        id: "group1",
        creatorId: "creator",
        code: "SCURRY123",
        members: ["creator", "leslie"],
        };
    });

    it("does not let someone join with an invalid code", () => {
        expect(() => service.joinGroup(group, "paulina", "WRONG")).toThrow(
        "Invalid group code"
        );
    });

    it("does not let someone join a group they are already in", () => {
        expect(() => service.joinGroup(group, "leslie", "SCURRY123")).toThrow(
            "Already in this group"
        );
    });

    it("adds the user when the code is valid", () => {
        const result = service.joinGroup(group, "paulina", "SCURRY123");

        expect(result.members).toContain("paulina");
        expect(result.members).toEqual(["creator", "leslie", "paulina"]);
    });

    it("does not let someone join when they are already in 10 groups", () => {
        service.getGroupCount = vi.fn().mockReturnValue(10);

        expect(() => service.joinGroup(group, "paulina", "SCURRY123")).toThrow(
            "You can only be in 10 groups"
        );
    });
});