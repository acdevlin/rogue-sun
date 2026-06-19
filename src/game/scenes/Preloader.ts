import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";

/**
 * Preloader scene — displays a progress bar while loading game assets.
 * Transitions to MainMenu once all assets are loaded.
 */
export class Preloader extends Scene {
  constructor() {
    super("Preloader");
  }

  /**
   * Sets up the background and progress bar UI before assets begin loading.
   */
  init() {
    const { centerX, centerY, scale } = getSceneScale(this);

    const bg = this.add.image(centerX, centerY, "background");
    bg.setScale(scale);

    const barWidth = Math.round(468 * scale);
    const barHeight = Math.round(32 * scale);
    this.add
      .rectangle(centerX, centerY, barWidth, barHeight)
      .setStrokeStyle(1, 0xffffff);

    const bar = this.add.rectangle(
      centerX - 230 * scale,
      centerY,
      4,
      Math.round(28 * scale),
      0xffffff,
    );

    this.load.on("progress", (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    this.load.setPath("assets");
    this.load.image("logo", "logo.png");
  }

  create() {
    this.scene.start("MainMenu");
  }
}
