import { describe, it, expect } from "vitest";
import { ActionActor } from "../ActionActor";
import { ActorPosition, ActorController } from "../../../constants";

const makeActor = (
  overrides?: Partial<{
    controller: ActorController;
    name: string;
    speed: number;
    health: number;
    stamina: number;
    energy: number;
    position: ActorPosition;
  }>,
) =>
  new ActionActor({
    controller: ActorController.PLAYER,
    name: "Hero",
    speed: 30,
    health: 100,
    stamina: 100,
    energy: 100,
    position: ActorPosition.FRONTLINE,
    ...overrides,
  });

describe("ActionActor", () => {
  it("initializes with given values", () => {
    const a = makeActor();
    expect(a.name).toBe("Hero");
    expect(a.speed).toBe(30);
    expect(a.controller).toBe(ActorController.PLAYER);
    expect(a.health).toBe(100);
    expect(a.stamina).toBe(100);
    expect(a.energy).toBe(100);
    expect(a.progress).toBe(0);
    expect(a.readyThreshold).toBe(100);
  });

  it("initializes non-player actor correctly", () => {
    const a = makeActor({
      controller: ActorController.ENEMY,
      name: "Goblin",
      speed: 20,
    });
    expect(a.name).toBe("Goblin");
    expect(a.speed).toBe(20);
    expect(a.controller).toBe(ActorController.ENEMY);
    expect(a.health).toBe(100);
    expect(a.stamina).toBe(100);
    expect(a.energy).toBe(100);
  });

  describe("stats", () => {
    it("accepts custom health, stamina, and energy", () => {
      const a = makeActor({
        name: "Tank",
        speed: 20,
        health: 150,
        stamina: 75,
        energy: 50,
      });
      expect(a.health).toBe(150);
      expect(a.stamina).toBe(75);
      expect(a.energy).toBe(50);
    });

    it("allows setting health directly", () => {
      const a = makeActor();
      a.health = 50;
      expect(a.health).toBe(50);
    });

    it("allows setting stamina directly", () => {
      const a = makeActor();
      a.stamina = 25;
      expect(a.stamina).toBe(25);
    });

    it("allows setting energy directly", () => {
      const a = makeActor();
      a.energy = 80;
      expect(a.energy).toBe(80);
    });

    it("accepts zero values for all stats", () => {
      const a = makeActor({
        name: "Ghost",
        health: 0,
        stamina: 0,
        energy: 0,
      });
      expect(a.health).toBe(0);
      expect(a.stamina).toBe(0);
      expect(a.energy).toBe(0);
    });

    it("fields are independent from each other", () => {
      const a = makeActor();
      a.health = 10;
      a.stamina = 20;
      a.energy = 30;
      expect(a.health).toBe(10);
      expect(a.stamina).toBe(20);
      expect(a.energy).toBe(30);
    });
  });

  describe("modifySpeed", () => {
    it("multiplies speed by factor", () => {
      const a = makeActor();
      a.modifySpeed(0.5);
      expect(a.speed).toBe(15);
    });

    it("increases speed when factor > 1", () => {
      const a = makeActor();
      a.modifySpeed(2);
      expect(a.speed).toBe(60);
    });

    it("can set speed to zero", () => {
      const a = makeActor();
      a.modifySpeed(0);
      expect(a.speed).toBe(0);
    });

    it("chains multiple modifications", () => {
      const a = makeActor();
      a.modifySpeed(0.5);
      a.modifySpeed(2);
      expect(a.speed).toBe(30);
    });
  });

  describe("addProgress", () => {
    it("increases progress by given amount", () => {
      const a = makeActor();
      a.addProgress(50);
      expect(a.progress).toBe(50);
    });

    it("caps progress at readyThreshold", () => {
      const a = makeActor();
      a.addProgress(120);
      expect(a.progress).toBe(100);
    });

    it("accumulates multiple adds", () => {
      const a = makeActor();
      a.addProgress(30);
      a.addProgress(40);
      expect(a.progress).toBe(70);
    });

    it("handles zero addition", () => {
      const a = makeActor();
      a.progress = 50;
      a.addProgress(0);
      expect(a.progress).toBe(50);
    });
  });

  describe("setProgress", () => {
    it("sets progress to given value", () => {
      const a = makeActor();
      a.setProgress(50);
      expect(a.progress).toBe(50);
    });

    it("clamps to zero when negative", () => {
      const a = makeActor();
      a.setProgress(-10);
      expect(a.progress).toBe(0);
    });

    it("clamps to readyThreshold when over", () => {
      const a = makeActor();
      a.setProgress(200);
      expect(a.progress).toBe(100);
    });

    it("allows zero", () => {
      const a = makeActor();
      a.setProgress(0);
      expect(a.progress).toBe(0);
    });
  });

  describe("reset", () => {
    it("sets progress to zero", () => {
      const a = makeActor();
      a.progress = 80;
      a.reset();
      expect(a.progress).toBe(0);
    });

    it("does not change speed or name", () => {
      const a = makeActor();
      a.progress = 80;
      a.reset();
      expect(a.speed).toBe(30);
      expect(a.name).toBe("Hero");
    });
  });

  describe("isReady", () => {
    it("returns false when progress is below threshold", () => {
      const a = makeActor();
      a.progress = 50;
      expect(a.isReady()).toBe(false);
    });

    it("returns true when progress equals threshold", () => {
      const a = makeActor();
      a.progress = 100;
      expect(a.isReady()).toBe(true);
    });

    it("returns true when progress exceeds threshold", () => {
      const a = makeActor();
      a.progress = 120;
      expect(a.isReady()).toBe(true);
    });

    it("returns false at threshold minus one", () => {
      const a = makeActor();
      a.progress = 99;
      expect(a.isReady()).toBe(false);
    });

    it("returns false at zero progress", () => {
      const a = makeActor();
      expect(a.isReady()).toBe(false);
    });
  });
});
