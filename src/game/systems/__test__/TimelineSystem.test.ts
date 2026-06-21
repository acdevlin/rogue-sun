import { describe, it, expect } from "vitest";
import { TimelineSystem } from "../TimelineSystem";
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

const makeActors = (
  timeline: TimelineSystem,
  actors: { name: string; speed: number; controller: ActorController }[],
) => {
  for (const actor of actors) {
    timeline.addActor(makeActor(actor));
  }
};

describe("TimelineSystem", () => {
  describe("Adding and removing actors", () => {
    it("addActor registers actor", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.addActor(actor);
      expect(timeline.actors).toHaveLength(1);
      expect(timeline.actors[0]).toBe(actor);
    });

    it("removeActor removes from actors and ready", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.addActor(actor);
      timeline.readyQueue.push(actor);
      timeline.removeActor(actor);
      expect(timeline.actors).not.toContain(actor);
      expect(timeline.readyQueue).not.toContain(actor);
    });

    it("removeActor handles actor not in ready", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.addActor(actor);
      timeline.removeActor(actor);
      expect(timeline.actors).toHaveLength(0);
    });

    it("removeActor handles non-existent actor gracefully", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.addActor(actor);
      const other = makeActor({
        controller: ActorController.ENEMY,
        name: "Ghost",
        speed: 10,
      });
      timeline.removeActor(other);
      expect(timeline.actors).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("advances progress based on speed and delta time", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 30, controller: ActorController.PLAYER },
      ]);
      timeline.update(1);
      expect(timeline.actors[0].progress).toBeCloseTo(30);
    });

    it("advances progress correctly over multiple calls", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 25, controller: ActorController.PLAYER },
      ]);
      timeline.update(0.5);
      timeline.update(0.5);
      expect(timeline.actors[0].progress).toBeCloseTo(25);
    });

    it("marks actor ready and pushes to queue when hitting threshold", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 100, controller: ActorController.PLAYER },
      ]);
      timeline.update(1);
      const actor = timeline.actors[0];
      expect(actor.progress).toBe(100);
      expect(actor.isReady()).toBe(true);
      expect(timeline.readyQueue).toContain(actor);
    });

    it("pushes all actors who hit threshold to ready queue", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Fast", speed: 100, controller: ActorController.PLAYER },
        { name: "Slow", speed: 10, controller: ActorController.ENEMY },
      ]);
      timeline.update(1);
      expect(timeline.readyQueue).toHaveLength(1);
      expect(timeline.actors[1].progress).toBe(10);
    });

    it("does nothing when ready queue already has items", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Waiting", speed: 30, controller: ActorController.PLAYER },
        {
          name: "ShouldNotProgress",
          speed: 30,
          controller: ActorController.ENEMY,
        },
      ]);
      const waiting = timeline.actors[0];
      timeline.readyQueue.push(waiting);
      timeline.update(1);
      expect(timeline.actors[1].progress).toBe(0);
    });

    it("pushes multiple actors to ready when they all hit threshold", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "A", speed: 100, controller: ActorController.PLAYER },
        { name: "B", speed: 100, controller: ActorController.ENEMY },
      ]);
      timeline.update(1);
      expect(timeline.readyQueue).toHaveLength(2);
    });

    it("handles fractional progress correctly", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 33, controller: ActorController.PLAYER },
      ]);
      timeline.update(0.3);
      expect(timeline.actors[0].progress).toBeCloseTo(9.9);
    });

    it("caps progress at threshold when overshooting", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 200, controller: ActorController.PLAYER },
      ]);
      timeline.update(1);
      expect(timeline.actors[0].progress).toBe(100);
    });

    it("advances multiple actors before one becomes ready", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Slowpoke", speed: 5, controller: ActorController.PLAYER },
        { name: "AlsoSlow", speed: 7, controller: ActorController.ENEMY },
      ]);
      timeline.update(1);
      expect(timeline.actors[0].progress).toBeCloseTo(5);
      expect(timeline.actors[1].progress).toBeCloseTo(7);
      expect(timeline.readyQueue).toHaveLength(0);
    });
  });

  describe("step", () => {
    it("returns null when ready is empty", () => {
      const timeline = new TimelineSystem();
      expect(timeline.step()).toBeNull();
    });

    it("returns and removes the next ready actor", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      const other = makeActor({
        controller: ActorController.ENEMY,
        name: "Villain",
        speed: 25,
      });
      timeline.readyQueue.push(actor);
      timeline.readyQueue.push(other);
      expect(timeline.step()).toBe(actor);
      expect(timeline.readyQueue).toHaveLength(1);
      expect(timeline.readyQueue[0]).toBe(other);
    });

    it("returns null after all ready actors are consumed", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.readyQueue.push(actor);
      timeline.step();
      expect(timeline.step()).toBeNull();
    });

    it("is idempotent when called on empty queue", () => {
      const timeline = new TimelineSystem();
      expect(timeline.step()).toBeNull();
      expect(timeline.step()).toBeNull();
    });

    it("removes actor from ready queue on step", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      timeline.readyQueue.push(actor);
      timeline.step();
      expect(timeline.readyQueue).toHaveLength(0);
    });
  });

  describe("integration: update + step", () => {
    it("full cycle: accumulate → ready → step → reset → accumulate", () => {
      const timeline = new TimelineSystem();
      makeActors(timeline, [
        { name: "Hero", speed: 50, controller: ActorController.PLAYER },
      ]);
      const actor = timeline.actors[0];

      timeline.update(2);
      expect(actor.progress).toBe(100);
      expect(actor.isReady()).toBe(true);

      const popped = timeline.step();
      expect(popped).toBe(actor);
      expect(timeline.readyQueue).toHaveLength(0);

      actor.reset();
      expect(actor.progress).toBe(0);
      expect(actor.isReady()).toBe(false);

      timeline.update(1);
      expect(actor.progress).toBeCloseTo(50);
    });

    it("second actor becomes ready after first exhausted", () => {
      const timeline = new TimelineSystem();
      const actor = makeActor();
      const other = makeActor({
        controller: ActorController.ENEMY,
        name: "B",
        speed: 50,
      });
      timeline.addActor(actor);
      timeline.addActor(other);
      other.progress = 90;

      timeline.update(1);
      expect(other.isReady()).toBe(true);
      expect(other.progress).toBe(100);

      timeline.step();
      expect(timeline.readyQueue).toHaveLength(0);
      other.reset();
      expect(other.progress).toBe(0);

      timeline.update(3);
      expect(actor.progress).toBe(100);
      expect(actor.isReady()).toBe(true);
    });
  });
});
