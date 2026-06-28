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

/**
 * Tracks a pool card and its associated sub-objects for dragging as a group.
 */
interface PoolCardEntry {
  actor: PlayerActorData;
  card: GameObjects.Rectangle;
  objects: (GameObjects.Rectangle | GameObjects.Text)[];
  origX: number;
  origY: number;
}

/** State for a drag or click operation on a pool card. */
interface DragState {
  actor: PlayerActorData;
  origX: number;
  origY: number;
  startX: number;
  startY: number;
}

export class PartyCreation extends Scene {
  camera: Cameras.Scene2D.Camera;
  title: GameObjects.Text;
  startBtn: GameObjects.Text;
  startBtnBg: GameObjects.Rectangle;
  saveBtn: GameObjects.Text;
  saveBtnBg: GameObjects.Rectangle;
  savedTeamsLabel: GameObjects.Text;
  savedTeamsEntries: GameObjects.Text[] = [];
  workingMembers: PlayerActorData[] = [];
  laneObjects: GameObjects.GameObject[] = [];
  poolCards: PoolCardEntry[] = [];
  drag: DragState | null = null;
  /** Objects composing the active lane picker popup, or null if closed. */
  picker: GameObjects.GameObject[] | null = null;
  teamService = new PlayerTeamService();

  constructor() {
    super("PartyCreation");
  }

  /**
   * Lifecycle hook called when the scene starts. Renders all UI elements,
   * loads saved teams, and registers drag-and-drop handlers.
   */
  create() {
    this.camera = this.cameras.main;
    const { centerX, scale } = getSceneScale(this);

    this.camera.setBackgroundColor(CONSTS.PARTYCREATION_BG);

    // Render the scene title
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

    // Render the team-building rules panel on the left side
    this.renderRules();

    // Initialize state, ensure the default roster exists, and render UI
    this.workingMembers = [...players];
    this.poolCards = [];
    this.ensureDefaultTeam().then(() => this.loadInitialTeam());
    this.renderPool();
    this.renderSavedTeams();

    // Register drag-and-drop for pool-to-lane interactions
    this.input.on("dragstart", this.onDragStart, this);
    this.input.on("drag", this.onDrag, this);
    this.input.on("dragend", this.onDragEnd, this);

    const btnY = this.camera.height - CONSTS.BTN_BOTTOM_OFFSET;

    // Save Team — prompts for a name and persists the current composition
    const saveButton = createBtn({
      scene: this,
      cx: centerX - CONSTS.PARTYCREATION_BTN_SPACING,
      y: btnY,
      label: "Save Team",
      onClick: () => {
        const errs = this.validateTeamRules();
        if (errs.length > 0) {
          alert(errs.join("\n"));
          return;
        }
        this.promptSaveTeam();
      },
      scale,
    });
    this.saveBtn = saveButton.label;
    this.saveBtnBg = saveButton.bg;

    // Start Game — persists the current party then transitions to battle
    const stBtn = createBtn({
      scene: this,
      cx: centerX + CONSTS.PARTYCREATION_BTN_SPACING,
      y: btnY,
      label: "Start Game",
      onClick: async () => {
        const errs = this.validateTeamRules();
        if (errs.length > 0) {
          alert(errs.join("\n"));
          return;
        }
        const members: TeamMember[] = this.workingMembers.map((i) => ({
          actorClassId: i.name,
          position: i.position,
        }));
        const teams = await this.teamService.readAll();
        const cur = teams.find((i) => i.name === CONSTS.TEAM_NAME_CURRENT);
        if (cur) {
          await this.teamService.update(cur.id, { members });
        } else {
          await this.teamService.create({
            name: CONSTS.TEAM_NAME_CURRENT,
            members,
          });
        }
        this.scene.start("Battle", { players: this.workingMembers });
      },
      scale,
    });
    this.startBtn = stBtn.label;
    this.startBtnBg = stBtn.bg;
  }

  /**
   * Destroys all lane cards, headers, and guide lines for a fresh render.
   */
  private clearLanes(): void {
    this.laneObjects.forEach((obj) => obj.destroy());
    this.laneObjects = [];
  }

  /**
   * Re-renders the lane grid and resets pool visuals after any team change.
   */
  private rebuildLanesAndPool(): void {
    this.clearLanes();
    this.createPartyLanes(this.workingMembers);
    this.resetPoolPositions();
    this.syncPool();
    this.destroyLanePicker();
  }

  /**
   * Translates all pooled objects back to their original pre-drag positions.
   */
  private resetPoolPositions(): void {
    for (const poolCard of this.poolCards) {
      const dx = poolCard.origX - poolCard.card.x;
      const dy = poolCard.origY - poolCard.card.y;
      for (const obj of poolCard.objects) {
        obj.x += dx;
        obj.y += dy;
      }
    }
  }

  /**
   * Creates or updates the "Default" team with the full player roster.
   */
  private async ensureDefaultTeam(): Promise<void> {
    const members: TeamMember[] = players.map((player) => ({
      actorClassId: player.name,
      position: player.position,
    }));
    const teams = await this.teamService.readAll();
    const cur = teams.find((team) => team.name === CONSTS.TEAM_NAME_DEFAULT);
    if (cur) {
      await this.teamService.update(cur.id, { members });
    } else {
      await this.teamService.create({
        name: CONSTS.TEAM_NAME_DEFAULT,
        members,
      });
    }
  }

  /**
   * Selects "Current Party" on scene start, falling back to "Default" or the full roster.
   */
  private loadInitialTeam(): void {
    this.teamService.readAll().then((teams) => {
      const preferred =
        teams.find((team) => team.name === CONSTS.TEAM_NAME_CURRENT) ||
        teams.find((team) => team.name === CONSTS.TEAM_NAME_DEFAULT);
      if (preferred) {
        this.selectTeam(preferred);
      } else {
        this.workingMembers = [...players];
        this.rebuildLanesAndPool();
      }
    });
  }

  /**
   * Resolves a saved team's member IDs and displays them in the lane grid.
   * @param team - The saved team to load.
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
    this.workingMembers = resolved;
    this.rebuildLanesAndPool();
  }

  /**
   * Splits a composite ActorCardUI into individual objects for tracked cleanup.
   * @param card - The card UI to flatten.
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
   * Renders the team-building rules panel on the left side of the screen.
   */
  private renderRules(): void {
    const txt =
      "Team Building Rules:\n" +
      "• Max 3 characters per lane\n" +
      "• At least 2 lanes must have characters\n" +
      "  (empty lanes allowed)\n" +
      "• Flank: max 1; requires 1+ other lane; other lanes ≤2 chars";
    this.add.text(CONSTS.RULES_X, CONSTS.RULES_Y, txt, {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: `${CONSTS.RULES_FONT_SIZE}px`,
      color: CONSTS.RULES_COLOR,
      resolution: TEXT_RESOLUTION,
      wordWrap: { width: CONSTS.RULES_W },
      lineSpacing: CONSTS.RULES_LINE_SPACING,
    });
  }

  /**
   * Renders a horizontal row of available actor cards below the lane grid.
   */
  private renderPool(): void {
    const sceneCx = this.cameras.main.centerX;
    const cardW = CONSTS.POOL_CARD_W;
    const gap = CONSTS.POOL_CARD_GAP;
    const total = players.length;
    const rowW = total * cardW + (total - 1) * gap;
    const startX = sceneCx - rowW / 2;
    const rowY = CONSTS.POOL_ROW_Y;

    for (let i = 0; i < total; i++) {
      const actor = players[i];
      const x = startX + i * (cardW + gap);
      const card = createActorCard({
        scene: this,
        x,
        y: rowY,
        w: cardW,
        name: actor.name,
        alias: actor.alias,
        health: actor.health,
        stamina: actor.stamina,
        energy: actor.energy,
      });
      card.card.setInteractive({ useHandCursor: true });
      // Collect all sub-objects so they move and reset as a group during drag
      const objects = [
        card.card,
        card.progressBg,
        card.fill,
        card.label,
        card.healthTxt,
        card.staminaTxt,
        card.energyTxt,
      ];
      this.poolCards.push({
        actor,
        card: card.card,
        objects,
        origX: x,
        origY: rowY,
      });
    }

    this.syncPool();
  }

  /**
   * Dims cards for placed actors and enables dragging for available ones.
   */
  private syncPool(): void {
    for (const poolCard of this.poolCards) {
      const placed = this.workingMembers.some(
        (i) => i.name === poolCard.actor.name,
      );
      for (const obj of poolCard.objects) {
        obj.setAlpha(placed ? CONSTS.POOL_DIM_ALPHA : 1);
      }
      if (placed) {
        poolCard.card.disableInteractive();
      } else {
        poolCard.card.setInteractive({ useHandCursor: true });
        this.input.setDraggable(poolCard.card);
      }
    }
  }

  /**
   * Rebuilds the saved teams panel on the right side of the screen.
   */
  private renderSavedTeams(): void {
    // Clear any previous entries
    if (this.savedTeamsLabel) this.savedTeamsLabel.destroy();
    this.savedTeamsEntries.forEach((entry) => entry.destroy());
    this.savedTeamsEntries = [];

    const rightX = this.cameras.main.width - CONSTS.SAVED_TEAMS_RIGHT_OFFSET;
    const headerY =
      CONSTS.HEADER_PARTYCREATION_Y + CONSTS.SAVED_TEAMS_HEADER_OFFSET;
    const style = {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: `${CONSTS.SAVED_TEAMS_FONT_SIZE}px`,
      color: CONSTS.LANE_HEADER_COLOR,
      resolution: TEXT_RESOLUTION,
    };

    this.savedTeamsLabel = this.add
      .text(rightX, headerY, "Saved Teams", style)
      .setOrigin(0, 0);

    this.teamService.readAll().then((teams) => {
      // Sort: Current Party first, Default second, then creation order
      const rank = (name: string) => {
        switch (name) {
          case CONSTS.TEAM_NAME_CURRENT:
            return 0;
          case CONSTS.TEAM_NAME_DEFAULT:
            return 1;
          default:
            return 2;
        }
      };

      teams.sort((teamA, teamB) => rank(teamA.name) - rank(teamB.name));

      // Show placeholder when no teams have been saved yet
      if (teams.length === 0) {
        const entry = this.add.text(
          rightX + CONSTS.SAVED_TEAMS_ENTRY_PAD_X,
          headerY + CONSTS.SAVED_TEAMS_ENTRY_PAD_Y,
          "No saved teams",
          {
            ...style,
            fontSize: `${CONSTS.SAVED_TEAMS_ENTRY_FONT_SIZE}px`,
            color: CONSTS.SAVED_TEAMS_MUTED_COLOR,
          },
        );
        this.savedTeamsEntries.push(entry);
        return;
      }

      const listStyle = {
        ...style,
        fontSize: `${CONSTS.SAVED_TEAMS_ENTRY_FONT_SIZE}px`,
      };
      for (let i = 0; i < teams.length; i++) {
        const entry = this.add
          .text(
            rightX + CONSTS.SAVED_TEAMS_ENTRY_PAD_X,
            headerY +
              CONSTS.SAVED_TEAMS_ENTRY_PAD_Y +
              i * CONSTS.SAVED_TEAMS_ENTRY_SPACING,
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
   * Renders the lane grid showing the current team's actor cards by position.
   * @param members - The actors to display in the lane grid.
   */
  private createPartyLanes(members: PlayerActorData[]): void {
    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;
    const yOff = CONSTS.LANE_Y_OFFSET;
    const headerY = CONSTS.LANE_HEADER_Y + yOff;
    const startY = CONSTS.CARD_START_Y + yOff;
    const sceneCx = this.cameras.main.centerX;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    const laneLeft = sceneCx - laneSpan / 2;

    const lanePlayers: Record<string, PlayerActorData[]> = {};
    const flankPlayers: PlayerActorData[] = [];

    for (const member of members) {
      if (member.position === CONSTS.ActorPosition.FLANK) {
        flankPlayers.push(member);
      } else {
        (lanePlayers[member.position] ??= []).push(member);
      }
    }

    const maxLane = Math.max(
      ...Object.values(lanePlayers).map((x) => x.length),
      0,
    );

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

    for (const [pos, list] of Object.entries(lanePlayers)) {
      const laneIdx = CONSTS.PRIMARY_LANES.indexOf(pos);
      if (laneIdx < 0) continue;
      const baseX = laneLeft + laneIdx * CONSTS.LANE_OFFSET;
      for (let i = 0; i < list.length; i++) {
        this.createLaneCard(list[i], baseX, startY + i * gap, cardW);
      }
    }

    for (let flankIdx = 0; flankIdx < flankPlayers.length; flankIdx++) {
      const laneCol = Math.max(0, CONSTS.NUM_LANES - 1 - flankIdx);
      this.createLaneCard(
        flankPlayers[flankIdx],
        laneLeft + laneCol * CONSTS.LANE_OFFSET,
        startY + maxLane * gap + CONSTS.FLANK_OFFSET,
        cardW,
      );
    }
  }

  /**
   * Creates an actor card in a lane position and wires click-to-remove.
   * @param member - The actor to display.
   * @param x - The x-coordinate of the card.
   * @param y - The y-coordinate of the card.
   * @param w - The width of the card.
   */
  private createLaneCard(
    member: PlayerActorData,
    x: number,
    y: number,
    w: number,
  ): void {
    const card = createActorCard({
      scene: this,
      x,
      y,
      w,
      name: member.name,
      alias: member.alias,
      health: member.health,
      stamina: member.stamina,
      energy: member.energy,
    });
    card.card.setInteractive({ useHandCursor: true });
    card.card.on("pointerdown", () => this.removeFromTeam(member.name));
    this.flattenActorCard(card);
  }

  /**
   * Removes an actor from the working team by name and re-renders.
   * @param name - The actor class name to remove.
   */
  private removeFromTeam(name: string): void {
    const idx = this.workingMembers.findIndex((i) => i.name === name);
    if (idx < 0) return;
    this.workingMembers.splice(idx, 1);
    this.rebuildLanesAndPool();
  }

  /**
   * Initiates a drag operation, recording the dragged actor and its original position.
   * @param _pointer - The pointer input (unused).
   * @param obj - The dragged game object (pool card rectangle).
   */
  private onDragStart(
    pointer: Phaser.Input.Pointer,
    obj: GameObjects.GameObject,
  ): void {
    const poolCard = this.poolCards.find((i) => i.card === obj);
    if (!poolCard) return;
    const placed = this.workingMembers.some(
      (i) => i.name === poolCard.actor.name,
    );
    if (placed) return;
    this.drag = {
      actor: poolCard.actor,
      origX: poolCard.card.x,
      origY: poolCard.card.y,
      startX: pointer.x,
      startY: pointer.y,
    };
  }

  /**
   * Updates the dragged pool card's position to follow the pointer.
   * @param _pointer - The pointer input (unused).
   * @param obj - The dragged game object (used to resolve the pool card).
   */
  private onDrag(
    _pointer: Phaser.Input.Pointer,
    obj: GameObjects.GameObject,
    dragX: number,
    dragY: number,
  ): void {
    const poolCard = this.poolCards.find((i) => i.card === obj);
    if (!poolCard) return;
    const dx = dragX - poolCard.card.x;
    const dy = dragY - poolCard.card.y;
    for (const obj of poolCard.objects) {
      obj.x += dx;
      obj.y += dy;
    }
  }

  /**
   * Completes a drag, placing the actor in the targeted lane or resetting position.
   * @param pointer - The pointer input used to determine drop position.
   */
  private onDragEnd(pointer: Phaser.Input.Pointer): void {
    if (!this.drag) return;

    // If pointer hasn't moved significantly, treat as a click 
    // and show lane-assignment popup menu
    const dx = pointer.x - this.drag.startX;
    const dy = pointer.y - this.drag.startY;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) {
      this.showLanePicker(this.drag.actor);
      this.resetPoolPositions();
      this.drag = null;
      return;
    }

    const pos = this.pickDropPos(pointer.x, pointer.y);
    if (pos) {
      this.workingMembers.push({ ...this.drag.actor, position: pos });
      this.rebuildLanesAndPool();
    } else {
      this.resetPoolPositions();
    }
    this.drag = null;
  }

  /**
   * Determines which lane position a pointer drop landed on, or null if outside the lane grid.
   * @param pointerX - The x-coordinate of the pointer.
   * @param pointerY - The y-coordinate of the pointer.
   * @returns The lane position string (e.g. "BACKLINE") or null.
   */
  private pickDropPos(pointerX: number, pointerY: number): string | null {
    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;
    const yOff = CONSTS.LANE_Y_OFFSET;
    const headerY = CONSTS.LANE_HEADER_Y + yOff;
    const startY = CONSTS.CARD_START_Y + yOff;
    const sceneCx = this.cameras.main.centerX;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    const laneLeft = sceneCx - laneSpan / 2;
    const laneRight = laneLeft + laneSpan;

    if (pointerY < headerY || pointerX < laneLeft || pointerX > laneRight)
      return null;

    const laneCounts: Record<string, number> = {};
    for (const member of this.workingMembers) {
      if (member.position !== CONSTS.ActorPosition.FLANK) {
        laneCounts[member.position] = (laneCounts[member.position] ?? 0) + 1;
      }
    }
    const maxLane = Math.max(...Object.values(laneCounts), 0);
    const laneAreaBot =
      startY + maxLane * gap + CONSTS.CARD_HEIGHT + CONSTS.DROP_HIT_PADDING;

    if (pointerY > laneAreaBot) {
      return CONSTS.ActorPosition.FLANK;
    }

    for (let i = 0; i < CONSTS.PRIMARY_LANES.length; i++) {
      const laneX = laneLeft + i * CONSTS.LANE_OFFSET;
      if (pointerX >= laneX && pointerX <= laneX + cardW) {
        return CONSTS.PRIMARY_LANES[i];
      }
    }

    const halfW = CONSTS.LANE_OFFSET / 2;
    for (let i = 0; i < CONSTS.PRIMARY_LANES.length; i++) {
      const centerX = laneLeft + i * CONSTS.LANE_OFFSET + cardW / 2;
      if (pointerX >= centerX - halfW && pointerX <= centerX + halfW) {
        return CONSTS.PRIMARY_LANES[i];
      }
    }

    return null;
  }

  /**
   * Validates the current team against party-building rules.
   * @returns An array of error messages (empty if valid).
   */
  private validateTeamRules(): string[] {
    const errs: string[] = [];
    const cnt: Record<string, number> = {};
    let flank = 0;

    // Tally members per position (flank vs primary lanes)
    for (const mem of this.workingMembers) {
      if (mem.position === CONSTS.ActorPosition.FLANK) {
        flank++;
      } else {
        cnt[mem.position] = (cnt[mem.position] ?? 0) + 1;
      }
    }

    // Derive max lane depth and count of non-empty lanes from tallies
    const maxNonFlank = Math.max(...Object.values(cnt), 0);
    const nonEmptyLanes = Object.keys(cnt).length;

    // Rule 1: no more than 3 characters per lane
    for (const [pos, num] of Object.entries(cnt)) {
      if (num > 3)
        errs.push(`Maximum of 3 characters per lane - ${pos} has ${num}.`);
    }

    // Rule 2: at least 2 lanes must be non-empty
    if (nonEmptyLanes < 2) {
      errs.push("At least 2 lanes must have characters assigned.");
    }

    // Rule 3: flank restrictions — max 1, needs another non-empty lane,
    // and all other lanes must have < 3 characters
    if (flank > 1)
      errs.push(`Maximum of 1 character in the Flank lane (has ${flank}).`);
    if (flank > 0 && nonEmptyLanes < 1)
      errs.push(
        "When there is a character in the Flank lane, at least 1 other lane must have at least 1 character.",
      );
    if (flank > 0 && maxNonFlank > 2)
      errs.push(
        "When there is a character in the Flank lane, all other lanes must have fewer than 3 characters.",
      );

    return errs;
  }

  /**
   * Shows the lane picker popup for the given actor.
   * @param actor - The actor to place.
   */
  private showLanePicker(actor: PlayerActorData): void {
    this.destroyLanePicker();

    const midX = this.cameras.main.centerX;
    const midY = this.cameras.main.centerY;
    const left = midX - CONSTS.POPUP_W / 2;
    const top = midY - CONSTS.POPUP_H / 2;
    const popupObjects: GameObjects.GameObject[] = [];

    // Background
    const bgRect = this.add
      .rectangle(midX, midY, CONSTS.POPUP_W, CONSTS.POPUP_H, CONSTS.POPUP_BG)
      .setStrokeStyle(CONSTS.POPUP_STROKE_W, CONSTS.POPUP_STROKE)
      .setDepth(CONSTS.POPUP_DEPTH);
    popupObjects.push(bgRect);

    // Title
    const title = this.add
      .text(midX, top + CONSTS.POPUP_TITLE_Y, "Select Lane", {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: "16px",
        color: CONSTS.LANE_HEADER_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    popupObjects.push(title);

    // Red X button, to close
    const closeX = this.add
      .text(left + CONSTS.POPUP_W - 5, top + 5, "X", {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: "18px",
        color: CONSTS.POPUP_CLOSE_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    closeX.on("pointerdown", () => this.destroyLanePicker());
    popupObjects.push(closeX);

    // Lane option entries
    const lanes = [...CONSTS.PRIMARY_LANES, CONSTS.ActorPosition.FLANK];
    for (let i = 0; i < lanes.length; i++) {
      const opt = this.add
        .text(
          midX,
          top + CONSTS.POPUP_OPTION_Y + i * CONSTS.POPUP_OPTION_GAP,
          lanes[i],
          {
            fontFamily: CONSTS.UI_FONT_FAMILY,
            fontSize: `${CONSTS.POPUP_OPTION_FONT}px`,
            color: CONSTS.RULES_COLOR,
            resolution: TEXT_RESOLUTION,
          },
        )
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(CONSTS.POPUP_DEPTH + 1);

      const lane = lanes[i];
      opt.on("pointerover", () => opt.setColor(CONSTS.LANE_HEADER_COLOR));
      opt.on("pointerout", () => opt.setColor(CONSTS.RULES_COLOR));
      opt.on("pointerdown", () => this.pickLane(actor, lane));
      popupObjects.push(opt);
    }

    this.picker = popupObjects;
  }

  /**
   * Destroys the active lane picker popup, if any.
   */
  private destroyLanePicker(): void {
    if (!this.picker) return;
    for (const obj of this.picker) obj.destroy();
    this.picker = null;
  }

  /**
   * Places the actor at the chosen position and closes the popup.
   * @param actor - The actor to place.
   * @param pos - The lane position to assign.
   */
  private pickLane(actor: PlayerActorData, pos: string): void {
    this.workingMembers.push({ ...actor, position: pos });
    this.destroyLanePicker();
    this.rebuildLanesAndPool();
  }

  /**
   * Prompts the user for a team name and persists the current composition.
   */
  private async promptSaveTeam(): Promise<void> {
    const name = prompt(CONSTS.PROMPT_SAVE_TEAM);
    if (!name || name.trim().length < CONSTS.MIN_TEAM_NAME_LENGTH) return;

    const members: TeamMember[] = this.workingMembers.map((i) => ({
      actorClassId: i.name,
      position: i.position,
    }));

    const validation = this.teamService.validateTeam({
      name: name.trim(),
      members,
    });
    if (!validation.valid) {
      alert(validation.errors.join("\n"));
      return;
    }

    await this.teamService.create({ name: name.trim(), members });
    this.renderSavedTeams();
  }
}
