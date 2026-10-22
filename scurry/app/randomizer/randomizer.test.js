import { describe, it, expect } from "vitest";
import { Randomizer } from "./randomizer";

describe("Randomizer", () => {

    const randomizer = new Randomizer();

    it("should return the only member", () => {
        const members = ["Paulina"];

        const result = randomizer.pickRandom(members);

        expect(result).toBe("Paulina");
    });

    it("should reject an empty group", () => {
        const members = [];

        expect(() => randomizer.pickRandom(members)).toThrow();
    });

    it("should reject a group with only one member", () => {
        const members = ["Paulina"];

        expect(() => randomizer.pickRandom(members)).toThrow("Cannot randomize with only one member");
    });

    it("should reject a number instead of an array", () => {
        const members = 123;

        expect(() => randomizer.pickRandom(members)).toThrow();
    });
});

