import { Scene, GameObjects } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import {
  LOGO_Y,
  TITLE_Y,
  MENU_FONT_SIZE,
  MENU_STROKE,
  MENU_TEXT_COLOR,
  MENU_STROKE_COLOR,
  UI_FONT_FAMILY,
} from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";

/**
 * MainMenu scene — shows the game title and logo.
 * Clicking or tapping starts the Game scene.
 */
export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;

  constructor() {
    super("MainMenu");
  }

  create() {
    const { centerX, centerY, scale } = getSceneScale(this);

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setScale(scale);

    this.logo = this.add.image(centerX, centerY - LOGO_Y * scale, "logo");
    this.logo.setScale(scale);

    this.title = this.add
      .text(centerX, centerY + TITLE_Y * scale, "Main Menu", {
        fontFamily: UI_FONT_FAMILY,
        fontSize: Math.round(MENU_FONT_SIZE * scale),
        color: MENU_TEXT_COLOR,
        stroke: MENU_STROKE_COLOR,
        strokeThickness: Math.round(MENU_STROKE * scale),
        align: "center",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("PartyCreation");
    });
  }
}
