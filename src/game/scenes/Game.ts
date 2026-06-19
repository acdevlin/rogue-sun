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

export class Game extends Scene {
  timeline: TimelineSystem;
  actors: ActorUI[] = [];
  acting: Phaser.GameObjects.Text;
  actingBg: Phaser.GameObjects.Rectangle;
  actingActor: ActionActor | null = null;

  constructor() {
    super("Game");
  }

  create() {
    this.timeline = new TimelineSystem();
    const { width } = this.cameras.main;
    const cx = width / 2;

    this.acting = this.add
      .text(cx, 20, "", {
        fontFamily: "Arial Black",
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5);
    this.actingBg = this.add
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
      this.createUI(a, 40, sy + i * gap, bw, bh, 0x00aa00);
    });
    enemies.forEach((d, i) => {
      const a = new ActionActor(d.name, d.speed, false);
      this.timeline.addActor(a);
      this.createUI(a, width - 40 - bw, sy + i * gap, bw, bh, 0xaa0000);
    });
  }

  createUI(
    a: ActionActor,
    x: number,
    y: number,
    w: number,
    h: number,
    c: number,
  ) {
    const card = this.add
      .rectangle(x + w / 2, y + 1, w + 14, 46, 0x2a2a2a)
      .setStrokeStyle(1, 0x444444)
      .setOrigin(0.5)
      .setDepth(-2);
    const bg = this.add
      .rectangle(x + w / 2, y + h / 2, w, h, 0x222222)
      .setOrigin(0.5);
    const fill = this.add.rectangle(x + 1, y + 1, 0, h - 2, c).setOrigin(0, 0);
    const highlight = this.add
      .rectangle(x + w / 2, y + h / 2, w + 6, h + 6)
      .setStrokeStyle(2, 0xffff00)
      .setOrigin(0.5)
      .setDepth(-1)
      .setVisible(false);
    const label = this.add.text(x + 4, y - 18, a.name, {
      fontSize: "13px",
      color: "#ccc",
    });
    const pct = this.add
      .text(x + w - 2, y + h / 2, "0%", { fontSize: "12px", color: "#fff" })
      .setOrigin(1, 0.5);
    this.actors.push({ actor: a, card, fill, bg, highlight, label, pct });
  }

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
    this.acting
      .setText(text)
      .setStroke(actor.isPlayer ? "#44ff44" : "#ff4444", 6);
    const w = this.acting.width;
    this.actingBg.setSize(w + 20, this.acting.height + 10).setVisible(true);
    this.syncUI();
    this.time.delayedCall(500, () => this.completeAction());
  }

  /**
   * Advances the timeline by dt seconds and preserves progress for actors
   * that are not newly added to the ready queue
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

  private syncUI() {
    // Update all actor UI elements to reflect their current state
    for (const ui of this.actors) {
      // Calculate progress percentage (0-100%)
      const pct = ui.actor.progress / ui.actor.readyThreshold;

      // Update the progress bar fill width
      ui.fill.width = pct * (ui.bg.width - 2);
      ui.pct.setText(`${Math.round(pct * 100)}%`);

      // Determine if actor is acting or ready
      const acting = ui.actor === this.actingActor;
      const ready = ui.actor.isReady();

      let actorName: string;
      if (acting) {
        actorName = `${ui.actor.name} [ACTING]`;
      } else if (ready) {
        actorName = `${ui.actor.name} [READY]`;
      } else {
        actorName = ui.actor.name;
      }
      ui.label.setText(actorName);
      ui.label.setColor(acting || ready ? "#ffff00" : "#cccccc");
      ui.highlight.setVisible(acting);
    }
  }

  completeAction() {
    if (this.actingActor) {
      this.actingActor.reset();
      this.actingActor = null;
      this.acting.setText("");
      this.actingBg.setVisible(false);
      // Immediately sync UI to show any remaining ready actors
      this.syncUI();
    }
  }
}
