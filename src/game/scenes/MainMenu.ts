import { Scene, GameObjects } from "phaser";
import { getSceneScale } from "../utils/SceneScaling";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";

/**
 * MainMenu scene — shows the game title and logo.
 * Clicking or tapping starts the Game scene.
 */
export class MainMenu extends Scene {
  background!: GameObjects.Image;
  logo!: GameObjects.Image;
  title!: GameObjects.Text;

  /**
   * Default constructor.
   */
  constructor() {
    super("MainMenu");
  }

  /**
   * Renders the logo, background image, and title text.
   * A pointer click transitions to the PartyCreation scene.
   */
  create() {
    const { centerX, centerY, scale } = getSceneScale(this);

    this.background = this.add.image(centerX, centerY, "background");
    this.background.setScale(scale);

    this.logo = this.add.image(
      centerX,
      centerY - CONSTS.LOGO_Y * scale,
      "logo",
    );
    this.logo.setScale(scale);

    this.title = this.add
      .text(centerX, centerY + CONSTS.TITLE_Y * scale, "Main Menu", {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: Math.round(CONSTS.MENU_FONT_SIZE * scale),
        color: CONSTS.MENU_TEXT_COLOR,
        stroke: CONSTS.MENU_STROKE_COLOR,
        strokeThickness: Math.round(CONSTS.MENU_STROKE * scale),
        align: "center",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);

    this.input.once("pointerdown", () => {
      this.scene.start("PartyCreation");
    });
  }
}
