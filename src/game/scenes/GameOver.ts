import { Scene } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";

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

    this.camera.setBackgroundColor(0xff0000);

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setAlpha(0.5);
    this.background.setScale(scale);

    this.gameover_text = this.add.text(centerX, centerY, "Game Over", {
      fontFamily: "Arial Black",
      fontSize: Math.round(64 * scale),
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: Math.round(8 * scale),
      align: "center",
    });
    this.gameover_text.setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
