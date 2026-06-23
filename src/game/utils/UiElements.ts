import { Scene, GameObjects } from "phaser";
import * as CONSTS from "../../constants";
import type { ActorController } from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";

/**
 * Creates a styled button (text + background rectangle) with hover effects
 * and a click handler. Intended for scene navigation buttons.
 *
 * @param opts.scene - The Phaser scene to add the button elements to.
 * @param opts.cx - Horizontal center position of the button.
 * @param opts.y - Vertical position of the button.
 * @param opts.label - Text displayed on the button.
 * @param opts.onClick - Callback invoked when the button is clicked.
 * @param opts.scale - Optional scale factor for font size (defaults to 1).
 * @returns An object with `label` (the Text game object) and `bg` (the Rectangle background).
 */
export function createBtn(opts: {
  scene: Scene;
  cx: number;
  y: number;
  label: string;
  onClick: () => void;
  scale?: number;
}): { label: GameObjects.Text; bg: GameObjects.Rectangle } {
  const scaleFactor = opts.scale ?? 1;
  const btn = opts.scene.add
    .text(opts.cx, opts.y, opts.label, {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: Math.round(CONSTS.MENU_FONT_SIZE * scaleFactor),
      color: CONSTS.MENU_TEXT_COLOR,
      stroke: CONSTS.MENU_STROKE_COLOR,
      strokeThickness: Math.round(CONSTS.MENU_STROKE * scaleFactor),
      align: "center",
      resolution: TEXT_RESOLUTION,
    })
    .setOrigin(0.5);

  const btnBg = opts.scene.add
    .rectangle(
      opts.cx,
      opts.y,
      btn.width + CONSTS.BTN_PAD,
      btn.height + CONSTS.BTN_PAD,
      CONSTS.BTN_FILL,
    )
    .setDepth(CONSTS.BTN_DEPTH)
    .setStrokeStyle(CONSTS.BTN_STROKE_W, CONSTS.BTN_STROKE)
    .setInteractive({ useHandCursor: true });

  btnBg.on("pointerover", () => {
    btnBg.setFillStyle(CONSTS.BTN_HOVER_FILL);
    btn.setColor(CONSTS.BTN_HOVER_TEXT);
  });

  btnBg.on("pointerout", () => {
    btnBg.setFillStyle(CONSTS.BTN_FILL);
    btn.setColor(CONSTS.MENU_TEXT_COLOR);
  });

  btnBg.on("pointerdown", opts.onClick);

  return { label: btn, bg: btnBg };
}

export interface ActorCardUI {
  card: GameObjects.Rectangle;
  label: GameObjects.Text;
  healthTxt: GameObjects.Text;
  staminaTxt: GameObjects.Text;
  energyTxt: GameObjects.Text;
}

/**
 * Configuration for a single lane block (one side's worth of lanes).
 *
 * @property scene - The Phaser scene to add the lane elements to.
 * @property laneLeft - Left-edge X of the lane block (where the first lane card begins).
 * @property cardW - Width of each actor card in pixels.
 * @property gap - Vertical gap between stacked cards in a lane.
 * @property maxLane - Maximum number of non-flank actors in any lane on this side.
 * @property flankIdx - Number of flank actors on this side (0 if none).
 * @property headerY - Y-position of lane header labels.
 * @property startY - Y-position of the first card row in a lane.
 * @property controller - `ActorController.PLAYER` for left-to-right (player side)
 * ordering, any other value for right-to-left (enemy-side mirroring).
 */
export type LaneBlockOpts = {
  scene: Scene;
  laneLeft: number;
  cardW: number;
  gap: number;
  maxLane: number;
  flankIdx: number;
  headerY: number;
  startY: number;
  controller: ActorController;
};

/** Computed dimensions returned by {@link createLaneBlock}. */
export type LaneBlockLayout = {
  /** Total width of the lane block from leftmost to rightmost lane edge. */
  laneSpan: number;
  /** Horizontal center of the lane block. */
  blockCx: number;
  /** Bottom Y-position of the last card or flank separator in the block. */
  bot: number;
};

/**
 * Draws the decorative lane structure for one side: lane header labels,
 * a horizontal header separator line, vertical guide lines between lanes,
 * and an optional FLANK section (label + separator lines) when flank actors
 * are present.
 *
 * Lane order is left-to-right for `ActorController.PLAYER` and
 * right-to-left for any other controller value, placing BACKLINE at the
 * outermost edge of the battle field.
 *
 * @param opts - Configuration for the lane block.
 * @returns The computed {@link LaneBlockLayout} for use by the caller
 *   (e.g. to place actor cards at the correct positions).
 */
export function createLaneBlock(opts: LaneBlockOpts): LaneBlockLayout {
  const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + opts.cardW;
  const halfGap = (CONSTS.LANE_OFFSET - opts.cardW) / 2;
  const pad = CONSTS.CARD_Y_OFFSET + CONSTS.CARD_HEIGHT / 2;
  const sepY =
    opts.headerY + CONSTS.LANE_HEADER_FONT + CONSTS.LANE_HEADER_SEP_Y;
  const blockCx = opts.laneLeft + laneSpan / 2;
  const bot =
    opts.flankIdx > 0
      ? opts.startY +
        Math.max(0, opts.maxLane - 1) * opts.gap +
        CONSTS.FLANK_OFFSET / 2
      : opts.startY + Math.max(0, opts.maxLane - 1) * opts.gap;

  const laneStyle = {
    fontFamily: CONSTS.UI_FONT_FAMILY,
    fontSize: `${CONSTS.LANE_HEADER_FONT}px`,
    color: CONSTS.LANE_HEADER_COLOR,
    resolution: TEXT_RESOLUTION,
  };

  const reversed = opts.controller !== CONSTS.ActorController.PLAYER;

  for (let i = 0; i < CONSTS.NUM_LANES; i++) {
    const xPos = reversed
      ? opts.laneLeft + laneSpan - opts.cardW / 2 - i * CONSTS.LANE_OFFSET
      : opts.laneLeft + opts.cardW / 2 + i * CONSTS.LANE_OFFSET;
    opts.scene.add
      .text(
        xPos,
        opts.headerY,
        CONSTS.PRIMARY_LANES[i].toUpperCase(),
        laneStyle,
      )
      .setOrigin(0.5, 0);
  }

  opts.scene.add
    .rectangle(
      blockCx,
      sepY,
      laneSpan,
      CONSTS.LANE_LINE_W,
      CONSTS.LANE_LINE_COLOR,
    )
    .setOrigin(0.5);

  for (let j = 0; j < CONSTS.NUM_LANES - 1; j++) {
    const lineX = reversed
      ? opts.laneLeft + laneSpan - opts.cardW - halfGap - j * CONSTS.LANE_OFFSET
      : opts.laneLeft + opts.cardW + halfGap + j * CONSTS.LANE_OFFSET;
    const len = bot + pad - sepY;
    opts.scene.add
      .rectangle(
        lineX,
        sepY + len / 2,
        CONSTS.LANE_LINE_W,
        len,
        CONSTS.LANE_LINE_COLOR,
      )
      .setOrigin(0.5);
  }

  if (opts.flankIdx > 0) {
    const lastNonFlankY =
      opts.startY + Math.max(0, opts.maxLane - 1) * opts.gap;
    const flankSepY = lastNonFlankY + pad + CONSTS.FLANK_OFFSET / 2;

    const label = opts.scene.add
      .text(blockCx, flankSepY, "FLANK", laneStyle)
      .setOrigin(0.5);
    const gapHalf =
      (label.width || CONSTS.FLANK_LABEL_FALLBACK_W) / 2 +
      CONSTS.FLANK_LABEL_PAD;

    opts.scene.add
      .rectangle(
        (blockCx - gapHalf + opts.laneLeft) / 2,
        flankSepY,
        blockCx - gapHalf - opts.laneLeft,
        CONSTS.LANE_LINE_W,
        CONSTS.LANE_LINE_COLOR,
      )
      .setOrigin(0.5);
    opts.scene.add
      .rectangle(
        (blockCx + gapHalf + opts.laneLeft + laneSpan) / 2,
        flankSepY,
        opts.laneLeft + laneSpan - blockCx - gapHalf,
        CONSTS.LANE_LINE_W,
        CONSTS.LANE_LINE_COLOR,
      )
      .setOrigin(0.5);
  }

  return { laneSpan, blockCx, bot };
}

export function createActorCard(opts: {
  scene: Scene;
  x: number;
  y: number;
  w: number;
  name: string;
  health: number;
  stamina: number;
  energy: number;
}): ActorCardUI {
  const card = opts.scene.add
    .rectangle(
      opts.x + opts.w / 2,
      opts.y + CONSTS.CARD_Y_OFFSET,
      opts.w + CONSTS.CARD_EXTRA_W,
      CONSTS.CARD_HEIGHT,
      CONSTS.CARD_BG,
    )
    .setStrokeStyle(CONSTS.CARD_STROKE_W, CONSTS.CARD_STROKE)
    .setOrigin(0.5)
    .setDepth(CONSTS.CARD_DEPTH);

  const label = opts.scene.add.text(
    opts.x + CONSTS.LABEL_X,
    opts.y - CONSTS.LABEL_Y,
    opts.name,
    {
      fontSize: `${CONSTS.UI_FONT}px`,
      color: CONSTS.LABEL_COLOR,
      resolution: TEXT_RESOLUTION,
    },
  );

  const statX = opts.x + CONSTS.STAT_TXT_X;
  const healthTxt = opts.scene.add.text(
    statX,
    opts.y + CONSTS.STAT_HP_Y,
    `HP ${opts.health}`,
    {
      fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
      color: CONSTS.STAT_HP_COLOR,
      resolution: TEXT_RESOLUTION,
    },
  );

  const staminaTxt = opts.scene.add.text(
    statX,
    opts.y + CONSTS.STAT_SP_Y,
    `SP ${opts.stamina}`,
    {
      fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
      color: CONSTS.STAT_SP_COLOR,
      resolution: TEXT_RESOLUTION,
    },
  );

  const energyTxt = opts.scene.add.text(
    statX,
    opts.y + CONSTS.STAT_EP_Y,
    `EP ${opts.energy}`,
    {
      fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
      color: CONSTS.STAT_EP_COLOR,
      resolution: TEXT_RESOLUTION,
    },
  );

  return { card, label, healthTxt, staminaTxt, energyTxt };
}
