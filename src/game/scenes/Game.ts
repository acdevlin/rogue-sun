import { Scene } from "phaser";
import { ActionActor } from "../systems/ActionActor";
import { TimelineSystem } from "../systems/TimelineSystem";

interface ActorUI {
  actor: ActionActor;
  card: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  bg: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  pct: Phaser.GameObjects.Text;
}
/**
 * The main game scene, showing individual actors (both enemies and allies) taking
 * turns based on their speed and readiness threshold.
 */
export class Game extends Scene {
  timeline: TimelineSystem;
  actorsUi: ActorUI[] = [];
  currentlyActingHeader: Phaser.GameObjects.Text;
  currentlyActingBg: Phaser.GameObjects.Rectangle;
  actingActor: ActionActor | null = null;

  /**
   * Default constructor.
   */
  constructor() {
    super("Game");
  }

  /**
   * Initializes all game objects, including timeline system and UI elements.
   */
  create() {
    this.timeline = new TimelineSystem();
    const { width } = this.cameras.main;
    const cx = width / 2;

    this.currentlyActingHeader = this.add
      .text(cx, 20, "", {
        fontFamily: "Arial Black",
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5);
    this.currentlyActingBg = this.add
      .rectangle(cx, 20, 0, 0, 0xcccccc)
      .setOrigin(0.5)
      .setDepth(-1)
      .setVisible(false);

    const players = [
      { name: "Fighter", speed: 30 },
      { name: "Mage", speed: 22 },
      { name: "Thief", speed: 35 },
      { name: "Slacker", speed: 6 },
    ];
    const enemies = [
      { name: "Goblin", speed: 28 },
      { name: "Orc", speed: 12 },
      { name: "Skeleton", speed: 20 },
      { name: "Dragon", speed: 8 },
      { name: "Bat", speed: 40 },
      { name: "Slime", speed: 15 },
      { name: "Twin 1", speed: 25 },
      { name: "Twin 2", speed: 25 },
    ];

    const bw = 200;
    const bh = 20;
    const gap = 56;
    const sy = 80;

    players.forEach((d, i) => {
      const a = new ActionActor(d.name, d.speed, true);
      this.timeline.addActor(a);
      this.createActorUIElement(a, 40, sy + i * gap, bw, bh, 0x00aa00);
    });
    enemies.forEach((d, i) => {
      const a = new ActionActor(d.name, d.speed, false);
      this.timeline.addActor(a);
      this.createActorUIElement(
        a,
        width - 40 - bw,
        sy + i * gap,
        bw,
        bh,
        0xaa0000,
      );
    });
  }

  /**
   * Creates UI elements for an actor.
   *
   * @param actor The ActionActor to create UI for.
   * @param x The x-coordinate of the top-left corner of the UI card.
   * @param y The y-coordinate of the top-left corner of the UI card.
   * @param width The width of the UI card.
   * @param height The height of the UI card.
   * @param color The color of the progress bar fill.
   */
  createActorUIElement(
    actor: ActionActor,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number,
  ) {
    const card = this.add
      .rectangle(x + width / 2, y + 1, width + 14, 46, 0x2a2a2a)
      .setStrokeStyle(1, 0x444444)
      .setOrigin(0.5)
      .setDepth(-2);
    const bg = this.add
      .rectangle(x + width / 2, y + height / 2, width, height, 0x222222)
      .setOrigin(0.5);
    const fill = this.add
      .rectangle(x + 1, y + 1, 0, height - 2, color)
      .setOrigin(0, 0);
    const highlight = this.add
      .rectangle(x + width / 2, y + height / 2, width + 6, height + 6)
      .setStrokeStyle(2, 0xffff00)
      .setOrigin(0.5)
      .setDepth(-1)
      .setVisible(false);
    const label = this.add.text(x + 4, y - 18, actor.name, {
      fontSize: "13px",
      color: "#ccc",
    });
    const pct = this.add
      .text(x + width - 2, y + height / 2, "0%", {
        fontSize: "12px",
        color: "#fff",
      })
      .setOrigin(1, 0.5);
    this.actorsUi.push({ actor, card, fill, bg, highlight, label, pct });
  }

  /**
   * Overrides the default update loop to handle timeline progression and actor turns.
   *
   * @param _t Unused parameter for current time, required by Phaser's update signature.
   * @param dt Delta time in milliseconds since the last update, used to advance the timeline.
   */
  update(_t: number, dt: number) {
    if (this.actingActor) {
      // Actor is currently acting, update the UI and wait for their turn to complete
      this.syncUI();
      return;
    }

    const next = this.timeline.step();
    if (next) {
      // Another actor can take their turn in next timeline step
      this.startActorTurn(next);
      return;
    }

    // Advance the timeline and process any actors moving to the ready queue
    this.advanceTimelineAndHandleReadyQueue(dt);
  }

  /**
   * Starts an actor's turn by setting up the UI and scheduling when their action completes
   */
  private startActorTurn(actor: ActionActor) {
    this.actingActor = actor;
    const text = `${actor.name}'s turn!`;
    this.currentlyActingHeader
      .setText(text)
      .setStroke(actor.isPlayer ? "#44ff44" : "#ff4444", 6);
    const w = this.currentlyActingHeader.width;
    this.currentlyActingBg
      .setSize(w + 20, this.currentlyActingHeader.height + 10)
      .setVisible(true);
    this.syncUI();
    this.time.delayedCall(500, () => this.completeAction());
  }

  /**
   * Advances the timeline and handles ready queue updates.
   *
   * @param dt The delta time in milliseconds to advance the timeline.
   */
  private advanceTimelineAndHandleReadyQueue(dt: number) {
    // Snapshot current progress for all actors before updating
    const progressSnapshot = new Map<ActionActor, number>();
    for (const actor of this.timeline.actors) {
      progressSnapshot.set(actor, actor.progress);
    }

    const readyQueueLengthBefore = this.timeline.readyQueue.length;

    // Update timeline; this may move some actors to the ready queue
    this.timeline.update(dt / 1000);

    const readyQueueLengthAfter = this.timeline.readyQueue.length;

    // If new actors joined the ready queue, restore their progress
    // but preserve actors that are already at the ready threshold
    if (readyQueueLengthAfter > readyQueueLengthBefore) {
      for (const actor of this.timeline.actors) {
        if (!this.timeline.readyQueue.includes(actor) && !actor.isReady()) {
          actor.setProgress(progressSnapshot.get(actor)!);
        }
      }
    }

    this.syncUI();
  }

  /**
   * Updates UI elements for all actors at the current timeline state.
   */
  private syncUI() {
    // Update all actor UI elements to reflect their current state
    for (const actorUi of this.actorsUi) {
      // Calculate progress percentage (0-100%)
      const pct = actorUi.actor.progress / actorUi.actor.readyThreshold;

      // Update the progress bar fill width
      actorUi.fill.width = pct * (actorUi.bg.width - 2);
      actorUi.pct.setText(`${Math.round(pct * 100)}%`);

      // Determine if actor is acting or ready
      const acting = actorUi.actor === this.actingActor;
      const ready = actorUi.actor.isReady();

      let actorName: string;
      if (acting) {
        actorName = `${actorUi.actor.name} [ACTING]`;
      } else if (ready) {
        actorName = `${actorUi.actor.name} [READY]`;
      } else {
        actorName = actorUi.actor.name;
      }
      actorUi.label.setText(actorName);
      actorUi.label.setColor(acting || ready ? "#ffff00" : "#cccccc");
      actorUi.highlight.setVisible(acting);
    }
  }

  /**
   * Cleanup after an actor's turn is completed.
   */
  completeAction() {
    if (this.actingActor) {
      this.actingActor.reset();
      this.actingActor = null;
      this.currentlyActingHeader.setText("");
      this.currentlyActingBg.setVisible(false);
      // Immediately sync UI to show any remaining ready actors
      this.syncUI();
    }
  }
}
