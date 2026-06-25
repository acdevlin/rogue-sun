import { Scene, GameObjects } from "phaser";
import { ActionActor } from "../systems/ActionActor";
import { TimelineSystem } from "../systems/TimelineSystem";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";
import { PlayerActorData } from "../data/PlayerActorData";
import { players as playerData } from "../data/playerActorClasses";
import { enemies as enemyData } from "../data/enemyActorClasses";
import {
  createBtn,
  createLaneBlock,
  createActorCard,
} from "../utils/UiElements";

interface ActorUI {
  actor: ActionActor;
  card: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  bg: Phaser.GameObjects.Rectangle;
  highlight: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  healthTxt: Phaser.GameObjects.Text;
  staminaTxt: Phaser.GameObjects.Text;
  energyTxt: Phaser.GameObjects.Text;
}

/**
 * The main battle scene, showing individual actors (both enemies and allies) taking
 * turns based on their speed and readiness threshold.
 */
export class Battle extends Scene {
  timeline: TimelineSystem;
  actorsUi: ActorUI[] = [];
  currentlyActingHeader: Phaser.GameObjects.Text;
  currentlyActingBg: Phaser.GameObjects.Rectangle;
  actingActor: ActionActor | null = null;
  retreatBtn: GameObjects.Text;
  retreatBtnBg: GameObjects.Rectangle;

  // XXX temporary hardcoded actor data for testing purposes.
  players = playerData;
  enemies = enemyData;

  /**
   * Default constructor.
   */
  constructor() {
    super("Battle");
  }

  /**
   * Initializes all game objects, including timeline system and UI elements.
   *
   * @param playerData - Optional player data passed from the PartyCreation scene
   *   (e.g. a custom party composition). Falls back to the default player roster.
   */
  create(playerData?: { players?: PlayerActorData[] }) {
    this.actorsUi = [];
    this.actingActor = null;
    this.timeline = new TimelineSystem();
    if (playerData?.players) this.players = playerData.players;
    const { width } = this.cameras.main;
    this.createActingHeader(width / 2);

    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;

    const pCounts: Record<string, number> = {};
    const eCounts: Record<string, number> = {};
    const flankActors: { actor: ActionActor; isPlayer: boolean }[] = [];

    // Creates an ActionActor from raw data and registers it on the timeline.
    const createActor = (data: PlayerActorData, controller: string) => {
      const actor = new ActionActor({
        controller,
        name: data.name,
        alias: data.alias,
        speed: data.speed,
        health: data.health,
        stamina: data.stamina,
        energy: data.energy,
        position: data.position,
      });
      this.timeline.addActor(actor);
      return actor;
    };

    // Places a non-flank actor card in the correct lane column (BACKLINE/MIDLINE/FRONTLINE)
    // and stacks it vertically based on how many cards are already in that lane.
    const positionNonFlank = (
      data: PlayerActorData,
      actor: ActionActor,
      laneCounts: Record<string, number>,
      isEnemy: boolean,
    ) => {
      const laneIdx = CONSTS.PRIMARY_LANES.indexOf(data.position);
      const x = isEnemy
        ? width - CONSTS.PLAYER_X - cardW - laneIdx * CONSTS.LANE_OFFSET
        : CONSTS.PLAYER_X + laneIdx * CONSTS.LANE_OFFSET;
      const y = CONSTS.CARD_START_Y + (laneCounts[data.position] ?? 0) * gap;
      laneCounts[data.position] = (laneCounts[data.position] ?? 0) + 1;
      this.createActorUIElement(actor, x, y, cardW, CONSTS.PROGRESS_FILL);
    };

    // Processes all actors for one side (player or enemy): creates each actor,
    // positions non-flank ones immediately, and queues flank actors for later.
    const deploySide = (
      data: PlayerActorData[],
      controller: string,
      laneCounts: Record<string, number>,
    ) => {
      const isPlayer = controller === CONSTS.ActorController.PLAYER;
      for (const entry of data) {
        const actor = createActor(entry, controller);
        if (entry.position === CONSTS.ActorPosition.FLANK) {
          flankActors.push({ actor, isPlayer });
        } else {
          positionNonFlank(entry, actor, laneCounts, !isPlayer);
        }
      }
    };

    deploySide(this.players, CONSTS.ActorController.PLAYER, pCounts);
    deploySide(this.enemies, CONSTS.ActorController.ENEMY, eCounts);

    const playerMaxLane = Math.max(...Object.values(pCounts), 0);
    const enemyMaxLane = Math.max(...Object.values(eCounts), 0);
    let playerFlankIdx = 0;
    let enemyFlankIdx = 0;

    // Position flank actors in a horizontal row across primary lane columns,
    // starting from FRONTLINE inward. All flank cards sit below the last
    // non-flank card with a FLANK_OFFSET gap.
    for (const { actor, isPlayer } of flankActors) {
      const idx = isPlayer ? playerFlankIdx++ : enemyFlankIdx++;
      const maxLane = isPlayer ? playerMaxLane : enemyMaxLane;
      const lidx = Math.max(0, CONSTS.NUM_LANES - 1 - idx);
      const x = isPlayer
        ? CONSTS.PLAYER_X + lidx * CONSTS.LANE_OFFSET
        : width - CONSTS.PLAYER_X - cardW - lidx * CONSTS.LANE_OFFSET;
      const y = CONSTS.CARD_START_Y + maxLane * gap + CONSTS.FLANK_OFFSET;
      this.createActorUIElement(actor, x, y, cardW, CONSTS.PROGRESS_FILL);
    }

    const pLaneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    createLaneBlock({
      scene: this,
      laneLeft: CONSTS.PLAYER_X,
      cardW,
      gap,
      maxLane: playerMaxLane,
      flankIdx: playerFlankIdx,
      headerY: CONSTS.LANE_HEADER_Y,
      startY: CONSTS.CARD_START_Y,
      controller: CONSTS.ActorController.PLAYER,
    });
    createLaneBlock({
      scene: this,
      laneLeft: width - CONSTS.PLAYER_X - pLaneSpan,
      cardW,
      gap,
      maxLane: enemyMaxLane,
      flankIdx: enemyFlankIdx,
      headerY: CONSTS.LANE_HEADER_Y,
      startY: CONSTS.CARD_START_Y,
      controller: CONSTS.ActorController.ENEMY,
    });

    const y = this.cameras.main.height - CONSTS.BTN_BOTTOM_OFFSET;
    const btn = createBtn({
      scene: this,
      cx: width / 2,
      y,
      label: "Retreat!",
      onClick: () => this.scene.start("PartyCreation"),
    });
    this.retreatBtn = btn.label;
    this.retreatBtnBg = btn.bg;
  }

  /**
   * Creates the "currently acting" header text and background rectangle.
   *
   * @param centerX Horizontal center of the scene in pixels.
   */
  private createActingHeader(centerX: number) {
    this.currentlyActingHeader = this.add
      .text(centerX, CONSTS.HEADER_Y, "", {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: CONSTS.HEADER_FONT,
        color: CONSTS.HEADER_TEXT_COLOR,
        stroke: CONSTS.HEADER_STROKE_COLOR,
        strokeThickness: CONSTS.HEADER_STROKE,
        align: "center",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    this.currentlyActingBg = this.add
      .rectangle(centerX, CONSTS.HEADER_Y, 0, 0, CONSTS.HEADER_BG)
      .setOrigin(0.5)
      .setDepth(-1)
      .setVisible(false);
  }

  /**
   * Creates UI elements for an actor.
   *
   * @param actor The ActionActor to create UI for.
   * @param x The x-coordinate of the top-left corner of the UI card.
   * @param y The y-coordinate of the top-left corner of the UI card.
   * @param width The width of the UI card.
   * @param color The color of the progress bar fill.
   */
  createActorUIElement(
    actor: ActionActor,
    x: number,
    y: number,
    width: number,
    color: number,
  ) {
    // Use shared card creation (card rect, progress bar, label, stats)
    const cardUi = createActorCard({
      scene: this,
      x,
      y,
      w: width,
      name: actor.name,
      alias: actor.alias,
      health: actor.health,
      stamina: actor.stamina,
      energy: actor.energy,
      fillColor: color,
    });

    // Battle-only highlight border for the acting actor
    const highlight = this.add
      .rectangle(
        x + width / 2,
        y + CONSTS.CARD_Y_OFFSET,
        width + CONSTS.CARD_EXTRA_W + CONSTS.HIGHLIGHT_EXTRA,
        CONSTS.CARD_HEIGHT + CONSTS.HIGHLIGHT_EXTRA,
      )
      .setStrokeStyle(CONSTS.HIGHLIGHT_STROKE_W, CONSTS.HIGHLIGHT_COLOR)
      .setOrigin(0.5)
      .setDepth(CONSTS.HIGHLIGHT_DEPTH)
      .setVisible(false);

    this.actorsUi.push({
      actor,
      card: cardUi.card,
      fill: cardUi.fill,
      bg: cardUi.progressBg,
      highlight,
      label: cardUi.label,
      healthTxt: cardUi.healthTxt,
      staminaTxt: cardUi.staminaTxt,
      energyTxt: cardUi.energyTxt,
    });
  }

  /**
   * Overrides the default update loop to handle timeline progression and actor turns.
   *
   * @param _t Unused parameter for current time, required by Phaser's update signature.
   * @param deltaMs Delta time in milliseconds since the last update, used to advance the timeline.
   */
  update(_t: number, deltaMs: number) {
    if (this.actingActor) {
      this.syncUI();
      return;
    }

    const next = this.timeline.step();
    if (next) {
      this.startActorTurn(next);
      return;
    }

    this.advanceTimelineAndHandleReadyQueue(deltaMs);
  }

  /**
   * Starts an actor's turn by setting up the UI and scheduling when their action completes
   */
  private startActorTurn(actor: ActionActor) {
    this.actingActor = actor;
    const text = `${actor.alias ?? actor.name}'s turn!`;
    this.currentlyActingHeader
      .setText(text)
      .setStroke(
        actor.controller === CONSTS.ActorController.PLAYER
          ? CONSTS.PLAYER_ACTING_STROKE
          : CONSTS.ENEMY_ACTING_STROKE,
        CONSTS.HEADER_STROKE,
      );
    const headerWidth = this.currentlyActingHeader.width;
    this.currentlyActingBg
      .setSize(
        headerWidth + CONSTS.HEADER_BG_PAD_X,
        this.currentlyActingHeader.height + CONSTS.HEADER_BG_PAD_Y,
      )
      .setVisible(true);
    this.syncUI();
    this.time.delayedCall(CONSTS.TURN_DELAY, () => this.completeAction());
  }

  /**
   * Advances the timeline and handles ready queue updates.
   *
   * @param deltaMs The delta time in milliseconds to advance the timeline.
   */
  private advanceTimelineAndHandleReadyQueue(deltaMs: number) {
    const snapshot = new Map<ActionActor, number>();
    for (const actor of this.timeline.actors) {
      snapshot.set(actor, actor.progress);
    }

    const lenBefore = this.timeline.readyQueue.length;

    this.timeline.update(deltaMs / CONSTS.MS_TO_S);

    const lenAfter = this.timeline.readyQueue.length;

    if (lenAfter > lenBefore) {
      for (const actor of this.timeline.actors) {
        if (!this.timeline.readyQueue.includes(actor) && !actor.isReady()) {
          actor.setProgress(snapshot.get(actor)!);
        }
      }
    }

    this.syncUI();
  }

  /**
   * Updates UI elements for all actors at the current timeline state.
   */
  private syncUI() {
    for (const actorUi of this.actorsUi) {
      const actor = actorUi.actor;
      actorUi.fill.width =
        (actor.progress / actor.readyThreshold) *
        (actorUi.bg.width - CONSTS.FILL_INSET * 2);

      actorUi.healthTxt.setText(`HP ${actor.health}/${actor.health}`);
      actorUi.staminaTxt.setText(`SP ${actor.stamina}/${actor.stamina}`);
      actorUi.energyTxt.setText(`EP ${actor.energy}/${actor.energy}`);

      const acting = actorUi.actor === this.actingActor;
      const ready = actorUi.actor.isReady();

      // Decorate actor's class with ready/acting status. Also display alias for player characters.
      const actorNameSuffix = acting ? " [ACTING]" : ready ? " [READY]" : "";
      const actorNameBase = actorUi.actor.alias
        ? `${actorUi.actor.alias}\n${actorUi.actor.name}`
        : actorUi.actor.name;
      const actorName = `${actorNameBase}${actorNameSuffix}`;
      actorUi.label.setText(actorName);
      actorUi.label.setColor(
        acting || ready ? CONSTS.LABEL_COLOR_ACTIVE : CONSTS.LABEL_COLOR_IDLE,
      );
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
      this.syncUI();
    }
  }
}
