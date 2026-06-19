import { Scene } from "phaser";
import { GAME_HEIGHT_SCALE, GAME_WIDTH_SCALE } from "../../constants";

/**
 * Result of a scaling calculation for a given scene.
 * Provides the center coordinates and uniform scale factor.
 */
export interface SceneScale {
  /** Horizontal center of the camera viewport. */
  centerX: number;
  /** Vertical center of the camera viewport. */
  centerY: number;
  /** Uniform scale factor based on the smallest axis ratio. */
  scale: number;
}

/**
 * Calculates the center coordinates and uniform scale factor
 * for a scene based on its camera dimensions and the reference constants.
 *
 * @param scene The Phaser scene whose camera is used for calculation.
 * @returns The center coordinates and computed scale factor.
 */
export function getSceneScale(scene: Scene): SceneScale {
  const centerX = scene.cameras.main.centerX;
  const centerY = scene.cameras.main.centerY;
  const scaleX = scene.cameras.main.width / GAME_WIDTH_SCALE;
  const scaleY = scene.cameras.main.height / GAME_HEIGHT_SCALE;
  const scale = Math.min(scaleX, scaleY);

  return { centerX, centerY, scale };
}
