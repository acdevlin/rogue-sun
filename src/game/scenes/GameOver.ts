import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import {
  GAMEOVER_BG,
  GAMEOVER_ALPHA,
  GAMEOVER_FONT_SIZE,
  GAMEOVER_STROKE,
  GAMEOVER_TEXT_COLOR,
  GAMEOVER_STROKE_COLOR,
  UI_FONT_FAMILY,
} from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";

/**
 * GameOver scene — shown when the player loses.
 * Clicking or tapping returns to the MainMenu.
 */
export class GameOver extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  gameover_text: Phaser.GameObjects.Text;

  constructor() {
    super("GameOver");
  }

  create() {
    this.camera = this.cameras.main;
    const { centerX, centerY, scale } = getSceneScale(this);

    this.camera.setBackgroundColor(GAMEOVER_BG);

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setAlpha(GAMEOVER_ALPHA);
    this.background.setScale(scale);

    this.gameover_text = this.add.text(centerX, centerY, "Game Over", {
      fontFamily: UI_FONT_FAMILY,
      fontSize: Math.round(GAMEOVER_FONT_SIZE * scale),
      color: GAMEOVER_TEXT_COLOR,
      stroke: GAMEOVER_STROKE_COLOR,
      strokeThickness: Math.round(GAMEOVER_STROKE * scale),
      align: "center",
      resolution: TEXT_RESOLUTION,
    });
    this.gameover_text.setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
