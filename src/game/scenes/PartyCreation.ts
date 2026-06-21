import { Scene, GameObjects, Cameras } from "phaser";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";
import { getSceneScale } from "../utils/SceneScaling";
import { createBtn } from "../utils/UiElements";

export class PartyCreation extends Scene {
  camera: Cameras.Scene2D.Camera;
  background: GameObjects.Image;
  title: GameObjects.Text;
  startBtn: GameObjects.Text;
  startBtnBg: GameObjects.Rectangle;

  constructor() {
    super("PartyCreation");
  }

  create() {
    this.camera = this.cameras.main;
    const { centerX, scale } = getSceneScale(this);

    this.camera.setBackgroundColor(CONSTS.PARTYCREATION_BG);

    this.title = this.add.text(
      centerX,
      CONSTS.HEADER_PARTYCREATION_Y,
      "Party Creation",
      {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: Math.round(CONSTS.TITLE_FONT_SIZE * scale),
        color: CONSTS.TITLE_TEXT_COLOR,
        stroke: CONSTS.TITLE_STROKE_COLOR,
        strokeThickness: Math.round(CONSTS.MENU_STROKE * scale),
        align: "center",
        resolution: TEXT_RESOLUTION,
      },
    );
    this.title.setOrigin(0.5);

    const y = this.camera.height - CONSTS.BTN_BOTTOM_OFFSET;
    const btn = createBtn({
      scene: this,
      cx: centerX,
      y,
      label: "Start Game",
      onClick: () => this.scene.start("Game"),
      scale,
    });
    this.startBtn = btn.label;
    this.startBtnBg = btn.bg;
  }
}
