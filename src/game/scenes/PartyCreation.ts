import { Scene, GameObjects, Cameras } from "phaser";
import * as CONSTS from "../../constants";
import { TEXT_RESOLUTION } from "../StartGame";
import { getSceneScale } from "../utils/SceneScaling";
import {
  createBtn,
  createActorCard,
  createLaneBlock,
  createPopupBg,
  createPopupTitle,
  createPopupClose,
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
  objects: GameObjects.GameObject[];
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
  // Objects composing the active popup, or null if closed.
  popup: GameObjects.GameObject[] | null = null;
  workingMembers: PlayerActorData[] = [];
  laneObjects: GameObjects.GameObject[] = [];
  poolCards: PoolCardEntry[] = [];
  drag: DragState | null = null;
  // Full-screen overlay that intercepts clicks when any popup is open, or null.
  popupOverlay: GameObjects.Rectangle | null = null;
  // Error text object in the save-team popup, or null if popup is closed.
  saveErrText: GameObjects.Text | null = null;
  teamService = new PlayerTeamService();

  /**
   * Converts the current working team into a persistable TeamMember array.
   *
   * @returns The team's members as serializable team-member objects.
   */
  private get teamMembers(): TeamMember[] {
    return this.workingMembers.map((i) => ({
      actorClassId: i.name,
      position: i.position,
    }));
  }

  /**
   * Computes the layout geometry for the lane grid.
   *
   * @returns An object with pixel coordinates and dimensions for lane rendering.
   */
  private get laneGeometry() {
    const cardW = CONSTS.CARD_W;
    const gap = CONSTS.CARD_GAP;
    const yOff = CONSTS.LANE_Y_OFFSET;
    const headerY = CONSTS.LANE_HEADER_Y + yOff;
    const startY = CONSTS.CARD_START_Y + yOff;
    const sceneCx = this.cameras.main.centerX;
    const span = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    const laneLeft = sceneCx - span / 2;
    return {
      cardW,
      gap,
      headerY,
      startY,
      laneLeft,
      laneRight: laneLeft + span,
    };
  }

  /**
   * Opens a modal popup with a background, title, and close button.
   * Destroys any currently-open popup first.
   *
   * @param width  - The popup width in pixels.
   * @param height - The popup height in pixels.
   * @param title  - The title text displayed at the top.
   * @param titleY - Optional override for the title's Y offset.
   * @returns Centering coordinates and the mutable objects array for callers to add content.
   */
  private withPopup(
    width: number,
    height: number,
    title: string,
    titleY?: number,
  ): {
    midX: number;
    left: number;
    top: number;
    objects: GameObjects.GameObject[];
  } {
    this.destroyPopup();
    const midX = this.cameras.main.centerX;
    const midY = this.cameras.main.centerY;
    const left = midX - width / 2;
    const top = midY - height / 2;
    const objects: GameObjects.GameObject[] = [];

    objects.push(
      createPopupBg(this, midX, midY, width, height),
      createPopupTitle(this, midX, top, title, titleY),
      createPopupClose(this, left, top, width, () => this.destroyPopup()),
    );

    this.popup = objects;
    this.syncPopupOverlay();
    return { midX, left, top, objects };
  }

  constructor() {
    super("PartyCreation");
  }

  /**
   * Lifecycle hook called when the scene starts. Renders all UI elements,
   * loads saved teams, and registers drag-and-drop handlers.
   */
  async create() {
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

    // Render the Help button on the left side
    createBtn({
      scene: this,
      cx: CONSTS.HELP_X,
      y: CONSTS.HELP_Y,
      label: "Help!",
      onClick: () => this.showHelpPopup(),
      scale: scale * CONSTS.COMPACT_BTN_SCALE,
    });

    // Save Team button, prompts for a name and persists composition
    const saveBtnY = CONSTS.HELP_Y + CONSTS.HELP_SAVE_GAP;
    createBtn({
      scene: this,
      cx: CONSTS.HELP_X,
      y: saveBtnY,
      label: "Save Team",
      onClick: () => {
        this.destroyPopup();
        if (!this.validateAndAlert()) return;
        this.showSavePopup();
      },
      scale: scale * CONSTS.COMPACT_BTN_SCALE,
    });

    // Load Team button, opens a popup listing saved teams
    const loadBtnY = saveBtnY + CONSTS.HELP_SAVE_GAP;
    createBtn({
      scene: this,
      cx: CONSTS.HELP_X,
      y: loadBtnY,
      label: "Load Team",
      onClick: () => this.showLoadPopup(),
      scale: scale * CONSTS.COMPACT_BTN_SCALE,
    });

    // Initialize state, render pool, then register drag-and-drop
    this.workingMembers = [...players];
    this.poolCards = [];
    this.renderPool();

    this.input.on("dragstart", this.onDragStart, this);
    this.input.on("drag", this.onDrag, this);
    this.input.on("dragend", this.onDragEnd, this);

    // Start Battle — centered at the bottom, persists the current party then transitions to battle
    const btnY = this.camera.height - CONSTS.BTN_BOTTOM_OFFSET;
    createBtn({
      scene: this,
      cx: centerX,
      y: btnY,
      label: "Start Battle",
      onClick: async () => {
        if (!this.validateAndAlert()) return;
        const teams = await this.teamService.readAll();
        const cur = teams.find((i) => i.name === CONSTS.TEAM_NAME_CURRENT);
        if (cur) {
          await this.teamService.update(cur.id, { members: this.teamMembers });
        } else {
          await this.teamService.create({
            name: CONSTS.TEAM_NAME_CURRENT,
            members: this.teamMembers,
          });
        }
        this.scene.start("Battle", { players: this.workingMembers });
      },
      scale,
    });

    // Load persisted teams asynchronously after all UI is in place
    await this.ensureDefaultTeam();
    this.loadInitialTeam();
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
  private async loadInitialTeam(): Promise<void> {
    const teams = await this.teamService.readAll();
    const preferred =
      teams.find((team) => team.name === CONSTS.TEAM_NAME_CURRENT) ||
      teams.find((team) => team.name === CONSTS.TEAM_NAME_DEFAULT);
    if (preferred) {
      this.selectTeam(preferred);
    } else {
      this.workingMembers = [...players];
      this.rebuildLanesAndPool();
    }
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

  private cardObjects(
    card: ActorCardUI,
  ): (GameObjects.Rectangle | GameObjects.Text)[] {
    return [
      card.card,
      card.progressBg,
      card.fill,
      card.label,
      card.healthTxt,
      card.staminaTxt,
      card.energyTxt,
    ];
  }

  /**
   * Splits a composite ActorCardUI into individual objects for tracked cleanup.
   * @param card - The card UI to flatten.
   */
  private flattenActorCard(card: ActorCardUI): void {
    this.laneObjects.push(...this.cardObjects(card));
  }

  /**
   * Returns the team-building rules text displayed in the help popup.
   */
  private get rulesText(): string {
    return (
      "A valid team adheres to the following rules:\n\n" +
      "• Each lane may contain a maximum of 3 characters. \n" +
      "• At least 2 of the Primary lanes (Frontline, Midline, and Backline) must have 1 or more characters." +
      "  Empty lanes are allowed.\n" +
      "• Placing a unit on the Flank is optional." +
      " A maximum of 1 character may be on the Flank, as long as at least 1 other lane has a character. Additionally, no other lane may have more than 2 characters."
    );
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
      const objects = this.cardObjects(card);
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
   * Shows the load-team popup with a list of saved teams.
   */
  private async showLoadPopup(): Promise<void> {
    const { left, top, objects } = this.withPopup(
      CONSTS.LOAD_POPUP_W,
      CONSTS.LOAD_POPUP_H,
      "Load Team",
    );

    const teams = await this.teamService.readAll();
    if (this.popup !== objects) return;
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

    if (teams.length === 0) {
      objects.push(
        this.add
          .text(
            left + CONSTS.LOAD_POPUP_TEXT_X,
            top + CONSTS.LOAD_POPUP_TEXT_Y,
            "No saved teams",
            {
              fontFamily: CONSTS.UI_FONT_FAMILY,
              fontSize: `${CONSTS.SAVED_TEAMS_ENTRY_FONT_SIZE}px`,
              color: CONSTS.SAVED_TEAMS_MUTED_COLOR,
              resolution: TEXT_RESOLUTION,
            },
          )
          .setDepth(CONSTS.POPUP_DEPTH + 1),
      );
      return;
    }

    const listStyle = {
      fontFamily: CONSTS.UI_FONT_FAMILY,
      fontSize: `${CONSTS.SAVED_TEAMS_ENTRY_FONT_SIZE}px`,
      color: CONSTS.LANE_HEADER_COLOR,
      resolution: TEXT_RESOLUTION,
    };

    for (let i = 0; i < teams.length; i++) {
      const entry = this.add
        .text(
          left + CONSTS.LOAD_POPUP_TEXT_X,
          top + CONSTS.LOAD_POPUP_TEXT_Y + i * CONSTS.SAVED_TEAMS_ENTRY_SPACING,
          teams[i].name,
          listStyle,
        )
        .setInteractive({ useHandCursor: true })
        .setDepth(CONSTS.POPUP_DEPTH + 1);

      entry.on("pointerover", () => entry.setColor(CONSTS.BTN_HOVER_TEXT));
      entry.on("pointerout", () => entry.setColor(CONSTS.LANE_HEADER_COLOR));
      entry.on("pointerdown", () => {
        this.selectTeam(teams[i]);
        this.destroyPopup();
      });

      objects.push(entry);
    }
  }

  /**
   * Destroys the currently active popup and its associated objects, if any.
   */
  private destroyPopup(): void {
    if (!this.popup) return;
    for (const obj of this.popup) obj.destroy();
    this.popup = null;
    this.saveErrText = null;
    this.syncPopupOverlay();
  }

  /**
   * True when any popup is currently open.
   */
  private get anyPopupOpen(): boolean {
    return !!this.popup;
  }

  /**
   * Shows or hides a full-screen click-catcher overlay based on popup state.
   * Prevents clicks reaching elements behind the popup.
   */
  private syncPopupOverlay(): void {
    if (this.anyPopupOpen) {
      if (!this.popupOverlay) {
        const cam = this.cameras.main;
        this.popupOverlay = this.add
          .rectangle(
            cam.width / 2,
            cam.height / 2,
            cam.width,
            cam.height,
            CONSTS.POPUP_OVERLAY_COLOR,
            CONSTS.POPUP_OVERLAY_ALPHA,
          )
          .setInteractive()
          .setDepth(CONSTS.POPUP_DEPTH - 1);
      }
    } else {
      if (this.popupOverlay) {
        this.popupOverlay.destroy();
        this.popupOverlay = null;
      }
    }
  }

  /**
   * Renders the lane grid showing the current team's actor cards by position.
   * @param members - The actors to display in the lane grid.
   */
  private createPartyLanes(members: PlayerActorData[]): void {
    const { cardW, gap, headerY, startY, laneLeft } = this.laneGeometry;

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
   * @param pointer - The pointer input used to record the drag start position.
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
    const { cardW, gap, headerY, startY, laneLeft, laneRight } =
      this.laneGeometry;

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
    const laneCount: Record<string, number> = {};
    let flankCount = 0;

    // Tally members per position (flankCount vs primary lanes)
    for (const mem of this.workingMembers) {
      if (mem.position === CONSTS.ActorPosition.FLANK) {
        flankCount++;
      } else {
        laneCount[mem.position] = (laneCount[mem.position] ?? 0) + 1;
      }
    }

    // Derive max lane depth and count of non-empty lanes from tallies
    const maxNonFlank = Math.max(...Object.values(laneCount), 0);
    const nonEmptyPrimaryLanes = Object.keys(laneCount).length;

    // Rule 1: No more than 3 characters per lane
    for (const [pos, num] of Object.entries(laneCount)) {
      if (num > 3)
        errs.push(`Maximum of 3 characters per lane - ${pos} has ${num}.`);
    }

    // Rule 2: At least 2 primary lanes must be non-empty
    if (nonEmptyPrimaryLanes < 2) {
      errs.push("At least 2 primary lanes must have characters assigned.");
    }

    // Rule 3: Flank special rules
    if (flankCount > 1)
      errs.push(
        `Maximum of 1 character in the Flank lane (has ${flankCount}).`,
      );
    if (flankCount > 0 && nonEmptyPrimaryLanes < 1)
      errs.push(
        "When there is a character in the Flank lane, at least 1 other primary lane must have at least 1 character.",
      );
    if (flankCount > 0 && maxNonFlank > 2)
      errs.push(
        "When there is a character in the Flank lane, all other lanes must have fewer than 3 characters.",
      );

    return errs;
  }

  /**
   * Validates team rules and shows an inline alert popup if invalid.
   * @returns True if the team is valid, false otherwise.
   */
  private validateAndAlert(): boolean {
    const errs = this.validateTeamRules();
    if (errs.length > 0) {
      this.showAlertPopup(errs.join("\n"));
      return false;
    }
    return true;
  }

  /**
   * Shows a simple alert popup with a message and close button.
   * @param msg - The message text to display.
   */
  private showAlertPopup(msg: string): void {
    const { left, top, objects } = this.withPopup(
      CONSTS.LOAD_POPUP_W,
      CONSTS.LOAD_POPUP_H,
      "Invalid Team",
    );

    const body = this.add
      .text(
        left + CONSTS.LOAD_POPUP_TEXT_X,
        top + CONSTS.LOAD_POPUP_TEXT_Y,
        msg,
        {
          fontFamily: CONSTS.UI_FONT_FAMILY,
          fontSize: `${CONSTS.HELP_FONT_SIZE}px`,
          color: CONSTS.HELP_COLOR,
          resolution: TEXT_RESOLUTION,
          wordWrap: {
            width: CONSTS.LOAD_POPUP_W - CONSTS.LOAD_POPUP_TEXT_X * 2,
          },
        },
      )
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    objects.push(body);
  }

  /**
   * Shows the lane picker popup for the given actor.
   * @param actor - The actor to place.
   */
  private showLanePicker(actor: PlayerActorData): void {
    const { midX, top, objects } = this.withPopup(
      CONSTS.POPUP_W,
      CONSTS.POPUP_H,
      "Select Lane",
    );

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
            color: CONSTS.HELP_COLOR,
            resolution: TEXT_RESOLUTION,
          },
        )
        .setOrigin(0.5, 0)
        .setInteractive({ useHandCursor: true })
        .setDepth(CONSTS.POPUP_DEPTH + 1);

      const lane = lanes[i];
      opt.on("pointerover", () => opt.setColor(CONSTS.LANE_HEADER_COLOR));
      opt.on("pointerout", () => opt.setColor(CONSTS.HELP_COLOR));
      opt.on("pointerdown", () => this.pickLane(actor, lane));
      objects.push(opt);
    }
  }

  /**
   * Shows the help popup with team-building rules.
   */
  private showHelpPopup(): void {
    const { left, top, objects } = this.withPopup(
      CONSTS.HELP_POPUP_W,
      CONSTS.HELP_POPUP_H,
      "Party Creation Rules",
      CONSTS.HELP_POPUP_TITLE_Y,
    );

    const body = this.add
      .text(
        left + CONSTS.HELP_POPUP_TEXT_X,
        top + CONSTS.HELP_POPUP_TEXT_Y,
        this.rulesText,
        {
          fontFamily: CONSTS.UI_FONT_FAMILY,
          fontSize: `${CONSTS.HELP_FONT_SIZE}px`,
          color: CONSTS.HELP_COLOR,
          resolution: TEXT_RESOLUTION,
          wordWrap: { width: CONSTS.HELP_W },
          lineSpacing: CONSTS.HELP_LINE_SPACING,
        },
      )
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    objects.push(body);
  }

  /**
   * Places the actor at the chosen position and closes the popup.
   * @param actor - The actor to place.
   * @param pos - The lane position to assign.
   */
  private pickLane(actor: PlayerActorData, pos: string): void {
    this.workingMembers.push({ ...actor, position: pos });
    this.destroyPopup();
    this.rebuildLanesAndPool();
  }

  /**
   * Shows the save-team popup with a text input and Save button.
   */
  private showSavePopup(): void {
    const { midX, top, objects } = this.withPopup(
      CONSTS.SAVE_POPUP_W,
      CONSTS.SAVE_POPUP_H,
      CONSTS.SAVE_TEAM_POPUP_TITLE,
    );

    const inputEl = this.add
      .dom(midX, top + CONSTS.SAVE_POPUP_INPUT_Y, "input", {
        type: "text",
        placeholder: CONSTS.SAVE_TEAM_INPUT_PLACEHOLDER,
      })
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    objects.push(inputEl);

    const saveLabel = this.add
      .text(midX, top + CONSTS.SAVE_POPUP_BTN_Y, CONSTS.SAVE_TEAM_BTN_LABEL, {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: `${CONSTS.POPUP_TITLE_FS}px`,
        color: CONSTS.MENU_TEXT_COLOR,
        stroke: CONSTS.MENU_STROKE_COLOR,
        strokeThickness: CONSTS.SAVE_POPUP_BTN_STROKE_W,
        align: "center",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5)
      .setDepth(CONSTS.POPUP_DEPTH + 1);

    const saveBg = this.add
      .rectangle(
        midX,
        top + CONSTS.SAVE_POPUP_BTN_Y,
        saveLabel.width + CONSTS.SAVE_POPUP_BTN_PAD_X,
        saveLabel.height + CONSTS.SAVE_POPUP_BTN_PAD_Y,
        CONSTS.BTN_FILL,
      )
      .setDepth(CONSTS.POPUP_DEPTH)
      .setStrokeStyle(CONSTS.BTN_STROKE_W, CONSTS.BTN_STROKE)
      .setInteractive({ useHandCursor: true });

    saveBg.on("pointerover", () => {
      saveBg.setFillStyle(CONSTS.BTN_HOVER_FILL);
      saveLabel.setColor(CONSTS.BTN_HOVER_TEXT);
    });
    saveBg.on("pointerout", () => {
      saveBg.setFillStyle(CONSTS.BTN_FILL);
      saveLabel.setColor(CONSTS.MENU_TEXT_COLOR);
    });
    saveBg.on("pointerdown", () => this.handleSaveTeam(inputEl));

    objects.push(saveBg, saveLabel);

    const errText = this.add
      .text(midX, top + CONSTS.SAVE_POPUP_ERR_Y, "", {
        fontFamily: CONSTS.UI_FONT_FAMILY,
        fontSize: `${CONSTS.SAVE_POPUP_ERR_FS}px`,
        color: CONSTS.POPUP_CLOSE_COLOR,
        align: "center",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5, 0)
      .setDepth(CONSTS.POPUP_DEPTH + 1);
    objects.push(errText);

    this.saveErrText = errText;
  }

  /**
   * Handles the Save action from the save-team popup.
   * @param inputEl - The DOM input element.
   */
  private async handleSaveTeam(inputEl: GameObjects.DOMElement): Promise<void> {
    const name = ((inputEl.node as HTMLInputElement).value ?? "").trim();
    if (name.length < CONSTS.MIN_TEAM_NAME_LENGTH) {
      if (this.saveErrText) {
        this.saveErrText.setText(CONSTS.SAVE_TEAM_NAME_TOO_SHORT);
      }
      return;
    }

    const teams = await this.teamService.readAll();
    const validation = this.teamService.validateTeam(
      {
        name,
        members: this.teamMembers,
      },
      teams,
    );
    if (!validation.valid) {
      if (this.saveErrText)
        this.saveErrText.setText(validation.errors.join("\n"));
      return;
    }

    await this.teamService.create({ name, members: this.teamMembers }, teams);
    this.destroyPopup();
  }
}
