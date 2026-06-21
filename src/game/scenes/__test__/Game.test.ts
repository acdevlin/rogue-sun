import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionActor } from "../../systems/ActionActor";
import { Game } from "../Game";
import * as CONSTS from "../../../constants";
import { ActorPosition, ActorController } from "../../../constants";

vi.mock("phaser", () => {
  const mockObj = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setVisible: vi.fn().mockReturnThis(),
    setText: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setSize: vi.fn().mockReturnThis(),
    setStroke: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    width: 0,
    height: 0,
  });

  return {
    AUTO: 0,
    Scale: {
      RESIZE: "resize",
      Center: { CENTER_BOTH: "center-both" },
    },
    Scene: class MockScene {
      key: string;
      cameras = {
        main: { width: 800, height: 600, centerX: 400, centerY: 300 },
      };
      add = {
        text: vi.fn(() => mockObj()),
        rectangle: vi.fn(() => mockObj()),
      };
      time = {
        delayedCall: vi.fn(),
      };
      scene = { start: vi.fn() };

      constructor(key: string) {
        this.key = key;
      }
    },
  };
});

type ActorParams = {
  controller: ActorController;
  name: string;
  speed: number;
  health: number;
  stamina: number;
  energy: number;
  position: ActorPosition;
};

const makeActor = (overrides: Partial<ActorParams> = {}): ActionActor =>
  new ActionActor({
    controller: ActorController.PLAYER,
    name: "Test",
    speed: 30,
    health: 100,
    stamina: 100,
    energy: 100,
    position: ActorPosition.FRONTLINE,
    ...overrides,
  });

describe("Game scene", () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    game.create();
  });

  describe("initial state", () => {
    it("actingActor is null before create", () => {
      const g = new Game();
      expect(g.actingActor).toBeNull();
    });

    it("actorsUi is empty before create", () => {
      const g = new Game();
      expect(g.actorsUi).toEqual([]);
    });

    it("creates a Retreat button that transitions to PartyCreation", () => {
      const g = new Game();
      const rectSpy = vi.spyOn(g.add, "rectangle");
      g.create();

      expect(g.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Retreat!",
        expect.any(Object),
      );

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      expect(rect.setStrokeStyle).toHaveBeenCalledWith(2, 0xffffff);
      expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });

      const pointerdown = rect.on.mock.calls.find(
        (call: unknown[]) => call[0] === "pointerdown",
      );
      expect(pointerdown).toBeTruthy();
      pointerdown![1]();
      expect(g.scene.start).toHaveBeenCalledWith("PartyCreation");
    });
  });

  describe("completeAction", () => {
    it("resets actingActor to null", () => {
      const a = makeActor({ name: "Test" });
      a.progress = 100;
      game.actingActor = a;
      game.completeAction();
      expect(game.actingActor).toBeNull();
    });

    it("resets the acting actor progress and ready state", () => {
      const a = makeActor({ name: "Test" });
      a.progress = 100;
      game.actingActor = a;
      game.completeAction();
      expect(a.progress).toBe(0);
      expect(a.isReady()).toBe(false);
      expect(game.timeline.readyQueue).not.toContain(a);
    });

    it("does not affect other actors", () => {
      const a = makeActor({ name: "Actor" });
      const b = makeActor({
        name: "Bystander",
        controller: ActorController.ENEMY,
        speed: 25,
      });
      b.progress = 50;
      game.timeline.addActor(b);
      game.actingActor = a;
      game.completeAction();
      expect(b.progress).toBe(50);
    });

    it("handles being called when no one is acting", () => {
      game.actingActor = null;
      expect(() => game.completeAction()).not.toThrow();
      expect(game.actingActor).toBeNull();
    });
  });

  describe("update - action lifecycle", () => {
    it("starts an action when an actor is in the ready queue", () => {
      const a = game.timeline.actors[0];
      game.timeline.readyQueue.push(a);

      game.update(0, 16);
      expect(game.actingActor).toBe(a);
    });

    it("removes the acting actor from the ready queue", () => {
      const a = game.timeline.actors[0];
      game.timeline.readyQueue.push(a);

      game.update(0, 16);
      expect(game.timeline.readyQueue).not.toContain(a);
    });

    it("does not start a new action while one is in progress", () => {
      const a = game.timeline.actors[0];
      const b = game.timeline.actors[1];
      game.timeline.readyQueue.push(b);

      game.actingActor = a;
      game.update(0, 16);
      expect(game.actingActor).toBe(a);
      expect(game.timeline.readyQueue).toContain(b);
    });

    it("does not advance timeline during action", () => {
      const a = game.timeline.actors[0];
      game.timeline.readyQueue.push(a);

      game.update(0, 16);
      expect(game.actingActor).toBe(a);

      const spy = vi.spyOn(game.timeline, "update");
      game.update(0, 50000);
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not start an action when ready queue is empty", () => {
      game.update(0, 16);
      expect(game.actingActor).toBeNull();
    });

    it("calls timeline.update with dt converted to seconds", () => {
      const spy = vi.spyOn(game.timeline, "update");
      game.update(0, 500);
      expect(spy).toHaveBeenCalledWith(0.5);
    });
  });

  describe("update - progress snapshot", () => {
    it("reverts non-ready actors when a new actor becomes ready", () => {
      game.timeline.actors = [];
      const fast = makeActor({
        name: "Fast",
        controller: ActorController.PLAYER,
        speed: 80,
      });
      const slow = makeActor({
        name: "Slow",
        controller: ActorController.ENEMY,
        speed: 5,
      });
      game.timeline.addActor(fast);
      game.timeline.addActor(slow);
      fast.progress = 10;
      slow.progress = 3;
      const slowBefore = slow.progress;

      // Frame 1: Fast hits 100 and enters ready, slow gets reverted
      game.update(0, 2000);
      expect(slow.progress).toBe(slowBefore);

      // Frame 2: step pops Fast into action
      game.update(0, 16);
      expect(game.actingActor).toBe(fast);
    });

    it("does not revert the actor who became ready", () => {
      game.timeline.actors = [];
      const a = makeActor({ name: "Speedster", speed: 90 });
      const b = makeActor({
        name: "Normal",
        controller: ActorController.ENEMY,
        speed: 20,
      });
      game.timeline.addActor(a);
      game.timeline.addActor(b);

      game.update(0, 2000);
      expect(a.progress).toBe(100);
    });

    it("does not apply revert when no one became ready", () => {
      game.timeline.actors = [];
      const a = makeActor({ name: "Slowpoke", speed: 5 });
      const b = makeActor({
        name: "Snail",
        controller: ActorController.ENEMY,
        speed: 3,
      });
      game.timeline.addActor(a);
      game.timeline.addActor(b);
      b.progress = 10;
      const bBefore = b.progress;

      game.update(0, 1000);
      expect(b.progress).not.toBe(bBefore);
      expect(b.progress).toBeGreaterThan(bBefore);
    });

    it("handles all actors already at progress zero", () => {
      game.timeline.actors = [];
      const a = makeActor({ name: "A", speed: 50 });
      const b = makeActor({
        name: "B",
        controller: ActorController.ENEMY,
        speed: 30,
      });
      game.timeline.addActor(a);
      game.timeline.addActor(b);

      expect(() => game.update(0, 5000)).not.toThrow();
      expect(a.progress).toBe(100);
      expect(b.progress).toBe(100);
    });
  });

  describe("update - acting text", () => {
    it("shows acting text when starting an action", () => {
      const a = game.timeline.actors[0];
      game.timeline.readyQueue.push(a);

      game.update(0, 16);
      expect(game.currentlyActingHeader.setText).toHaveBeenCalledWith(
        expect.stringContaining(a.name),
      );
    });

    it("shows green stroke for player actions", () => {
      const players = game.timeline.actors.filter(
        (a) => a.controller === ActorController.PLAYER,
      );
      game.timeline.readyQueue.push(players[0]);

      game.update(0, 16);
      expect(game.currentlyActingHeader.setStroke).toHaveBeenCalledWith(
        "#44ff44",
        6,
      );
    });

    it("shows red stroke for enemy actions", () => {
      const enemies = game.timeline.actors.filter(
        (a) => a.controller !== ActorController.PLAYER,
      );
      game.timeline.readyQueue.push(enemies[0]);

      game.update(0, 16);
      expect(game.currentlyActingHeader.setStroke).toHaveBeenCalledWith(
        "#ff4444",
        6,
      );
    });
  });

  describe("updates [READY] and [ACTING] labels", () => {
    it("shows [ACTING] for acting actor, [READY] for others at 100%, plain name for below threshold", () => {
      const a = game.timeline.actors[0];
      const b = game.timeline.actors[1];
      const c = game.timeline.actors[2];

      // Set up two actors in ready queue
      a.progress = a.readyThreshold + 1;
      game.timeline.readyQueue.push(a);
      b.progress = b.readyThreshold;
      b.progress = b.readyThreshold + 1;
      game.timeline.readyQueue.push(b);
      c.progress = c.readyThreshold - 1; // Just below ready threshold

      game.update(0, 16);
      // After step(), a is popped and becomes acting; b is still in ready queue
      expect(game.actingActor).toBe(a);

      expect(game.actorsUi[0].label.setText).toHaveBeenCalledWith(
        "Fighter [ACTING]",
      );
      expect(game.actorsUi[1].label.setText).toHaveBeenCalledWith(
        "Mage [READY]",
      );
      expect(game.actorsUi[2].label.setText).toHaveBeenCalledWith("Slacker");
    });

    it("preserves actors at 100% progress when another actor joins ready queue", () => {
      // Test the core fix: the progress revert logic should NOT revert
      // actors that have reached 100%, even if not in the ready queue yet.
      // This addresses the twin enemy scenario where same-speed actors both
      // reach 100% but only one joins ready queue per update.
      game.timeline.actors = [];
      const twin1 = makeActor({
        name: "Twin1",
        controller: ActorController.ENEMY,
        speed: 25,
      });
      const twin2 = makeActor({
        name: "Twin2",
        controller: ActorController.ENEMY,
        speed: 25,
      });
      game.timeline.addActor(twin1);
      game.timeline.addActor(twin2);

      // Manually set both to 100% to simulate them reaching threshold
      twin1.progress = 100;
      twin2.progress = 100;

      // Add only one to ready queue (simulating timeline behavior)
      game.timeline.readyQueue.push(twin1);

      // Step twin1 into action
      game.update(0, 16);
      expect(game.actingActor).toBe(twin1);

      // Twin2 should still be at 100% because our fix preserves ready actors
      expect(twin2.isReady()).toBe(true);
      expect(twin2.progress).toBe(100);
    });

    it("displays [READY] for any actor at threshold regardless of queue", () => {
      const ready = game.timeline.actors[0];
      const atThreshold = game.timeline.actors[1];

      ready.progress = ready.readyThreshold;
      game.timeline.readyQueue.push(ready);

      atThreshold.progress = atThreshold.readyThreshold;

      game.update(0, 16);

      expect(game.actorsUi[0].label.setText).toHaveBeenCalledWith(
        "Fighter [ACTING]",
      );

      // Actor at 100% shows [READY] even if not yet in the ready queue
      expect(game.actorsUi[1].label.setText).toHaveBeenCalledWith(
        "Mage [READY]",
      );
    });
  });

  describe("update with acting actor", () => {
    it("other actor does not progress while someone is acting", () => {
      game.timeline.actors = [];
      const a = makeActor({ name: "A", speed: 100 });
      const b = makeActor({
        name: "B",
        controller: ActorController.ENEMY,
        speed: 60,
      });
      game.timeline.addActor(a);
      game.timeline.addActor(b);

      game.update(0, 1000);
      // a is now in ready queue (100%), not yet acting
      expect(game.actingActor).toBeNull();

      game.update(0, 16);
      // step pops a into action
      expect(game.actingActor).toBe(a);

      // No progress during action, b should stay at 0
      game.update(0, 2000);
      expect(b.progress).toBe(0);
    });
  });

  describe("full cycle", () => {
    it("actor progresses, becomes ready, acts, then resets", () => {
      const a = game.timeline.actors[0];

      // Frame 1: step (empty) → update → a becomes ready, [READY] shown
      game.update(0, 10000);
      expect(game.actingActor).toBeNull();

      // Frame 2: step pops a into action
      game.update(0, 16);
      expect(game.actingActor).toBe(a);

      // Frame 3: acting, return early
      game.update(0, 16);
      expect(game.actingActor).toBe(a);

      // Complete the action
      game.completeAction();
      expect(game.actingActor).toBeNull();
      expect(a.progress).toBe(0);
    });

    it("continues scheduling after action completes", () => {
      const a = game.timeline.actors[0];

      // First big update puts all actors into the ready queue
      game.update(0, 10000);
      expect(game.actingActor).toBeNull();
      expect(game.timeline.readyQueue.length).toBeGreaterThan(0);

      // Step pops first actor (Fighter) into action
      game.update(0, 16);
      expect(game.actingActor).toBe(a);

      game.completeAction();
      expect(game.actingActor).toBeNull();

      // System continues — next actor from the queue steps in
      game.update(0, 16);
      expect(game.actingActor).not.toBeNull();
      expect(game.actingActor).not.toBe(a);
    });
  });

  describe("actor UI elements", () => {
    it("every card has HP, SP, and EP stat texts", () => {
      expect(game.actorsUi.length).toBeGreaterThan(0);
      for (const ui of game.actorsUi) {
        expect(ui.healthTxt).toBeTruthy();
        expect(ui.staminaTxt).toBeTruthy();
        expect(ui.energyTxt).toBeTruthy();
      }
    });

    it("stat texts show colored HP, SP, EP values", () => {
      game.update(0, 16);
      for (const ui of game.actorsUi) {
        expect(ui.healthTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^HP \d+\/\d+$/),
        );
        expect(ui.staminaTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^SP \d+\/\d+$/),
        );
        expect(ui.energyTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^EP \d+\/\d+$/),
        );
      }
    });
  });

  describe("highlight dimensions", () => {
    it("highlight encompasses the full card, not just the progress bar", () => {
      const rectSpy = vi.spyOn(game.add, "rectangle");
      game = new Game();
      game.create();

      // Index 0 is currentlyActingBg; each actor creates 4 more: card, bg, fill, highlight
      for (let i = 0; i < game.actorsUi.length; i++) {
        const card = rectSpy.mock.calls[1 + i * 4] as number[];
        const highlight = rectSpy.mock.calls[1 + i * 4 + 3] as number[];

        // Same center — card center at (x + w/2, y + 1)
        expect(highlight[0]).toBe(card[0]);
        expect(highlight[1]).toBe(card[1]);

        // Highlight is HIGHLIGHT_EXTRA bigger on all sides
        expect(highlight[2]).toBe(card[2] + CONSTS.HIGHLIGHT_EXTRA);
        expect(highlight[3]).toBe(card[3] + CONSTS.HIGHLIGHT_EXTRA);
      }
    });

    it("center differs from progress bar when not card-aligned", () => {
      const rectSpy = vi.spyOn(game.add, "rectangle");
      game = new Game();
      game.create();

      // Index 0 is currentlyActingBg; per-actor: 1=card, 2=bg, 3=fill, 4=highlight
      for (let i = 0; i < game.actorsUi.length; i++) {
        const bg = rectSpy.mock.calls[1 + i * 4 + 1] as number[]; // 2nd per-actor rect
        const highlight = rectSpy.mock.calls[1 + i * 4 + 3] as number[]; // 4th per-actor rect
        expect(highlight[1]).not.toBe(bg[1]);
      }
    });
  });

  describe("card overlap", () => {
    it("same-side character cards do not overlap one another", () => {
      const rectSpy = vi.spyOn(game.add, "rectangle");
      game = new Game();
      game.create();

      const playerCenters: { x: number; y: number }[] = [];
      const enemyCenters: { x: number; y: number }[] = [];
      // Index 0 is currentlyActingBg; per-actor: 1=card, 2=bg, 3=fill, 4=highlight
      for (let i = 0; i < game.actorsUi.length; i++) {
        const card = rectSpy.mock.calls[1 + i * 4] as number[];
        const isPlayer =
          game.actorsUi[i].actor.controller === CONSTS.ActorController.PLAYER;
        (isPlayer ? playerCenters : enemyCenters).push({
          x: card[0],
          y: card[1],
        });
      }

      const halfW = (CONSTS.CARD_W + CONSTS.CARD_EXTRA_W) / 2;
      const halfH = CONSTS.CARD_HEIGHT / 2;

      const checkGroup = (centers: { x: number; y: number }[]) => {
        for (let i = 0; i < centers.length; i++) {
          for (let j = i + 1; j < centers.length; j++) {
            const dx = Math.abs(centers[i].x - centers[j].x);
            const dy = Math.abs(centers[i].y - centers[j].y);
            const overlap = dx < halfW + halfW && dy < halfH + halfH;
            expect(overlap).toBe(false);
          }
        }
      };

      checkGroup(playerCenters);
      checkGroup(enemyCenters);
    });
  });

  describe("createLanes", () => {
    it("creates lane header labels for each PRIMARY_LANE on both sides", () => {
      const g = new Game();
      const textSpy = vi.spyOn(g.add, "text");
      g.create();

      const laneHeaders = textSpy.mock.calls.filter(
        (call: unknown[]) => (call[1] as number) === CONSTS.LANE_HEADER_Y,
      );
      expect(laneHeaders.length).toBe(CONSTS.PRIMARY_LANES.length * 2);
    });

    it("does not draw FLANK separator when no flank actors exist", () => {
      const g = new Game();
      g.players = g.players.filter((p) => p.position !== ActorPosition.FLANK);
      g.enemies = g.enemies.filter((e) => e.position !== ActorPosition.FLANK);
      const textSpy = vi.spyOn(g.add, "text");
      g.create();

      const flankCalls = textSpy.mock.calls.filter(
        (call: unknown[]) => (call[2] as string) === "FLANK",
      );
      expect(flankCalls.length).toBe(0);
    });
  });

  describe("flank positioning", () => {
    it("positions flank cards below non-flank cards", () => {
      const g = new Game();
      const rectSpy = vi.spyOn(g.add, "rectangle");
      g.create();

      let lastNonFlankY = -1;
      let firstFlankY = -1;

      for (let i = 0; i < g.actorsUi.length; i++) {
        const card = rectSpy.mock.calls[1 + i * 4] as number[];
        const pos = g.actorsUi[i].actor.position;
        if (pos === ActorPosition.FLANK) {
          if (firstFlankY === -1) firstFlankY = card[1];
        } else {
          lastNonFlankY = card[1];
        }
      }

      expect(firstFlankY).toBeGreaterThan(lastNonFlankY);
    });

    it("handles zero flank actors on both sides", () => {
      const g = new Game();
      g.players = g.players.filter((p) => p.position !== ActorPosition.FLANK);
      g.enemies = g.enemies.filter((e) => e.position !== ActorPosition.FLANK);

      expect(() => g.create()).not.toThrow();
      expect(g.actorsUi.length).toBe(g.players.length + g.enemies.length);
    });

    it("handles all actors in FLANK position", () => {
      const g = new Game();
      g.players = g.players.map((p) => ({
        ...p,
        position: ActorPosition.FLANK,
      }));
      g.enemies = g.enemies.map((e) => ({
        ...e,
        position: ActorPosition.FLANK,
      }));

      expect(() => g.create()).not.toThrow();
      expect(g.actorsUi.length).toBe(g.players.length + g.enemies.length);
    });

    it("both sides use independent maxLane for flank y-offset", () => {
      const g = new Game();
      g.players = [
        {
          name: "Solo",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FRONTLINE,
        },
        {
          name: "Flanker",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FLANK,
        },
      ];
      g.enemies = [
        {
          name: "Horde1",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FRONTLINE,
        },
        {
          name: "Horde2",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FRONTLINE,
        },
        {
          name: "Horde3",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FRONTLINE,
        },
        {
          name: "Horde Flanker",
          speed: 10,
          health: 100,
          stamina: 100,
          energy: 100,
          position: ActorPosition.FLANK,
        },
      ];

      const rectSpy = vi.spyOn(g.add, "rectangle");
      expect(() => g.create()).not.toThrow();
      // Player has 1 non-flank (maxLane=1), enemy has 3 (maxLane=3)
      // Flank actors on different sides should have different y
      const playerFlank = g.actorsUi.find((ui) => ui.actor.name === "Flanker");
      const enemyFlank = g.actorsUi.find(
        (ui) => ui.actor.name === "Horde Flanker",
      );
      expect(playerFlank).toBeTruthy();
      expect(enemyFlank).toBeTruthy();
      // Enemy flank should be lower (more non-flank cards above it)
      const playerCard =
        rectSpy.mock.calls[1 + g.actorsUi.indexOf(playerFlank!) * 4];
      const enemyCard =
        rectSpy.mock.calls[1 + g.actorsUi.indexOf(enemyFlank!) * 4];
      expect((enemyCard as number[])[1]).toBeGreaterThan(
        (playerCard as number[])[1],
      );
    });
  });
});
