export class GroupManager {
  constructor(users = []) {
    this.users = users;
  }

  getGroupCount(userId) {
    // TODO: real implementation later
    return 0;
  }

  joinGroup(group, userId, code) {
    if (code !== group.code) {
      throw new Error("Invalid group code");
    }

    if (group.members.includes(userId)) {
      throw new Error("Already in this group");
    }

    if (this.getGroupCount(userId) >= 10) {
      throw new Error("You can only be in 10 groups");
    }

    return {
      ...group,
      members: [...group.members, userId],
    };
  }

  // removeMember(group, requesterId, targetId, confirmed) { ... }
}