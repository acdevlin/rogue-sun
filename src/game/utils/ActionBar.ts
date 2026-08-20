import { Scene, GameObjects } from "phaser";
import * as CONSTS from "../../constants";

/**
 * Creates the bottom action bar icons for the Battle scene.
 *
 * Includes icon placement, pointer interactivity, and tooltip wiring.
 * Tooltip UI itself is expected to be handled by the caller.
 *
 * @param opts.scene - The Phaser scene to add icons to.
 * @param opts.cx - Horizontal center position of the action bar.
 * @param opts.y - Vertical position of the action bar icons.
 * @param opts.showTooltip - Callback for showing a tooltip.
 * @param opts.hideTooltip - Callback for hiding the active tooltip.
 * @param opts.onRetreat - Callback for when RETREAT is clicked.
 * @returns The created icon game objects.
 */
export function createBattleActionBar(opts: {
  scene: Scene;
  cx: number;
  y: number;
  showTooltip: (text: string, cx: number, topY: number) => void;
  hideTooltip: () => void;
  onRetreat: () => void;
}): {
  iconCast: GameObjects.Image;
  iconRetreat: GameObjects.Image;
  iconAttack: GameObjects.Image;
} {
  // Align action icons near the bottom of the screen, centered on X.
  const dx = CONSTS.ACTION_ICON_DX;

  const iconCast = opts.scene.add.image(opts.cx, opts.y, "icon_cast");
  const iconRetreat = opts.scene.add.image(
    opts.cx + dx,
    opts.y,
    "icon_retreat",
  );
  const iconAttack = opts.scene.add.image(opts.cx - dx, opts.y, "icon_attack");

  // Add interactivity to actionbar buttons.
  iconCast.setInteractive({ useHandCursor: true });
  iconRetreat.setInteractive({ useHandCursor: true });
  iconAttack.setInteractive({ useHandCursor: true });

  // Add mouseover text.
  iconCast.on("pointerover", () =>
    opts.showTooltip(
      "MAGIC",
      iconCast.x,
      iconCast.y - iconCast.displayHeight / 2,
    ),
  );
  iconCast.on("pointerout", opts.hideTooltip);

  iconRetreat.on("pointerover", () =>
    opts.showTooltip(
      "RETREAT",
      iconRetreat.x,
      iconRetreat.y - iconRetreat.displayHeight / 2,
    ),
  );
  iconRetreat.on("pointerout", opts.hideTooltip);

  iconAttack.on("pointerover", () =>
    opts.showTooltip(
      "ATTACK",
      iconAttack.x,
      iconAttack.y - iconAttack.displayHeight / 2,
    ),
  );
  iconAttack.on("pointerout", opts.hideTooltip);

  // Add onclick behavior.
  iconRetreat.on("pointerdown", opts.onRetreat);

  return { iconCast, iconRetreat, iconAttack };
}
