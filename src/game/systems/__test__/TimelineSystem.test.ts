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
  ts: TimelineSystem,
  actors: { name: string; speed: number; controller: ActorController }[],
) => {
  for (const a of actors) {
    ts.addActor(makeActor(a));
  }
};

describe("TimelineSystem", () => {
  describe("Adding and removing actors", () => {
    it("addActor registers actor", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.addActor(a);
      expect(ts.actors).toHaveLength(1);
      expect(ts.actors[0]).toBe(a);
    });

    it("removeActor removes from actors and ready", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.addActor(a);
      ts.readyQueue.push(a);
      ts.removeActor(a);
      expect(ts.actors).not.toContain(a);
      expect(ts.readyQueue).not.toContain(a);
    });

    it("removeActor handles actor not in ready", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.addActor(a);
      ts.removeActor(a);
      expect(ts.actors).toHaveLength(0);
    });

    it("removeActor handles non-existent actor gracefully", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.addActor(a);
      const b = makeActor({
        controller: ActorController.ENEMY,
        name: "Ghost",
        speed: 10,
      });
      ts.removeActor(b);
      expect(ts.actors).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("advances progress based on speed and delta time", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 30, controller: ActorController.PLAYER },
      ]);
      ts.update(1);
      expect(ts.actors[0].progress).toBeCloseTo(30);
    });

    it("advances progress correctly over multiple calls", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 25, controller: ActorController.PLAYER },
      ]);
      ts.update(0.5);
      ts.update(0.5);
      expect(ts.actors[0].progress).toBeCloseTo(25);
    });

    it("marks actor ready and pushes to queue when hitting threshold", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 100, controller: ActorController.PLAYER },
      ]);
      ts.update(1);
      const a = ts.actors[0];
      expect(a.progress).toBe(100);
      expect(a.isReady()).toBe(true);
      expect(ts.readyQueue).toContain(a);
    });

    it("pushes all actors who hit threshold to ready queue", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Fast", speed: 100, controller: ActorController.PLAYER },
        { name: "Slow", speed: 10, controller: ActorController.ENEMY },
      ]);
      ts.update(1);
      expect(ts.readyQueue).toHaveLength(1);
      expect(ts.actors[1].progress).toBe(10);
    });

    it("does nothing when ready queue already has items", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Waiting", speed: 30, controller: ActorController.PLAYER },
        {
          name: "ShouldNotProgress",
          speed: 30,
          controller: ActorController.ENEMY,
        },
      ]);
      const w = ts.actors[0];
      ts.readyQueue.push(w);
      ts.update(1);
      expect(ts.actors[1].progress).toBe(0);
    });

    it("pushes multiple actors to ready when they all hit threshold", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "A", speed: 100, controller: ActorController.PLAYER },
        { name: "B", speed: 100, controller: ActorController.ENEMY },
      ]);
      ts.update(1);
      expect(ts.readyQueue).toHaveLength(2);
    });

    it("handles fractional progress correctly", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 33, controller: ActorController.PLAYER },
      ]);
      ts.update(0.3);
      expect(ts.actors[0].progress).toBeCloseTo(9.9);
    });

    it("caps progress at threshold when overshooting", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 200, controller: ActorController.PLAYER },
      ]);
      ts.update(1);
      expect(ts.actors[0].progress).toBe(100);
    });

    it("advances multiple actors before one becomes ready", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Slowpoke", speed: 5, controller: ActorController.PLAYER },
        { name: "AlsoSlow", speed: 7, controller: ActorController.ENEMY },
      ]);
      ts.update(1);
      expect(ts.actors[0].progress).toBeCloseTo(5);
      expect(ts.actors[1].progress).toBeCloseTo(7);
      expect(ts.readyQueue).toHaveLength(0);
    });
  });

  describe("step", () => {
    it("returns null when ready is empty", () => {
      const ts = new TimelineSystem();
      expect(ts.step()).toBeNull();
    });

    it("returns and removes the next ready actor", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      const b = makeActor({
        controller: ActorController.ENEMY,
        name: "Villain",
        speed: 25,
      });
      ts.readyQueue.push(a);
      ts.readyQueue.push(b);
      expect(ts.step()).toBe(a);
      expect(ts.readyQueue).toHaveLength(1);
      expect(ts.readyQueue[0]).toBe(b);
    });

    it("returns null after all ready actors are consumed", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.readyQueue.push(a);
      ts.step();
      expect(ts.step()).toBeNull();
    });

    it("is idempotent when called on empty queue", () => {
      const ts = new TimelineSystem();
      expect(ts.step()).toBeNull();
      expect(ts.step()).toBeNull();
    });

    it("removes actor from ready queue on step", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      ts.readyQueue.push(a);
      ts.step();
      expect(ts.readyQueue).toHaveLength(0);
    });
  });

  describe("integration: update + step", () => {
    it("full cycle: accumulate → ready → step → reset → accumulate", () => {
      const ts = new TimelineSystem();
      makeActors(ts, [
        { name: "Hero", speed: 50, controller: ActorController.PLAYER },
      ]);
      const a = ts.actors[0];

      ts.update(2);
      expect(a.progress).toBe(100);
      expect(a.isReady()).toBe(true);

      const popped = ts.step();
      expect(popped).toBe(a);
      expect(ts.readyQueue).toHaveLength(0);

      a.reset();
      expect(a.progress).toBe(0);
      expect(a.isReady()).toBe(false);

      ts.update(1);
      expect(a.progress).toBeCloseTo(50);
    });

    it("second actor becomes ready after first exhausted", () => {
      const ts = new TimelineSystem();
      const a = makeActor();
      const b = makeActor({
        controller: ActorController.ENEMY,
        name: "B",
        speed: 50,
      });
      ts.addActor(a);
      ts.addActor(b);
      b.progress = 90;

      ts.update(1);
      expect(b.isReady()).toBe(true);
      expect(b.progress).toBe(100);

      ts.step();
      expect(ts.readyQueue).toHaveLength(0);
      b.reset();
      expect(b.progress).toBe(0);

      ts.update(3);
      expect(a.progress).toBe(100);
      expect(a.isReady()).toBe(true);
    });
  });
});
