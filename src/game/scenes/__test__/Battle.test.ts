import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActionActor } from "../../systems/ActionActor";
import { Battle } from "../Battle";
import * as CONSTS from "../../../constants";
import { ActorPosition, ActorController } from "../../../constants";

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

// Each character card is built from 4 rectangles: the outer card background,
// the progress bar background, the progress fill, and the highlight border.
const RECTS_PER_UI = 4;

function actorRectCalls(
  rectSpy: ReturnType<typeof vi.spyOn>,
  actorIdx: number,
) {
  const base = 1 + actorIdx * RECTS_PER_UI;
  return {
    card: rectSpy.mock.calls[base] as number[],
    bg: rectSpy.mock.calls[base + 1] as number[],
    fill: rectSpy.mock.calls[base + 2] as number[],
    highlight: rectSpy.mock.calls[base + 3] as number[],
  };
}

function createWithRectSpy() {
  const battle = new Battle();
  const rectSpy = vi.spyOn(battle.add, "rectangle");
  battle.create();
  return { battle, rectSpy };
}

describe("Battle scene", () => {
  let scene: Battle;

  beforeEach(() => {
    scene = new Battle();
    scene.create();
  });

  describe("initial state", () => {
    it("actingActor is null before create", () => {
      const battle = new Battle();
      expect(battle.actingActor).toBeNull();
    });

    it("actorsUi is empty before create", () => {
      const battle = new Battle();
      expect(battle.actorsUi).toEqual([]);
    });

    it("creates a Retreat button that transitions to PartyCreation", () => {
      const battle = new Battle();
      const rectSpy = vi.spyOn(battle.add, "rectangle");
      battle.create();

      expect(battle.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Retreat!",
        expect.any(Object),
      );

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      expect(rect.setStrokeStyle).toHaveBeenCalledWith(
        CONSTS.BTN_STROKE_W,
        CONSTS.BTN_STROKE,
      );
      expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });

      const pointerdown = rect.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      expect(pointerdown).toBeTruthy();
      pointerdown![1]();
      expect(battle.scene.start).toHaveBeenCalledWith("PartyCreation");
    });
  });

  describe("completeAction", () => {
    it("resets actingActor to null", () => {
      const actor = makeActor({ name: "Test" });
      actor.progress = 100;
      scene.actingActor = actor;
      scene.completeAction();
      expect(scene.actingActor).toBeNull();
    });

    it("resets the acting actor progress and ready state", () => {
      const actor = makeActor({ name: "Test" });
      actor.progress = 100;
      scene.actingActor = actor;
      scene.completeAction();
      expect(actor.progress).toBe(0);
      expect(actor.isReady()).toBe(false);
      expect(scene.timeline.readyQueue).not.toContain(actor);
    });

    it("does not affect other actors", () => {
      const actor = makeActor({ name: "Actor" });
      const bystander = makeActor({
        name: "Bystander",
        controller: ActorController.ENEMY,
        speed: 25,
      });
      bystander.progress = 50;
      scene.timeline.addActor(bystander);
      scene.actingActor = actor;
      scene.completeAction();
      expect(bystander.progress).toBe(50);
    });

    it("handles being called when no one is acting", () => {
      scene.actingActor = null;
      expect(() => scene.completeAction()).not.toThrow();
      expect(scene.actingActor).toBeNull();
    });
  });

  describe("update - action lifecycle", () => {
    it("starts an action when an actor is in the ready queue", () => {
      const actor = scene.timeline.actors[0];
      scene.timeline.readyQueue.push(actor);

      scene.update(0, 16);
      expect(scene.actingActor).toBe(actor);
    });

    it("removes the acting actor from the ready queue", () => {
      const actor = scene.timeline.actors[0];
      scene.timeline.readyQueue.push(actor);

      scene.update(0, 16);
      expect(scene.timeline.readyQueue).not.toContain(actor);
    });

    it("does not start a new action while one is in progress", () => {
      const acting = scene.timeline.actors[0];
      const queued = scene.timeline.actors[1];
      scene.timeline.readyQueue.push(queued);

      scene.actingActor = acting;
      scene.update(0, 16);
      expect(scene.actingActor).toBe(acting);
      expect(scene.timeline.readyQueue).toContain(queued);
    });

    it("does not advance timeline during action", () => {
      const actor = scene.timeline.actors[0];
      scene.timeline.readyQueue.push(actor);

      scene.update(0, 16);
      expect(scene.actingActor).toBe(actor);

      const timelineSpy = vi.spyOn(scene.timeline, "update");
      scene.update(0, 50000);
      expect(timelineSpy).not.toHaveBeenCalled();
    });

    it("does not start an action when ready queue is empty", () => {
      scene.update(0, 16);
      expect(scene.actingActor).toBeNull();
    });

    it("calls timeline.update with dt converted to seconds", () => {
      const timelineSpy = vi.spyOn(scene.timeline, "update");
      scene.update(0, 500);
      expect(timelineSpy).toHaveBeenCalledWith(0.5);
    });
  });

  describe("update - progress snapshot", () => {
    it("reverts non-ready actors when a new actor becomes ready", () => {
      scene.timeline.actors = [];
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
      scene.timeline.addActor(fast);
      scene.timeline.addActor(slow);
      fast.progress = 10;
      slow.progress = 3;
      const slowBefore = slow.progress;

      // Frame 1: Fast hits 100 and enters ready, slow gets reverted
      scene.update(0, 2000);
      expect(slow.progress).toBe(slowBefore);

      // Frame 2: step pops Fast into action
      scene.update(0, 16);
      expect(scene.actingActor).toBe(fast);
    });

    it("does not revert the actor who became ready", () => {
      scene.timeline.actors = [];
      const speedster = makeActor({ name: "Speedster", speed: 90 });
      const normal = makeActor({
        name: "Normal",
        controller: ActorController.ENEMY,
        speed: 20,
      });
      scene.timeline.addActor(speedster);
      scene.timeline.addActor(normal);

      scene.update(0, 2000);
      expect(speedster.progress).toBe(100);
    });

    it("does not apply revert when no one became ready", () => {
      scene.timeline.actors = [];
      const slowpoke = makeActor({ name: "Slowpoke", speed: 5 });
      const snail = makeActor({
        name: "Snail",
        controller: ActorController.ENEMY,
        speed: 3,
      });
      scene.timeline.addActor(slowpoke);
      scene.timeline.addActor(snail);
      snail.progress = 10;
      const snailBefore = snail.progress;

      scene.update(0, 1000);
      expect(snail.progress).not.toBe(snailBefore);
      expect(snail.progress).toBeGreaterThan(snailBefore);
    });

    // With all actors at zero progress, a single large dt should advance
    // everyone past their threshold without any actor having a snapshot to revert to.
    it("handles all actors already at progress zero", () => {
      scene.timeline.actors = [];
      const first = makeActor({ name: "A", speed: 50 });
      const second = makeActor({
        name: "B",
        controller: ActorController.ENEMY,
        speed: 30,
      });
      scene.timeline.addActor(first);
      scene.timeline.addActor(second);

      expect(() => scene.update(0, 5000)).not.toThrow();
      expect(first.progress).toBe(100);
      expect(second.progress).toBe(100);
    });
  });

  describe("update - acting text", () => {
    it("shows acting text when starting an action", () => {
      const actor = scene.timeline.actors[0];
      scene.timeline.readyQueue.push(actor);

      scene.update(0, 16);
      expect(scene.currentlyActingHeader.setText).toHaveBeenCalledWith(
        expect.stringContaining(actor.alias ?? actor.name),
      );
    });

    it("shows green stroke for player actions", () => {
      const players = scene.timeline.actors.filter(
        (actor) => actor.controller === ActorController.PLAYER,
      );
      scene.timeline.readyQueue.push(players[0]);

      scene.update(0, 16);
      expect(scene.currentlyActingHeader.setStroke).toHaveBeenCalledWith(
        CONSTS.PLAYER_ACTING_STROKE,
        CONSTS.HEADER_STROKE,
      );
    });

    it("shows red stroke for enemy actions", () => {
      const enemies = scene.timeline.actors.filter(
        (actor) => actor.controller !== ActorController.PLAYER,
      );
      scene.timeline.readyQueue.push(enemies[0]);

      scene.update(0, 16);
      expect(scene.currentlyActingHeader.setStroke).toHaveBeenCalledWith(
        CONSTS.ENEMY_ACTING_STROKE,
        CONSTS.HEADER_STROKE,
      );
    });
  });

  describe("updates [READY] and [ACTING] labels", () => {
    it("shows [ACTING] for acting actor, [READY] for others at 100%, plain name for below threshold", () => {
      const fighter = scene.timeline.actors[0];
      const mage = scene.timeline.actors[1];
      const slacker = scene.timeline.actors[2];

      // Set up two actors in ready queue
      fighter.progress = fighter.readyThreshold + 1;
      scene.timeline.readyQueue.push(fighter);
      mage.progress = mage.readyThreshold;
      mage.progress = mage.readyThreshold + 1;
      scene.timeline.readyQueue.push(mage);
      slacker.progress = slacker.readyThreshold - 1; // Just below ready threshold

      scene.update(0, 16);
      // After step(), fighter is popped and becomes acting; mage is still in ready queue
      expect(scene.actingActor).toBe(fighter);

      expect(scene.actorsUi[0].label.setText).toHaveBeenCalledWith(
        "John Doe\nFighter [ACTING]",
      );
      expect(scene.actorsUi[1].label.setText).toHaveBeenCalledWith(
        "Jane Doe\nMage [READY]",
      );
      expect(scene.actorsUi[2].label.setText).toHaveBeenCalledWith(
        "Gertrude\nSlacker",
      );
    });

    it("preserves actors at 100% progress when another actor joins ready queue", () => {
      scene.timeline.actors = [];
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
      scene.timeline.addActor(twin1);
      scene.timeline.addActor(twin2);

      twin1.progress = 100;
      twin2.progress = 100;

      scene.timeline.readyQueue.push(twin1);

      scene.update(0, 16);
      expect(scene.actingActor).toBe(twin1);

      expect(twin2.isReady()).toBe(true);
      expect(twin2.progress).toBe(100);
    });

    it("displays [READY] for any actor at threshold regardless of queue", () => {
      const ready = scene.timeline.actors[0];
      const atThreshold = scene.timeline.actors[1];

      ready.progress = ready.readyThreshold;
      scene.timeline.readyQueue.push(ready);

      atThreshold.progress = atThreshold.readyThreshold;

      scene.update(0, 16);

      expect(scene.actorsUi[0].label.setText).toHaveBeenCalledWith(
        "John Doe\nFighter [ACTING]",
      );

      // Actor at 100% shows [READY] even if not yet in the ready queue
      expect(scene.actorsUi[1].label.setText).toHaveBeenCalledWith(
        "Jane Doe\nMage [READY]",
      );
    });
  });

  describe("update with acting actor", () => {
    it("other actor does not progress while someone is acting", () => {
      scene.timeline.actors = [];
      const fastActor = makeActor({ name: "Fast", speed: 100 });
      const slowEnemy = makeActor({
        name: "Slow",
        controller: ActorController.ENEMY,
        speed: 60,
      });
      scene.timeline.addActor(fastActor);
      scene.timeline.addActor(slowEnemy);

      scene.update(0, 1000);
      // fastActor is now in ready queue (100%), not yet acting
      expect(scene.actingActor).toBeNull();

      scene.update(0, 16);
      // step pops fastActor into action
      expect(scene.actingActor).toBe(fastActor);

      // No progress during action, slowEnemy should stay at 0
      scene.update(0, 2000);
      expect(slowEnemy.progress).toBe(0);
    });
  });

  describe("full cycle", () => {
    it("actor progresses, becomes ready, acts, then resets", () => {
      const actor = scene.timeline.actors[0];

      // Frame 1: step (empty) → update → actor becomes ready, [READY] shown
      scene.update(0, 10000);
      expect(scene.actingActor).toBeNull();

      // Frame 2: step pops actor into action
      scene.update(0, 16);
      expect(scene.actingActor).toBe(actor);

      // Frame 3: acting, return early
      scene.update(0, 16);
      expect(scene.actingActor).toBe(actor);

      // Complete the action
      scene.completeAction();
      expect(scene.actingActor).toBeNull();
      expect(actor.progress).toBe(0);
    });

    it("continues scheduling after action completes", () => {
      const actor = scene.timeline.actors[0];

      // First big update puts all actors into the ready queue
      scene.update(0, 10000);
      expect(scene.actingActor).toBeNull();
      expect(scene.timeline.readyQueue.length).toBeGreaterThan(0);

      // Step pops first actor (Fighter) into action
      scene.update(0, 16);
      expect(scene.actingActor).toBe(actor);

      scene.completeAction();
      expect(scene.actingActor).toBeNull();

      // System continues — next actor from the queue steps in
      scene.update(0, 16);
      expect(scene.actingActor).not.toBeNull();
      expect(scene.actingActor).not.toBe(actor);
    });
  });

  describe("actor UI elements", () => {
    it("every card has HP, SP, and EP stat texts", () => {
      expect(scene.actorsUi.length).toBeGreaterThan(0);
      for (const actorUI of scene.actorsUi) {
        expect(actorUI.healthTxt).toBeTruthy();
        expect(actorUI.staminaTxt).toBeTruthy();
        expect(actorUI.energyTxt).toBeTruthy();
      }
    });

    it("stat texts show colored HP, SP, EP values", () => {
      scene.update(0, 16);
      for (const actorUI of scene.actorsUi) {
        expect(actorUI.healthTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^HP \d+\/\d+$/),
        );
        expect(actorUI.staminaTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^SP \d+\/\d+$/),
        );
        expect(actorUI.energyTxt.setText).toHaveBeenCalledWith(
          expect.stringMatching(/^EP \d+\/\d+$/),
        );
      }
    });

    it("syncUI updates fill.width proportional to actor progress", () => {
      const elem = scene.actorsUi[0];
      const actor = elem.actor;
      elem.bg.width = CONSTS.CARD_W;
      actor.progress = 50;
      scene.actingActor = actor;
      scene.update(0, 16);
      const expected =
        (50 / actor.readyThreshold) * (CONSTS.CARD_W - CONSTS.FILL_INSET * 2);
      expect(elem.fill.width).toBeCloseTo(expected);
    });

    it("fill.width is 0 when actor has no progress", () => {
      const elem = scene.actorsUi[0];
      const actor = elem.actor;
      elem.bg.width = CONSTS.CARD_W;
      actor.progress = 0;
      scene.actingActor = actor;
      scene.update(0, 16);
      expect(elem.fill.width).toBe(0);
    });

    it("fill.width is max when actor is at threshold", () => {
      const elem = scene.actorsUi[0];
      const actor = elem.actor;
      elem.bg.width = CONSTS.CARD_W;
      actor.progress = actor.readyThreshold;
      scene.actingActor = actor;
      scene.update(0, 16);
      const expected = CONSTS.CARD_W - CONSTS.FILL_INSET * 2;
      expect(elem.fill.width).toBeCloseTo(expected);
    });
  });

  describe("highlight dimensions", () => {
    it("highlight encompasses the full card, not just the progress bar", () => {
      const { battle, rectSpy } = createWithRectSpy();

      for (let idx = 0; idx < battle.actorsUi.length; idx++) {
        const rects = actorRectCalls(rectSpy, idx);

        // Same center — card center at (x + w/2, y + 1)
        expect(rects.highlight[0]).toBe(rects.card[0]);
        expect(rects.highlight[1]).toBe(rects.card[1]);

        // Highlight is HIGHLIGHT_EXTRA bigger on all sides
        expect(rects.highlight[2]).toBe(rects.card[2] + CONSTS.HIGHLIGHT_EXTRA);
        expect(rects.highlight[3]).toBe(rects.card[3] + CONSTS.HIGHLIGHT_EXTRA);
      }
    });

    it("center differs from progress bar when not card-aligned", () => {
      const { battle, rectSpy } = createWithRectSpy();

      for (let idx = 0; idx < battle.actorsUi.length; idx++) {
        const rects = actorRectCalls(rectSpy, idx);
        expect(rects.highlight[1]).not.toBe(rects.bg[1]);
      }
    });
  });

  describe("card overlap", () => {
    it("same-side character cards do not overlap one another", () => {
      const { battle, rectSpy } = createWithRectSpy();

      const playerCenters: { x: number; y: number }[] = [];
      const enemyCenters: { x: number; y: number }[] = [];
      for (let idx = 0; idx < battle.actorsUi.length; idx++) {
        const card = actorRectCalls(rectSpy, idx).card;
        const isPlayer =
          battle.actorsUi[idx].actor.controller ===
          CONSTS.ActorController.PLAYER;
        (isPlayer ? playerCenters : enemyCenters).push({
          x: card[0],
          y: card[1],
        });
      }

      const halfW = (CONSTS.CARD_W + CONSTS.CARD_EXTRA_W) / 2;
      const halfH = CONSTS.CARD_HEIGHT / 2;

      // Verify no two cards on the same side overlap by checking pairwise
      // bounding-box collisions using their centers and card dimensions.
      const checkGroup = (centers: { x: number; y: number }[]) => {
        for (let firstIdx = 0; firstIdx < centers.length; firstIdx++) {
          for (
            let secondIdx = firstIdx + 1;
            secondIdx < centers.length;
            secondIdx++
          ) {
            const dx = Math.abs(centers[firstIdx].x - centers[secondIdx].x);
            const dy = Math.abs(centers[firstIdx].y - centers[secondIdx].y);
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
      const battle = new Battle();
      const textSpy = vi.spyOn(battle.add, "text");
      battle.create();

      const laneHeaders = textSpy.mock.calls.filter(
        (call: unknown[]) => (call[1] as number) === CONSTS.LANE_HEADER_Y,
      );
      expect(laneHeaders.length).toBe(CONSTS.PRIMARY_LANES.length * 2);
    });

    it("does not draw FLANK separator when no flank actors exist", () => {
      const battle = new Battle();
      battle.players = battle.players.filter(
        (player) => player.position !== ActorPosition.FLANK,
      );
      battle.enemies = battle.enemies.filter(
        (enemy) => enemy.position !== ActorPosition.FLANK,
      );
      const textSpy = vi.spyOn(battle.add, "text");
      battle.create();

      const flankCalls = textSpy.mock.calls.filter(
        (call: unknown[]) => (call[2] as string) === "FLANK",
      );
      expect(flankCalls.length).toBe(0);
    });
  });

  describe("flank positioning", () => {
    it("positions flank cards below non-flank cards", () => {
      const { battle, rectSpy } = createWithRectSpy();

      let lastNonFlankY = -1;
      let firstFlankY = -1;

      for (let idx = 0; idx < battle.actorsUi.length; idx++) {
        const card = actorRectCalls(rectSpy, idx).card;
        const pos = battle.actorsUi[idx].actor.position;
        if (pos === ActorPosition.FLANK) {
          if (firstFlankY === -1) firstFlankY = card[1];
        } else {
          lastNonFlankY = card[1];
        }
      }

      expect(firstFlankY).toBeGreaterThan(lastNonFlankY);
    });

    it("handles zero flank actors on both sides", () => {
      const battle = new Battle();
      battle.players = battle.players.filter(
        (player) => player.position !== ActorPosition.FLANK,
      );
      battle.enemies = battle.enemies.filter(
        (enemy) => enemy.position !== ActorPosition.FLANK,
      );

      expect(() => battle.create()).not.toThrow();
      expect(battle.actorsUi.length).toBe(
        battle.players.length + battle.enemies.length,
      );
    });

    it("handles all actors in FLANK position", () => {
      const battle = new Battle();
      battle.players = battle.players.map((player) => ({
        ...player,
        position: ActorPosition.FLANK,
      }));
      battle.enemies = battle.enemies.map((enemy) => ({
        ...enemy,
        position: ActorPosition.FLANK,
      }));

      expect(() => battle.create()).not.toThrow();
      expect(battle.actorsUi.length).toBe(
        battle.players.length + battle.enemies.length,
      );
    });

    it("both sides use independent maxLane for flank y-offset", () => {
      const battle = new Battle();
      const makeTestActor = (name: string, pos: ActorPosition) => ({
        name,
        alias: name,
        speed: 10,
        health: 100,
        stamina: 100,
        energy: 100,
        position: pos,
      });
      battle.players = [
        makeTestActor("Solo", ActorPosition.FRONTLINE),
        makeTestActor("Flanker", ActorPosition.FLANK),
      ];
      battle.enemies = [
        makeTestActor("Horde1", ActorPosition.FRONTLINE),
        makeTestActor("Horde2", ActorPosition.FRONTLINE),
        makeTestActor("Horde3", ActorPosition.FRONTLINE),
        makeTestActor("Horde Flanker", ActorPosition.FLANK),
      ];

      const rectSpy = vi.spyOn(battle.add, "rectangle");
      expect(() => battle.create()).not.toThrow();
      const playerFlank = battle.actorsUi.find(
        (actorUI) => actorUI.actor.name === "Flanker",
      );
      const enemyFlank = battle.actorsUi.find(
        (actorUI) => actorUI.actor.name === "Horde Flanker",
      );
      expect(playerFlank).toBeTruthy();
      expect(enemyFlank).toBeTruthy();
      const playerRect = actorRectCalls(
        rectSpy,
        battle.actorsUi.indexOf(playerFlank!),
      );
      const enemyRect = actorRectCalls(
        rectSpy,
        battle.actorsUi.indexOf(enemyFlank!),
      );
      expect(enemyRect.card[1]).toBeGreaterThan(playerRect.card[1]);
    });
  });
});
