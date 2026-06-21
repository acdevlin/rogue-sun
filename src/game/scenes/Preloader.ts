import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import {
  PRELOADER_BAR_W,
  PRELOADER_BAR_H,
  PRELOADER_BAR_STROKE,
  PRELOADER_FILLER_X,
  PRELOADER_FILLER_W,
  PRELOADER_FILLER_H,
  PRELOADER_FILLER_MAX,
  PRELOADER_BAR_COLOR,
} from "../../constants";

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

    const bgImg = this.add.image(centerX, centerY, "background");
    bgImg.setScale(scale);

    const barWidth = Math.round(PRELOADER_BAR_W * scale);
    const barHeight = Math.round(PRELOADER_BAR_H * scale);
    this.add
      .rectangle(centerX, centerY, barWidth, barHeight)
      .setStrokeStyle(PRELOADER_BAR_STROKE, PRELOADER_BAR_COLOR);

    const bar = this.add.rectangle(
      centerX - PRELOADER_FILLER_X * scale,
      centerY,
      PRELOADER_FILLER_W,
      Math.round(PRELOADER_FILLER_H * scale),
      PRELOADER_BAR_COLOR,
    );

    this.load.on("progress", (progress: number) => {
      bar.width = PRELOADER_FILLER_W + PRELOADER_FILLER_MAX * progress;
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
