import { describe, it, expect, beforeEach } from "vitest";
import { GroupManager } from "./groupManager";

describe("Remove member from group", () => {
  let service;
  let group;

  beforeEach(() => {
    // Everyone who has an account
    service = new GroupManager(["creator", "paulina", "leslie", "sophia"]);

    // sophia has an account but is NOT in this group
    group = {
      id: "group1",
      creatorId: "creator",
      members: ["creator", "leslie", "paulina"],
    };
  });

  it("removes a member when the creator confirms", () => {
    const result = service.removeMember(group, "creator", "paulina", true);

    expect(result.members).not.toContain("paulina");
    expect(result.members).toEqual(["creator", "leslie"]);
  });

  it("does not let a non-creator remove a member", () => {
    expect(() => service.removeMember(group, "paulina", "leslie", true)).toThrow(
      "Only the group creator can remove members"
    );
  });

  it("does not let someone outside the group remove a member", () => {
    expect(() => service.removeMember(group, "sophia", "leslie", true)).toThrow(
      "Only the group creator can remove members"
    );
  });

  it("does not remove a person who is not in the group", () => {
    expect(() => service.removeMember(group, "creator", "sophia", true)).toThrow(
      "That person is not in the group"
    );
  });

  it("does not remove a person who does not exist", () => {
    expect(() => service.removeMember(group, "creator", "ghost", true)).toThrow(
      "That person does not exist"
    );
  });

  it("does not remove when the creator has not confirmed", () => {
    expect(() => service.removeMember(group, "creator", "paulina", false)).toThrow(
      "Removal must be confirmed"
    );
  });

  it("does not remove when confirmation is missing", () => {
    expect(() => service.removeMember(group, "creator", "paulina")).toThrow(
      "Removal must be confirmed"
    );
  });

  it("leaves the group unchanged when removal fails", () => {
    try {
      service.removeMember(group, "paulina", "leslie", true);
    } catch (error) {
      // expected
    }

    expect(group.members).toEqual(["creator", "leslie", "paulina"]);
  });
});