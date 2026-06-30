import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import * as CONSTS from "../../constants";

/**
 * Preloader scene — displays a progress bar while loading game assets.
 * Transitions to MainMenu once all assets are loaded.
 */
export class Preloader extends Scene {
  /**
   * Default constructor.
   */
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

    const barWidth = Math.round(CONSTS.PRELOADER_BAR_W * scale);
    const barHeight = Math.round(CONSTS.PRELOADER_BAR_H * scale);
    this.add
      .rectangle(centerX, centerY, barWidth, barHeight)
      .setStrokeStyle(CONSTS.PRELOADER_BAR_STROKE, CONSTS.PRELOADER_BAR_COLOR);

    const bar = this.add.rectangle(
      centerX - CONSTS.PRELOADER_FILLER_X * scale,
      centerY,
      CONSTS.PRELOADER_FILLER_W,
      Math.round(CONSTS.PRELOADER_FILLER_H * scale),
      CONSTS.PRELOADER_BAR_COLOR,
    );

    this.load.on("progress", (progress: number) => {
      bar.width =
        CONSTS.PRELOADER_FILLER_W + CONSTS.PRELOADER_FILLER_MAX * progress;
    });
  }

  /**
   * Loads game assets (images, sprites) needed by the MainMenu and beyond.
   */
  preload() {
    this.load.setPath("assets");
    this.load.image("logo", "logo.png");
  }

  /**
   * Transitions to the MainMenu scene once all assets have loaded.
   */
  create() {
    this.scene.start("MainMenu");
  }
}
