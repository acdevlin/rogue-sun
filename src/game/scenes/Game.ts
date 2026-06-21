import { Scene } from "phaser";
import { ActionActor } from "../systems/ActionActor";
import { TimelineSystem } from "../systems/TimelineSystem";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";

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
 * The main game scene, showing individual actors (both enemies and allies) taking
 * turns based on their speed and readiness threshold.
 */
export class Game extends Scene {
  timeline: TimelineSystem;
  actorsUi: ActorUI[] = [];
  currentlyActingHeader: Phaser.GameObjects.Text;
  currentlyActingBg: Phaser.GameObjects.Rectangle;
  actingActor: ActionActor | null = null;

  // XXX temporary hardcoded actor data for testing purposes.
  players = [
    {
      name: "Fighter",
      speed: CONSTS.SPD_FIGHTER,
      health: 120,
      stamina: 80,
      energy: 50,
      position: CONSTS.ActorPosition.FRONTLINE,
    },
    {
      name: "Mage",
      speed: CONSTS.SPD_MAGE,
      health: 80,
      stamina: 60,
      energy: 120,
      position: CONSTS.ActorPosition.BACKLINE,
    },
    {
      name: "Thief",
      speed: CONSTS.SPD_THIEF,
      health: 90,
      stamina: 120,
      energy: 60,
      position: CONSTS.ActorPosition.FLANK,
    },
    {
      name: "Slacker",
      speed: CONSTS.SPD_SLACKER,
      health: 150,
      stamina: 50,
      energy: 50,
      position: CONSTS.ActorPosition.MIDLINE,
    },
    {
      name: "Summoner",
      speed: CONSTS.SPD_MAGE,
      health: 70,
      stamina: 100,
      energy: 150,
      position: CONSTS.ActorPosition.BACKLINE,
    },
  ];
  enemies = [
    {
      name: "Goblin",
      speed: CONSTS.SPD_GOBLIN,
      health: 60,
      stamina: 40,
      energy: 20,
      position: CONSTS.ActorPosition.FLANK,
    },
    {
      name: "Orc",
      speed: CONSTS.SPD_ORC,
      health: 100,
      stamina: 80,
      energy: 40,
      position: CONSTS.ActorPosition.BACKLINE,
    },
    {
      name: "Skeleton",
      speed: CONSTS.SPD_SKELETON,
      health: 50,
      stamina: 30,
      energy: 30,
      position: CONSTS.ActorPosition.MIDLINE,
    },
    {
      name: "Dragon",
      speed: CONSTS.SPD_DRAGON,
      health: 200,
      stamina: 150,
      energy: 100,
      position: CONSTS.ActorPosition.FLANK,
    },
    {
      name: "Bat",
      speed: CONSTS.SPD_BAT,
      health: 30,
      stamina: 20,
      energy: 10,
      position: CONSTS.ActorPosition.FRONTLINE,
    },
    {
      name: "Slime",
      speed: CONSTS.SPD_SLIME,
      health: 80,
      stamina: 50,
      energy: 20,
      position: CONSTS.ActorPosition.BACKLINE,
    },
    {
      name: "Twin 1",
      speed: CONSTS.SPD_TWIN,
      health: 70,
      stamina: 40,
      energy: 30,
      position: CONSTS.ActorPosition.MIDLINE,
    },
    {
      name: "Twin 2",
      speed: CONSTS.SPD_TWIN,
      health: 70,
      stamina: 40,
      energy: 30,
      position: CONSTS.ActorPosition.MIDLINE,
    },
  ];

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
    this.createActingHeader(width / 2);

    const bw = CONSTS.CARD_W;
    const bh = CONSTS.CARD_H;
    const gap = CONSTS.CARD_GAP;

    const playerLaneCounts: Record<string, number> = {};
    const enemyLaneCounts: Record<string, number> = {};
    const flankActors: { actor: ActionActor; isPlayer: boolean }[] = [];

    // Creates an ActionActor from raw data and registers it on the timeline.
    const createActor = (
      d: (typeof this.players)[number],
      controller: string,
    ) => {
      const a = new ActionActor({
        controller,
        name: d.name,
        speed: d.speed,
        health: d.health,
        stamina: d.stamina,
        energy: d.energy,
        position: d.position,
      });
      this.timeline.addActor(a);
      return a;
    };

    // Places a non-flank actor card in the correct lane column (BACKLINE/MIDLINE/FRONTLINE)
    // and stacks it vertically based on how many cards are already in that lane.
    const positionNonFlank = (
      d: (typeof this.players)[number],
      a: ActionActor,
      laneCounts: Record<string, number>,
      isEnemy: boolean,
    ) => {
      const laneIdx = CONSTS.PRIMARY_LANES.indexOf(d.position);
      const x = isEnemy
        ? width - CONSTS.PLAYER_X - bw - laneIdx * CONSTS.LANE_OFFSET
        : CONSTS.PLAYER_X + laneIdx * CONSTS.LANE_OFFSET;
      const y = CONSTS.CARD_START_Y + (laneCounts[d.position] ?? 0) * gap;
      laneCounts[d.position] = (laneCounts[d.position] ?? 0) + 1;
      this.createActorUIElement(a, x, y, bw, bh, CONSTS.PROGRESS_FILL);
    };

    // Processes all actors for one side (player or enemy): creates each actor,
    // positions non-flank ones immediately, and queues flank actors for later.
    const deployUnitsToSide = (
      data: (typeof this.players)[number][],
      controller: string,
      laneCounts: Record<string, number>,
    ) => {
      const isPlayer = controller === CONSTS.ActorController.PLAYER;
      for (const d of data) {
        const a = createActor(d, controller);
        if (d.position === CONSTS.ActorPosition.FLANK) {
          flankActors.push({ actor: a, isPlayer });
        } else {
          positionNonFlank(d, a, laneCounts, !isPlayer);
        }
      }
    };

    deployUnitsToSide(
      this.players,
      CONSTS.ActorController.PLAYER,
      playerLaneCounts,
    );
    deployUnitsToSide(
      this.enemies,
      CONSTS.ActorController.ENEMY,
      enemyLaneCounts,
    );

    const playerMaxLane = Math.max(...Object.values(playerLaneCounts), 0);
    const enemyMaxLane = Math.max(...Object.values(enemyLaneCounts), 0);
    let playerFlankIdx = 0;
    let enemyFlankIdx = 0;

    // Position flank actors in a horizontal row across primary lane columns,
    // starting from FRONTLINE inward. All flank cards sit below the last
    // non-flank card with a FLANK_OFFSET gap.
    for (const { actor: a, isPlayer } of flankActors) {
      const idx = isPlayer ? playerFlankIdx++ : enemyFlankIdx++;
      const maxLane = isPlayer ? playerMaxLane : enemyMaxLane;
      const lidx = Math.max(0, CONSTS.NUM_LANES - 1 - idx);
      const x = isPlayer
        ? CONSTS.PLAYER_X + lidx * CONSTS.LANE_OFFSET
        : width - CONSTS.PLAYER_X - bw - lidx * CONSTS.LANE_OFFSET;
      const y = CONSTS.CARD_START_Y + maxLane * gap + CONSTS.FLANK_OFFSET;
      this.createActorUIElement(a, x, y, bw, bh, CONSTS.PROGRESS_FILL);
    }

    // Draw lane header labels, horizontal/vertical guide lines, and flank separators.
    this.createLanes({
      bw,
      width,
      gap,
      playerMaxLane,
      playerFlankIdx,
      enemyMaxLane,
      enemyFlankIdx,
    });
  }

  /**
   * Creates the "currently acting" header text and background rectangle.
   *
   * @param cx Horizontal center of the scene in pixels.
   */
  private createActingHeader(cx: number) {
    this.currentlyActingHeader = this.add
      .text(cx, CONSTS.HEADER_Y, "", {
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
      .rectangle(cx, CONSTS.HEADER_Y, 0, 0, CONSTS.HEADER_BG)
      .setOrigin(0.5)
      .setDepth(-1)
      .setVisible(false);
  }

  /**
   * Draws lane headers, guide lines, and flank separators.
   */
  private createLanes(opts: {
    /** Card width in pixels, used for layout alignment. */
    bw: number;
    /** Scene width in pixels, used for enemy-side mirroring. */
    width: number;
    /** Vertical gap between actor cards in pixels. */
    gap: number;
    /** Maximum actor count in any single player lane, used to compute vertical extent. */
    playerMaxLane: number;
    /** Number of player flank actors (0 if none). */
    playerFlankIdx: number;
    /** Maximum actor count in any single enemy lane. */
    enemyMaxLane: number;
    /** Number of enemy flank actors (0 if none). */
    enemyFlankIdx: number;
  }) {
    const {
      bw,
      width,
      gap,
      playerMaxLane,
      playerFlankIdx,
      enemyMaxLane,
      enemyFlankIdx,
    } = opts;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + bw;
    const laneStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: `${CONSTS.LANE_HEADER_FONT}px`,
      color: CONSTS.LANE_HEADER_COLOR,
      resolution: TEXT_RESOLUTION,
    };

    const drawLaneLabel = (cx: number, name: string) => {
      this.add
        .text(cx, CONSTS.LANE_HEADER_Y, name, laneStyle)
        .setOrigin(0.5, 0);
    };

    for (let i = 0; i < CONSTS.NUM_LANES; i++) {
      const name = CONSTS.PRIMARY_LANES[i].toUpperCase();
      drawLaneLabel(CONSTS.PLAYER_X + i * CONSTS.LANE_OFFSET + bw / 2, name);
      drawLaneLabel(
        width - CONSTS.PLAYER_X - bw / 2 - i * CONSTS.LANE_OFFSET,
        name,
      );
    }

    const sepY =
      CONSTS.LANE_HEADER_Y + CONSTS.LANE_HEADER_FONT + CONSTS.LANE_HEADER_SEP_Y;
    const halfGap = (CONSTS.LANE_OFFSET - bw) / 2;
    const pad = CONSTS.CARD_Y_OFFSET + CONSTS.CARD_HEIGHT / 2;

    const pBot =
      playerFlankIdx > 0
        ? CONSTS.CARD_START_Y +
          Math.max(0, playerMaxLane - 1) * gap +
          CONSTS.FLANK_OFFSET / 2
        : CONSTS.CARD_START_Y + Math.max(0, playerMaxLane - 1) * gap;

    const eBot =
      enemyFlankIdx > 0
        ? CONSTS.CARD_START_Y +
          Math.max(0, enemyMaxLane - 1) * gap +
          CONSTS.FLANK_OFFSET / 2
        : CONSTS.CARD_START_Y + Math.max(0, enemyMaxLane - 1) * gap;

    const drawLineHorizontal = (cx: number) => {
      this.add
        .rectangle(
          cx,
          sepY,
          laneSpan,
          CONSTS.LANE_LINE_W,
          CONSTS.LANE_LINE_COLOR,
        )
        .setOrigin(0.5);
    };

    const drawLineVertical = (x: number, bot: number) => {
      const len = bot + pad - sepY;
      this.add
        .rectangle(
          x,
          sepY + len / 2,
          CONSTS.LANE_LINE_W,
          len,
          CONSTS.LANE_LINE_COLOR,
        )
        .setOrigin(0.5);
    };

    drawLineHorizontal(CONSTS.PLAYER_X + laneSpan / 2);
    drawLineHorizontal(width - CONSTS.PLAYER_X - laneSpan / 2);

    for (let j = 0; j < CONSTS.NUM_LANES - 1; j++) {
      drawLineVertical(
        CONSTS.PLAYER_X + bw + halfGap + j * CONSTS.LANE_OFFSET,
        pBot,
      );
      drawLineVertical(
        width - CONSTS.PLAYER_X - bw - halfGap - j * CONSTS.LANE_OFFSET,
        eBot,
      );
    }

    const drawFlankSection = (
      sideLeft: number,
      sideRight: number,
      flankIdx: number,
      nonFlankY: number,
    ) => {
      if (flankIdx === 0) return;
      const flankSepY = nonFlankY + pad + CONSTS.FLANK_OFFSET / 2;
      const cx = (sideLeft + sideRight) / 2;
      const label = this.add
        .text(cx, flankSepY, "FLANK", laneStyle)
        .setOrigin(0.5);
      const gapHalf =
        (label.width || CONSTS.FLANK_LABEL_FALLBACK_W) / 2 +
        CONSTS.FLANK_LABEL_PAD;

      this.add
        .rectangle(
          (cx - gapHalf + sideLeft) / 2,
          flankSepY,
          cx - gapHalf - sideLeft,
          CONSTS.LANE_LINE_W,
          CONSTS.LANE_LINE_COLOR,
        )
        .setOrigin(0.5);
      this.add
        .rectangle(
          (cx + gapHalf + sideRight) / 2,
          flankSepY,
          sideRight - cx - gapHalf,
          CONSTS.LANE_LINE_W,
          CONSTS.LANE_LINE_COLOR,
        )
        .setOrigin(0.5);
    };

    drawFlankSection(
      CONSTS.PLAYER_X,
      CONSTS.PLAYER_X + laneSpan,
      playerFlankIdx,
      CONSTS.CARD_START_Y + Math.max(0, playerMaxLane - 1) * gap,
    );
    drawFlankSection(
      width - CONSTS.PLAYER_X - laneSpan,
      width - CONSTS.PLAYER_X,
      enemyFlankIdx,
      CONSTS.CARD_START_Y + Math.max(0, enemyMaxLane - 1) * gap,
    );
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
      .rectangle(
        x + width / 2,
        y + CONSTS.CARD_Y_OFFSET,
        width + CONSTS.CARD_EXTRA_W,
        CONSTS.CARD_HEIGHT,
        CONSTS.CARD_BG,
      )
      .setStrokeStyle(CONSTS.CARD_STROKE_W, CONSTS.CARD_STROKE)
      .setOrigin(0.5)
      .setDepth(CONSTS.CARD_DEPTH);
    const bg = this.add
      .rectangle(x + width / 2, y + height / 2, width, height, CONSTS.FILL_BG)
      .setOrigin(0.5);
    const fill = this.add
      .rectangle(
        x + CONSTS.FILL_INSET,
        y + CONSTS.FILL_INSET,
        0,
        height - CONSTS.FILL_INSET * 2,
        color,
      )
      .setOrigin(0, 0);
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
    const label = this.add.text(
      x + CONSTS.LABEL_X,
      y - CONSTS.LABEL_Y,
      actor.name,
      {
        fontSize: `${CONSTS.UI_FONT}px`,
        color: CONSTS.LABEL_COLOR,
        resolution: TEXT_RESOLUTION,
      },
    );

    const statX = x + CONSTS.STAT_TXT_X;
    const fmt: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
      resolution: TEXT_RESOLUTION,
    };

    const healthTxt = this.add.text(statX, y + CONSTS.STAT_HP_Y, "", {
      ...fmt,
      color: CONSTS.STAT_HP_COLOR,
    });
    const staminaTxt = this.add.text(statX, y + CONSTS.STAT_SP_Y, "", {
      ...fmt,
      color: CONSTS.STAT_SP_COLOR,
    });
    const energyTxt = this.add.text(statX, y + CONSTS.STAT_EP_Y, "", {
      ...fmt,
      color: CONSTS.STAT_EP_COLOR,
    });

    this.actorsUi.push({
      actor,
      card,
      fill,
      bg,
      highlight,
      label,
      healthTxt,
      staminaTxt,
      energyTxt,
    });
  }

  /**
   * Overrides the default update loop to handle timeline progression and actor turns.
   *
   * @param _t Unused parameter for current time, required by Phaser's update signature.
   * @param dt Delta time in milliseconds since the last update, used to advance the timeline.
   */
  update(_t: number, dt: number) {
    if (this.actingActor) {
      this.syncUI();
      return;
    }

    const next = this.timeline.step();
    if (next) {
      this.startActorTurn(next);
      return;
    }

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
      .setStroke(
        actor.controller === CONSTS.ActorController.PLAYER
          ? CONSTS.PLAYER_ACTING_STROKE
          : CONSTS.ENEMY_ACTING_STROKE,
        CONSTS.HEADER_STROKE,
      );
    const w = this.currentlyActingHeader.width;
    this.currentlyActingBg
      .setSize(
        w + CONSTS.HEADER_BG_PAD_X,
        this.currentlyActingHeader.height + CONSTS.HEADER_BG_PAD_Y,
      )
      .setVisible(true);
    this.syncUI();
    this.time.delayedCall(CONSTS.TURN_DELAY, () => this.completeAction());
  }

  /**
   * Advances the timeline and handles ready queue updates.
   *
   * @param dt The delta time in milliseconds to advance the timeline.
   */
  private advanceTimelineAndHandleReadyQueue(dt: number) {
    const progressSnapshot = new Map<ActionActor, number>();
    for (const actor of this.timeline.actors) {
      progressSnapshot.set(actor, actor.progress);
    }

    const readyQueueLengthBefore = this.timeline.readyQueue.length;

    this.timeline.update(dt / CONSTS.MS_TO_S);

    const readyQueueLengthAfter = this.timeline.readyQueue.length;

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
    for (const actorUi of this.actorsUi) {
      const a = actorUi.actor;
      actorUi.fill.width =
        (a.progress / a.readyThreshold) *
        (actorUi.bg.width - CONSTS.FILL_INSET * 2);

      actorUi.healthTxt.setText(`HP ${a.health}/${a.health}`);
      actorUi.staminaTxt.setText(`SP ${a.stamina}/${a.stamina}`);
      actorUi.energyTxt.setText(`EP ${a.energy}/${a.energy}`);

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
