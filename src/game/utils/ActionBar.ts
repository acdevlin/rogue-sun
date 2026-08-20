import { Scene, GameObjects } from "phaser";
import * as CONSTS from "../../constants";

/**
 * All action-bar icon texture keys, in display order (left to right).
 * These are the names of the .svg icon_* files in public/assets
 */
export const ACTION_ICON_KEYS = [
  "icon_attack",
  "icon_tactics",
  "icon_cast",
  "icon_wait",
  "icon_retreat",
] as const;

/**
 * Icon definitions for the battle action bar.
 */
type IconDef = {
  /** Phaser texture key used to render the icon. */
  key: string;
  /** Tooltip label shown on hover. */
  label: string;
  /** Horizontal offset (in icon-units) from the center icon. */
  offset: number;
  /** Callback fired on pointerdown, if any. */
  onPress?: () => void;
};

/**
 * Makes a game object interactive with a hand cursor.
 *
 * @param icon - The Phaser game object to enable interactivity on.
 */
export function makeInteractive(icon: GameObjects.Image): void {
  icon.setInteractive({ useHandCursor: true });
}

/**
 * Wires pointerover/pointerout events on an icon to show/hide a tooltip.
 *
 * Additionally triggers a smooth scale tween (CONSTS.ACTION_ICON_DEFAULT_SCALE → ACTION_ICON_MOUSEOVER_SCALE → CONSTS.ACTION_ICON_DEFAULT_SCALE) when the
 * scene has a `tweens` system; otherwise the scale change is skipped.
 *
 * The tooltip anchor is positioned at the icon's x and its top edge
 * (y minus half its display height).
 *
 * @param scene - The Phaser scene owning the icon (used for tweens).
 * @param icon - The icon to attach tooltip events to.
 * @param label - The tooltip label text.
 * @param showTooltip - Callback for showing a tooltip.
 * @param hideTooltip - Callback for hiding the active tooltip.
 */
export function activateTooltip(
  scene: Scene,
  icon: GameObjects.Image,
  label: string,
  showTooltip: (text: string, cx: number, topY: number) => void,
  hideTooltip: () => void,
): void {
  icon.on("pointerover", () => {
    showTooltip(label, icon.x, icon.y - icon.displayHeight / 2);
    scene.tweens?.add({
      targets: icon,
      scale: CONSTS.ACTION_ICON_MOUSEOVER_SCALE,
      duration: 100,
      ease: "Power2",
    });
  });
  icon.on("pointerout", () => {
    hideTooltip();
    scene.tweens?.add({
      targets: icon,
      scale: CONSTS.ACTION_ICON_DEFAULT_SCALE,
      duration: 100,
      ease: "Power2",
    });
  });
}

/**
 * Wires a press-down visual effect onto an icon's pointerdown/pointerup.
 *
 * On press the icon scales down and its depth drops (looks "pressed").
 * On release it tweens back toward the hover scale/depth. If an
 * `onPress` callback is provided, it is fired on pointerup.
 * If the scene lacks a `tweens` system, the tween effects are skipped.
 *
 * @param scene - The Phaser scene owning the icon (used for tweens).
 * @param icon - The icon to attach the press effect to.
 * @param onPress - Optional callback fired when the icon is released (clicked).
 */
export function bindPressEffect(
  scene: Scene,
  icon: GameObjects.Image,
  onPress?: () => void,
): void {
  icon.on("pointerdown", () => {
    icon.setDepth(CONSTS.ACTION_ICON_PRESS_DEPTH);
    scene.tweens?.add({
      targets: icon,
      scale: CONSTS.ACTION_ICON_PRESS_SCALE,
      duration: CONSTS.ACTION_ICON_PRESS_TWEEN,
      ease: "Power1",
    });
  });

  icon.on("pointerup", () => {
    scene.tweens?.add({
      targets: icon,
      scale: CONSTS.ACTION_ICON_MOUSEOVER_SCALE,
      depth: CONSTS.ACTION_ICON_DEPTH,
      duration: CONSTS.ACTION_ICON_PRESS_TWEEN,
      ease: "Power1",
    });

    if (onPress) onPress();
  });
}

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
  // Align action icons near the bottom of the screen, centered on Cast sprite.
  const dx = CONSTS.ACTION_ICON_DX;

  // Define all action-bar icons relative to the center (Cast).
  const icons: IconDef[] = [
    { key: "icon_attack", label: "ATTACK", offset: -2 },
    { key: "icon_tactics", label: "TACTICS", offset: -1 },
    { key: "icon_cast", label: "MAGIC", offset: 0 },
    { key: "icon_wait", label: "WAIT", offset: 1 },
    {
      key: "icon_retreat",
      label: "RETREAT",
      offset: 2,
      onPress: opts.onRetreat,
    },
  ];

  // Create, position, and wire up all action-bar icons.
  const created = icons.map((def) => {
    const icon = opts.scene.add.image(
      opts.cx + dx * def.offset,
      opts.y,
      def.key,
    );
    makeInteractive(icon);
    bindPressEffect(opts.scene, icon, def.onPress);
    activateTooltip(
      opts.scene,
      icon,
      def.label,
      opts.showTooltip,
      opts.hideTooltip,
    );
    return { def, icon };
  });

  const findByKey = (key: string) =>
    created.find((entry) => entry.def.key === key)!.icon;

  return {
    iconCast: findByKey("icon_cast"),
    iconRetreat: findByKey("icon_retreat"),
    iconAttack: findByKey("icon_attack"),
  };
}
