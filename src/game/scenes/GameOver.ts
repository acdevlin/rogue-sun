import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../../constants";

/**
 * GameOver scene — shown when the player loses.
 * Clicking or tapping returns to the MainMenu.
 */
export class GameOver extends Scene {
  camera!: Phaser.Cameras.Scene2D.Camera;
  background!: Phaser.GameObjects.Image;
  gameoverText!: Phaser.GameObjects.Text;

  /**
   * Default constructor.
   */
  constructor() {
    super("GameOver");
  }

  /**
   * Renders the "Game Over" text over a dimmed background.
   * A pointer click transitions back to the MainMenu.
   */
  create() {
    this.camera = this.cameras.main;
    const { centerX, centerY, scale } = getSceneScale(this);

    this.camera.setBackgroundColor(CONSTS.GAMEOVER_BG);

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setAlpha(CONSTS.GAMEOVER_ALPHA);
    this.background.setScale(scale);

    this.gameoverText = this.add.text(centerX, centerY, "Game Over", {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: Math.round(CONSTS.TITLE_FONT_SIZE * scale),
      color: CONSTS.TITLE_TEXT_COLOR,
      stroke: CONSTS.TITLE_STROKE_COLOR,
      strokeThickness: Math.round(CONSTS.GAMEOVER_STROKE * scale),
      align: "center",
      resolution: TEXT_RESOLUTION,
    });
    this.gameoverText.setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
