import { Scene, GameObjects } from "phaser";
import * as CONSTS from "../../constants";
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
  const s = opts.scale ?? 1;
  const btn = opts.scene.add
    .text(opts.cx, opts.y, opts.label, {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: Math.round(CONSTS.MENU_FONT_SIZE * s),
      color: CONSTS.MENU_TEXT_COLOR,
      stroke: CONSTS.MENU_STROKE_COLOR,
      strokeThickness: Math.round(CONSTS.MENU_STROKE * s),
      align: "center",
      resolution: TEXT_RESOLUTION,
    })
    .setOrigin(0.5);

  const bg = opts.scene.add
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

  bg.on("pointerover", () => {
    bg.setFillStyle(CONSTS.BTN_HOVER_FILL);
    btn.setColor(CONSTS.BTN_HOVER_TEXT);
  });

  bg.on("pointerout", () => {
    bg.setFillStyle(CONSTS.BTN_FILL);
    btn.setColor(CONSTS.MENU_TEXT_COLOR);
  });

  bg.on("pointerdown", opts.onClick);

  return { label: btn, bg };
}
