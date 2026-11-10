// Picks one member from a group. A reroll never returns the same member twice in a row.
export class Randomizer {
  constructor() {
    this.lastPick = undefined;
  }

  pickRandom(members) {
    if (!Array.isArray(members)) {
      throw new Error("Members must be an array");
    }
    if (members.length === 0) {
      throw new Error("Cannot randomize an empty group");
    }
    if (members.length === 1) {
      throw new Error("Cannot randomize with only one member");
    }

    const pool =
      this.lastPick !== undefined && members.includes(this.lastPick)
        ? members.filter((member) => member !== this.lastPick)
        : members;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.lastPick = pick;
    return pick;
  }
}
