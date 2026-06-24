import { Scene, GameObjects, Cameras } from "phaser";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";
import { getSceneScale } from "../utils/SceneScaling";
import {
  createBtn,
  createActorCard,
  createLaneBlock,
} from "../utils/UiElements";
import { players } from "../data/playerActorClasses";
import { PlayerTeamService } from "../services/PlayerTeamService";
import type { TeamMember } from "../data/TeamMember";

export class PartyCreation extends Scene {
  camera: Cameras.Scene2D.Camera;
  background: GameObjects.Image;
  title: GameObjects.Text;
  startBtn: GameObjects.Text;
  startBtnBg: GameObjects.Rectangle;
  savedTeamsLabel: GameObjects.Text;
  savedTeamsEntries: GameObjects.Text[] = [];

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

    this.createPartyLanes();
    this.renderSavedTeams();

    const y = this.camera.height - CONSTS.BTN_BOTTOM_OFFSET;
    const service = new PlayerTeamService();
    const btn = createBtn({
      scene: this,
      cx: centerX,
      y,
      label: "Start Game",
      onClick: async () => {
        const members: TeamMember[] = players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        }));
        const teams = await service.readAll();
        const curTeam = teams.find((team) => team.name === "Current Party");
        if (curTeam) {
          await service.update(curTeam.id, { members });
        } else {
          await service.create({ name: "Current Party", members });
        }
        this.scene.start("Battle", { players });
      },
      scale,
    });
    this.startBtn = btn.label;
    this.startBtnBg = btn.bg;
  }

  private renderSavedTeams() {
    const service = new PlayerTeamService();
    const rightX = this.cameras.main.width - 280;
    const headerY = CONSTS.HEADER_PARTYCREATION_Y + 90;
    const style = {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: "18px",
      color: CONSTS.LANE_HEADER_COLOR,
      resolution: TEXT_RESOLUTION,
    };

    this.savedTeamsLabel = this.add
      .text(rightX, headerY, "Saved Teams", style)
      .setOrigin(0, 0);

    service.readAll().then((teams) => {
      this.savedTeamsEntries.forEach((entry) => entry.destroy());
      this.savedTeamsEntries = [];

      if (teams.length === 0) {
        const entry = this.add.text(
          rightX + 6,
          headerY + 28,
          "No saved teams",
          {
            ...style,
            fontSize: "14px",
            color: "#999999",
          },
        );
        this.savedTeamsEntries.push(entry);
        return;
      }

      const listStyle = { ...style, fontSize: "14px" };
      for (let i = 0; i < teams.length; i++) {
        const entry = this.add.text(
          rightX + 6,
          headerY + 28 + i * 26,
          `  ${teams[i].name}`,
          listStyle,
        );
        this.savedTeamsEntries.push(entry);
      }
    });
  }

  private createPartyLanes() {
    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;
    const yOff = 40;
    const headerY = CONSTS.LANE_HEADER_Y + yOff;
    const startY = CONSTS.CARD_START_Y + yOff;
    const sceneCx = this.cameras.main.centerX;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    const laneLeft = sceneCx - laneSpan / 2;

    const lanePlayers: Record<string, typeof players> = {};
    const flankPlayers: typeof players = [];

    for (const player of players) {
      if (player.position === CONSTS.ActorPosition.FLANK) {
        flankPlayers.push(player);
      } else {
        (lanePlayers[player.position] ??= []).push(player);
      }
    }

    const maxLane = Math.max(
      ...Object.values(lanePlayers).map((x) => x.length),
      0,
    );

    createLaneBlock({
      scene: this,
      laneLeft,
      cardW,
      gap,
      maxLane,
      flankIdx: flankPlayers.length,
      headerY,
      startY,
      controller: CONSTS.ActorController.PLAYER,
    });

    for (const [pos, list] of Object.entries(lanePlayers)) {
      const laneIdx = CONSTS.PRIMARY_LANES.indexOf(pos);
      // Guard statement in case of unknown lane position
      if (laneIdx < 0) continue;
      const baseX = laneLeft + laneIdx * CONSTS.LANE_OFFSET;
      for (let i = 0; i < list.length; i++) {
        createActorCard({
          scene: this,
          x: baseX,
          y: startY + i * gap,
          w: cardW,
          name: list[i].name,
          alias: list[i].alias,
          health: list[i].health,
          stamina: list[i].stamina,
          energy: list[i].energy,
        });
      }
    }

    for (let flankIdx = 0; flankIdx < flankPlayers.length; flankIdx++) {
      const laneCol = Math.max(0, CONSTS.NUM_LANES - 1 - flankIdx);
      createActorCard({
        scene: this,
        x: laneLeft + laneCol * CONSTS.LANE_OFFSET,
        y: startY + maxLane * gap + CONSTS.FLANK_OFFSET,
        w: cardW,
        name: flankPlayers[flankIdx].name,
        alias: flankPlayers[flankIdx].alias,
        health: flankPlayers[flankIdx].health,
        stamina: flankPlayers[flankIdx].stamina,
        energy: flankPlayers[flankIdx].energy,
      });
    }
  }
}
