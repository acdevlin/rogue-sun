import { Scene, GameObjects, Cameras } from "phaser";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";
import { getSceneScale } from "../utils/SceneScaling";
import {
  createBtn,
  createActorCard,
  createLaneBlock,
} from "../utils/UiElements";
import type { ActorCardUI } from "../utils/UiElements";
import { players } from "../data/playerActorClasses";
import { PlayerTeamService } from "../services/PlayerTeamService";
import type { TeamMember } from "../data/TeamMember";
import type { PlayerTeam } from "../data/PlayerTeam";
import type { PlayerActorData } from "../data/PlayerActorData";

export class PartyCreation extends Scene {
  camera: Cameras.Scene2D.Camera;
  background: GameObjects.Image;
  title: GameObjects.Text;
  startBtn: GameObjects.Text;
  startBtnBg: GameObjects.Rectangle;
  savedTeamsLabel: GameObjects.Text;
  savedTeamsEntries: GameObjects.Text[] = [];
  // Currently displayed party members in the lane UI.
  currentMembers: PlayerActorData[] = players;
  // Tracks all game objects created for the current lane display.
  laneObjects: GameObjects.GameObject[] = [];

  /**
   * Default constructor.
   */
  constructor() {
    super("PartyCreation");
  }

  /**
   * Sets up the Party Creation UI: title, saved teams panel, Start Game
   * button, and initial lane display. Triggers async team initialization
   * (ensureDefaultTeam → loadInitialTeam) and renders saved teams.
   */
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

    this.currentMembers = players;
    this.ensureDefaultTeam().then(() => this.loadInitialTeam());
    this.renderSavedTeams();

    const y = this.camera.height - CONSTS.BTN_BOTTOM_OFFSET;
    const service = new PlayerTeamService();
    const btn = createBtn({
      scene: this,
      cx: centerX,
      y,
      label: "Start Game",
      onClick: async () => {
        const members: TeamMember[] = this.currentMembers.map((member) => ({
          actorClassId: member.name,
          position: member.position,
        }));
        const teams = await service.readAll();
        const curTeam = teams.find((team) => team.name === "Current Party");
        if (curTeam) {
          await service.update(curTeam.id, { members });
        } else {
          await service.create({ name: "Current Party", members });
        }
        this.scene.start("Battle", { players: this.currentMembers });
      },
      scale,
    });
    this.startBtn = btn.label;
    this.startBtnBg = btn.bg;
  }

  /**
   * Destroys all lane game objects: cards, headers, and guide lines.
   */
  private clearLanes(): void {
    this.laneObjects.forEach((obj) => obj.destroy());
    this.laneObjects = [];
  }

  /**
   * Upserts a "Default" team containing all player classes.
   * Runs on scene create to ensure a baseline team exists.
   *
   * @returns A promise that resolves once the team is saved.
   */
  private ensureDefaultTeam(): Promise<void> {
    const service = new PlayerTeamService();
    const members: TeamMember[] = players.map((player) => ({
      actorClassId: player.name,
      position: player.position,
    }));
    return service.readAll().then((teams) => {
      const cur = teams.find((team) => team.name === "Default");
      if (cur) return service.update(cur.id, { members }).then(() => {});
      return service.create({ name: "Default", members }).then(() => {});
    });
  }

  /**
   * Reads all saved teams and selects the best one to display on scene start.
   * Prefers "Current Party" over "Default". Falls back to the full player roster.
   */
  private loadInitialTeam(): void {
    const service = new PlayerTeamService();
    service.readAll().then((teams) => {
      const preferred =
        teams.find((team) => team.name === "Current Party") ||
        teams.find((team) => team.name === "Default");
      if (preferred) {
        this.selectTeam(preferred);
      } else {
        this.createPartyLanes(this.currentMembers);
      }
    });
  }

  /**
   * Switches the lane display to show the members of a saved team.
   * Resolves each TeamMember's actorClassId to its full PlayerActorData
   * and re-renders the party lanes.
   *
   * @param team - The team whose members should be displayed.
   */
  private selectTeam(team: PlayerTeam): void {
    const resolved: PlayerActorData[] = [];
    for (const member of team.members) {
      const found = players.find(
        (player) => player.name === member.actorClassId,
      );
      if (found) resolved.push({ ...found, position: member.position });
    }
    if (resolved.length === 0) return;
    this.currentMembers = resolved;
    this.clearLanes();
    this.createPartyLanes(this.currentMembers);
  }

  /**
   * Splits an ActorCardUI into its individual game objects and pushes
   * each into laneObjects so they can be destroyed together on team switch.
   *
   * @param card - The composite actor card to flatten.
   */
  private flattenActorCard(card: ActorCardUI): void {
    this.laneObjects.push(
      card.card,
      card.progressBg,
      card.fill,
      card.label,
      card.healthTxt,
      card.staminaTxt,
      card.energyTxt,
    );
  }

  /**
   * Renders the "Saved Teams" panel on the right side of the screen.
   * Teams are sorted with "Current Party" first, then "Default".
   * Each team name is clickable — hovering highlights it, clicking
   * loads that team's composition into the lane display.
   */
  private renderSavedTeams(): void {
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

      const rank = (name: string) => {
        switch (name) {
          case "Current Party":
            return 0;
          case "Default":
            return 1;
          default:
            return 2;
        }
      };

      teams.sort((teamA, teamB) => rank(teamA.name) - rank(teamB.name));

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
        const entry = this.add
          .text(
            rightX + 6,
            headerY + 28 + i * 26,
            `  ${teams[i].name}`,
            listStyle,
          )
          .setInteractive({ useHandCursor: true });

        entry.on("pointerover", () => entry.setColor(CONSTS.BTN_HOVER_TEXT));
        entry.on("pointerout", () => entry.setColor(CONSTS.LANE_HEADER_COLOR));
        entry.on("pointerdown", () => this.selectTeam(teams[i]));

        this.savedTeamsEntries.push(entry);
      }
    });
  }

  /**
   * Fills the lane grid with character cards for the given party members.
   * Calls {@link createLaneBlock} for the decorative grid structure, then
   * places {@link createActorCard} entries for each member. All created
   * objects are tracked in {@link laneObjects} for cleanup on team switch.
   *
   * @param members - The party members to render in the lanes.
   */
  private createPartyLanes(members: PlayerActorData[]): void {
    // Layout dimensions for the lane grid
    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;
    const yOff = 40;
    const headerY = CONSTS.LANE_HEADER_Y + yOff;
    const startY = CONSTS.CARD_START_Y + yOff;
    const sceneCx = this.cameras.main.centerX;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    const laneLeft = sceneCx - laneSpan / 2;

    // Partition members into primary lanes vs FLANK section
    const lanePlayers: Record<string, PlayerActorData[]> = {};
    const flankPlayers: PlayerActorData[] = [];

    for (const member of members) {
      if (member.position === CONSTS.ActorPosition.FLANK) {
        flankPlayers.push(member);
      } else {
        (lanePlayers[member.position] ??= []).push(member);
      }
    }

    // Tallest lane determines vertical space used for card placement
    const maxLane = Math.max(
      ...Object.values(lanePlayers).map((x) => x.length),
      0,
    );

    // Draw the empty lane grid (labels, guide lines, flank section)
    const layout = createLaneBlock({
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
    this.laneObjects.push(...layout.objects);

    // Place actor cards in each primary lane
    for (const [pos, list] of Object.entries(lanePlayers)) {
      const laneIdx = CONSTS.PRIMARY_LANES.indexOf(pos);
      // Guard statement in case of unknown lane position
      if (laneIdx < 0) continue;
      const baseX = laneLeft + laneIdx * CONSTS.LANE_OFFSET;
      for (let i = 0; i < list.length; i++) {
        const card = createActorCard({
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
        this.flattenActorCard(card);
      }
    }

    // Place actor cards in the FLANK row below the primary lanes
    for (let flankIdx = 0; flankIdx < flankPlayers.length; flankIdx++) {
      const laneCol = Math.max(0, CONSTS.NUM_LANES - 1 - flankIdx);
      const card = createActorCard({
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
      this.flattenActorCard(card);
    }
  }
}
