import { describe, it, expect, beforeEach } from "vitest";
import { GroupManager } from "./groupManager";

describe("Remove member from group", () => {
  let service;
  let group;

  beforeEach(() => {
    // Same as the join group test, we create a new instance of GroupManager and a mock group for each test
    service = new GroupManager(["creator", "paulina", "leslie", "sophia"]);

    // example: sophia has an account but is NOT in this group
    group = {
      id: "group1",
      creatorId: "creator",
      members: ["creator", "leslie", "paulina"],
    };
  });

  //test to check if the creator can remove a member when they confirm, should remove the member from the group
  it("removes a member when the creator confirms", () => {
    const result = service.removeMember(group, "creator", "paulina", true);

    expect(result.members).not.toContain("paulina");
    expect(result.members).toEqual(["creator", "leslie"]);
  });

  //test to see if the person not head of the group tries to remove a member, throw error
  it("does not let a non-creator remove a member", () => {
    expect(() => service.removeMember(group, "paulina", "leslie", true)).toThrow(
      "Only the group creator can remove members"
    );
  });

  //test to see if someone outside the group tries to remove a memeber 
  it("does not let someone outside the group remove a member", () => {
    expect(() => service.removeMember(group, "sophia", "leslie", true)).toThrow(
      "Only the group creator can remove members"
    );
  });

  //test to see if the head of the group tries to remove someone who is not in the group (maybe already kicked)
  it("does not remove a person who is not in the group", () => {
    expect(() => service.removeMember(group, "creator", "sophia", true)).toThrow(
      "That person is not in the group"
    );
  });

  //removing someone that does not exist (test)
  it("does not remove a person who does not exist", () => {
    expect(() => service.removeMember(group, "creator", "ghost", true)).toThrow(
      "That person does not exist"
    );
  });

  //test for confirmation of removal of person has been approved
  it("does not remove when the creator has not confirmed", () => {
    expect(() => service.removeMember(group, "creator", "paulina", false)).toThrow(
      "Removal must be confirmed"
    );
  });

  //another confirmation test
  it("does not remove when confirmation is missing", () => {
    expect(() => service.removeMember(group, "creator", "paulina")).toThrow(
      "Removal must be confirmed"
    );
  });

  //group stays the same if removal does not remove the person being kicked
  it("leaves the group unchanged when removal fails", () => {
    try {
      service.removeMember(group, "paulina", "leslie", true);
    } catch (error) {
      // expected
    }

    expect(group.members).toEqual(["creator", "leslie", "paulina"]);
  });
});