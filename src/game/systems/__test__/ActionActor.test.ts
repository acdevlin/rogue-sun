import { describe, it, expect } from "vitest";
import { ActionActor } from "../ActionActor";

describe("ActionActor", () => {
  it("initializes with given values", () => {
    const a = new ActionActor("Hero", 30, true);
    expect(a.name).toBe("Hero");
    expect(a.speed).toBe(30);
    expect(a.isPlayer).toBe(true);
    expect(a.progress).toBe(0);
    expect(a.readyThreshold).toBe(100);
  });

  it("initializes non-player actor correctly", () => {
    const a = new ActionActor("Goblin", 20, false);
    expect(a.name).toBe("Goblin");
    expect(a.speed).toBe(20);
    expect(a.isPlayer).toBe(false);
  });

  describe("modifySpeed", () => {
    it("multiplies speed by factor", () => {
      const a = new ActionActor("Hero", 30, true);
      a.modifySpeed(0.5);
      expect(a.speed).toBe(15);
    });

    it("increases speed when factor > 1", () => {
      const a = new ActionActor("Hero", 30, true);
      a.modifySpeed(2);
      expect(a.speed).toBe(60);
    });

    it("can set speed to zero", () => {
      const a = new ActionActor("Hero", 30, true);
      a.modifySpeed(0);
      expect(a.speed).toBe(0);
    });

    it("chains multiple modifications", () => {
      const a = new ActionActor("Hero", 30, true);
      a.modifySpeed(0.5);
      a.modifySpeed(2);
      expect(a.speed).toBe(30);
    });
  });

  describe("addProgress", () => {
    it("increases progress by given amount", () => {
      const a = new ActionActor("Hero", 30, true);
      a.addProgress(50);
      expect(a.progress).toBe(50);
    });

    it("caps progress at readyThreshold", () => {
      const a = new ActionActor("Hero", 30, true);
      a.addProgress(120);
      expect(a.progress).toBe(100);
    });

    it("accumulates multiple adds", () => {
      const a = new ActionActor("Hero", 30, true);
      a.addProgress(30);
      a.addProgress(40);
      expect(a.progress).toBe(70);
    });

    it("handles zero addition", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 50;
      a.addProgress(0);
      expect(a.progress).toBe(50);
    });
  });

  describe("setProgress", () => {
    it("sets progress to given value", () => {
      const a = new ActionActor("Hero", 30, true);
      a.setProgress(50);
      expect(a.progress).toBe(50);
    });

    it("clamps to zero when negative", () => {
      const a = new ActionActor("Hero", 30, true);
      a.setProgress(-10);
      expect(a.progress).toBe(0);
    });

    it("clamps to readyThreshold when over", () => {
      const a = new ActionActor("Hero", 30, true);
      a.setProgress(200);
      expect(a.progress).toBe(100);
    });

    it("allows zero", () => {
      const a = new ActionActor("Hero", 30, true);
      a.setProgress(0);
      expect(a.progress).toBe(0);
    });
  });

  describe("reset", () => {
    it("sets progress to zero", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 80;
      a.reset();
      expect(a.progress).toBe(0);
    });

    it("does not change speed or name", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 80;
      a.reset();
      expect(a.speed).toBe(30);
      expect(a.name).toBe("Hero");
    });
  });

  describe("isReady", () => {
    it("returns false when progress is below threshold", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 50;
      expect(a.isReady()).toBe(false);
    });

    it("returns true when progress equals threshold", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 100;
      expect(a.isReady()).toBe(true);
    });

    it("returns true when progress exceeds threshold", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 120;
      expect(a.isReady()).toBe(true);
    });

    it("returns false at threshold minus one", () => {
      const a = new ActionActor("Hero", 30, true);
      a.progress = 99;
      expect(a.isReady()).toBe(false);
    });

    it("returns false at zero progress", () => {
      const a = new ActionActor("Hero", 30, true);
      expect(a.isReady()).toBe(false);
    });
  });
});
