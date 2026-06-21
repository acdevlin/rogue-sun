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
    const actor = makeActor();
    expect(actor.name).toBe("Hero");
    expect(actor.speed).toBe(30);
    expect(actor.controller).toBe(ActorController.PLAYER);
    expect(actor.health).toBe(100);
    expect(actor.stamina).toBe(100);
    expect(actor.energy).toBe(100);
    expect(actor.progress).toBe(0);
    expect(actor.readyThreshold).toBe(100);
  });

  it("initializes non-player actor correctly", () => {
    const actor = makeActor({
      controller: ActorController.ENEMY,
      name: "Goblin",
      speed: 20,
    });
    expect(actor.name).toBe("Goblin");
    expect(actor.speed).toBe(20);
    expect(actor.controller).toBe(ActorController.ENEMY);
    expect(actor.health).toBe(100);
    expect(actor.stamina).toBe(100);
    expect(actor.energy).toBe(100);
  });

  describe("stats", () => {
    it("accepts custom health, stamina, and energy", () => {
      const actor = makeActor({
        name: "Tank",
        speed: 20,
        health: 150,
        stamina: 75,
        energy: 50,
      });
      expect(actor.health).toBe(150);
      expect(actor.stamina).toBe(75);
      expect(actor.energy).toBe(50);
    });

    it("allows setting health directly", () => {
      const actor = makeActor();
      actor.health = 50;
      expect(actor.health).toBe(50);
    });

    it("allows setting stamina directly", () => {
      const actor = makeActor();
      actor.stamina = 25;
      expect(actor.stamina).toBe(25);
    });

    it("allows setting energy directly", () => {
      const actor = makeActor();
      actor.energy = 80;
      expect(actor.energy).toBe(80);
    });

    it("accepts zero values for all stats", () => {
      const actor = makeActor({
        name: "Ghost",
        health: 0,
        stamina: 0,
        energy: 0,
      });
      expect(actor.health).toBe(0);
      expect(actor.stamina).toBe(0);
      expect(actor.energy).toBe(0);
    });

    it("fields are independent from each other", () => {
      const actor = makeActor();
      actor.health = 10;
      actor.stamina = 20;
      actor.energy = 30;
      expect(actor.health).toBe(10);
      expect(actor.stamina).toBe(20);
      expect(actor.energy).toBe(30);
    });
  });

  describe("modifySpeed", () => {
    it("multiplies speed by factor", () => {
      const actor = makeActor();
      actor.modifySpeed(0.5);
      expect(actor.speed).toBe(15);
    });

    it("increases speed when factor > 1", () => {
      const actor = makeActor();
      actor.modifySpeed(2);
      expect(actor.speed).toBe(60);
    });

    it("can set speed to zero", () => {
      const actor = makeActor();
      actor.modifySpeed(0);
      expect(actor.speed).toBe(0);
    });

    it("chains multiple modifications", () => {
      const actor = makeActor();
      actor.modifySpeed(0.5);
      actor.modifySpeed(2);
      expect(actor.speed).toBe(30);
    });
  });

  describe("addProgress", () => {
    it("increases progress by given amount", () => {
      const actor = makeActor();
      actor.addProgress(50);
      expect(actor.progress).toBe(50);
    });

    it("caps progress at readyThreshold", () => {
      const actor = makeActor();
      actor.addProgress(120);
      expect(actor.progress).toBe(100);
    });

    it("accumulates multiple adds", () => {
      const actor = makeActor();
      actor.addProgress(30);
      actor.addProgress(40);
      expect(actor.progress).toBe(70);
    });

    it("handles zero addition", () => {
      const actor = makeActor();
      actor.progress = 50;
      actor.addProgress(0);
      expect(actor.progress).toBe(50);
    });
  });

  describe("setProgress", () => {
    it("sets progress to given value", () => {
      const actor = makeActor();
      actor.setProgress(50);
      expect(actor.progress).toBe(50);
    });

    it("clamps to zero when negative", () => {
      const actor = makeActor();
      actor.setProgress(-10);
      expect(actor.progress).toBe(0);
    });

    it("clamps to readyThreshold when over", () => {
      const actor = makeActor();
      actor.setProgress(200);
      expect(actor.progress).toBe(100);
    });

    it("allows zero", () => {
      const actor = makeActor();
      actor.setProgress(0);
      expect(actor.progress).toBe(0);
    });
  });

  describe("reset", () => {
    it("sets progress to zero", () => {
      const actor = makeActor();
      actor.progress = 80;
      actor.reset();
      expect(actor.progress).toBe(0);
    });

    it("does not change speed or name", () => {
      const actor = makeActor();
      actor.progress = 80;
      actor.reset();
      expect(actor.speed).toBe(30);
      expect(actor.name).toBe("Hero");
    });
  });

  describe("isReady", () => {
    it("returns false when progress is below threshold", () => {
      const actor = makeActor();
      actor.progress = 50;
      expect(actor.isReady()).toBe(false);
    });

    it("returns true when progress equals threshold", () => {
      const actor = makeActor();
      actor.progress = 100;
      expect(actor.isReady()).toBe(true);
    });

    it("returns true when progress exceeds threshold", () => {
      const actor = makeActor();
      actor.progress = 120;
      expect(actor.isReady()).toBe(true);
    });

    it("returns false at threshold minus one", () => {
      const actor = makeActor();
      actor.progress = 99;
      expect(actor.isReady()).toBe(false);
    });

    it("returns false at zero progress", () => {
      const actor = makeActor();
      expect(actor.isReady()).toBe(false);
    });
  });
});
