import { describe, it, expect, vi, beforeEach } from "vitest";

import { PartyCreation } from "../PartyCreation";
import type { PlayerTeam } from "../../data/PlayerTeam";
import * as CONSTS from "../../../constants";
import { players } from "../../data/playerActorClasses";

describe("PartyCreation Scene", () => {
  let scene: PartyCreation;

  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    });
    scene = new PartyCreation();
    scene.create();
  });

  it("creates without throwing", () => {
    expect(scene).toBeTruthy();
  });

  it("renders title text 'Party Creation'", () => {
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Party Creation",
      expect.any(Object),
    );
  });

  it("renders 'Start Battle' button text", () => {
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Start Battle",
      expect.any(Object),
    );
  });

  it("creates a clickable rectangle behind the button", () => {
    const partyCreation = new PartyCreation();
    const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
    partyCreation.create();

    const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
    expect(rect.setStrokeStyle).toHaveBeenCalledWith(
      CONSTS.BTN_STROKE_W,
      CONSTS.BTN_STROKE,
    );
    expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });

  it("transitions to Battle on Start Game button click", async () => {
    const partyCreation = new PartyCreation();
    const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
    partyCreation.create();

    const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
    const pointerdown = rect.on.mock.calls.find(
      (call: string[]) => call[0] === "pointerdown",
    );
    expect(pointerdown).toBeTruthy();
    await pointerdown![1]();
    expect(partyCreation.scene.start).toHaveBeenCalledWith("Battle", {
      players,
    });
  });

  describe("Start Game saves team", () => {
    it("creates a new 'Current Party' team in localStorage", async () => {
      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      partyCreation.create();

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      const pointerdown = rect.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      await pointerdown![1]();

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const last = calls[calls.length - 1];
      expect(last[0]).toBe("rogue_sun_player_teams");
      const saved = JSON.parse(last[1]);
      const current = saved.find(
        (team: PlayerTeam) => team.name === CONSTS.TEAM_NAME_CURRENT,
      );
      expect(current).toBeTruthy();
      expect(current.members).toEqual(
        players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        })),
      );
    });

    it("updates existing 'Current Party' instead of creating a duplicate", async () => {
      const existing = {
        id: "existing-id",
        name: CONSTS.TEAM_NAME_CURRENT,
        members: [{ actorClassId: "Fighter", position: "FRONTLINE" }],
        createdAt: 100,
        lastModified: 100,
      };
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([existing]),
      );

      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      partyCreation.create();

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      const pointerdown = rect.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      await pointerdown![1]();

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const last = calls[calls.length - 1];
      const saved = JSON.parse(last[1]);
      const current = saved.find(
        (team: PlayerTeam) => team.id === "existing-id",
      );
      expect(current).toBeTruthy();
      expect(
        saved.filter(
          (team: PlayerTeam) => team.name === CONSTS.TEAM_NAME_CURRENT,
        ),
      ).toHaveLength(1);
      expect(current.members).toEqual(
        players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        })),
      );
    });
  });

  describe("load team popup", () => {
    it("shows 'Load Team' title in popup", async () => {
      (scene as any).showLoadPopup();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Load Team",
        expect.any(Object),
      );
    });

    it("shows 'No saved teams' when localStorage is empty", async () => {
      (scene as any).showLoadPopup();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "No saved teams",
        expect.any(Object),
      );
    });

    it("lists saved team names when teams exist", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "a",
            name: "Alpha Team",
            members: [],
            createdAt: 1,
            lastModified: 1,
          },
          {
            id: "b",
            name: "Bravo Squad",
            members: [],
            createdAt: 2,
            lastModified: 2,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const teamNames = textSpy.mock.calls
        .filter((call: unknown[]) => typeof call[2] === "string")
        .map((call: unknown[]) => (call[2] as string).trim());
      expect(teamNames).toContain("Alpha Team");
      expect(teamNames).toContain("Bravo Squad");
    });

    it("sorts 'Current Party' first, then 'Default', then others", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "c",
            name: "Z Team",
            members: [],
            createdAt: 1,
            lastModified: 1,
          },
          {
            id: "d",
            name: "Default",
            members: [],
            createdAt: 2,
            lastModified: 2,
          },
          {
            id: "e",
            name: CONSTS.TEAM_NAME_CURRENT,
            members: [],
            createdAt: 3,
            lastModified: 3,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const calls = textSpy.mock.calls;
      let loadTitleIdx = -1;
      for (let i = calls.length - 1; i >= 0; i--) {
        if (calls[i][2] === "Load Team") {
          loadTitleIdx = i;
          break;
        }
      }
      const teamEntries = textSpy.mock.calls
        .slice(loadTitleIdx + 1)
        .filter(
          (call: unknown[]) =>
            typeof call[2] === "string" &&
            call[2] !== "X" &&
            call[2] !== "No saved teams",
        )
        .map((call: unknown[]) => (call[2] as string).trim());
      const idxCurrent = teamEntries.indexOf(CONSTS.TEAM_NAME_CURRENT);
      const idxDefault = teamEntries.indexOf("Default");
      const idxZ = teamEntries.indexOf("Z Team");
      expect(idxCurrent).toBe(0);
      expect(idxDefault).toBe(1);
      expect(idxZ).toBe(2);
    });

    it("sorts and shows all team entries in correct order", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "c",
            name: "Z Team",
            members: [],
            createdAt: 1,
            lastModified: 1,
          },
          {
            id: "d",
            name: "Default",
            members: [],
            createdAt: 2,
            lastModified: 2,
          },
          {
            id: "e",
            name: CONSTS.TEAM_NAME_CURRENT,
            members: [],
            createdAt: 3,
            lastModified: 3,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      // Find team name texts after the "Load Team" title
      const allTextCalls = textSpy.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[2] === "string" &&
          (call[2] as string).trim() !== "" &&
          (call[2] as string).trim() !== "X",
      );
      const teamNames = allTextCalls
        .filter(
          (call: unknown[]) =>
            call[2] !== "Load Team" && call[2] !== "No saved teams",
        )
        .map((call: unknown[]) => (call[2] as string).trim());
      const idxCurrent = teamNames.indexOf(CONSTS.TEAM_NAME_CURRENT);
      const idxDefault = teamNames.indexOf("Default");
      const idxZ = teamNames.indexOf("Z Team");
      expect(idxCurrent).toBeLessThan(idxDefault);
      expect(idxDefault).toBeLessThan(idxZ);
    });

    it("team entries are interactive with hover and click handlers", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "f",
            name: "Clickable Team",
            members: [],
            createdAt: 1,
            lastModified: 1,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const teamCallIdx = textSpy.mock.calls.findIndex(
        (call: unknown[]) => (call[2] as string).trim() === "Clickable Team",
      );
      expect(teamCallIdx).toBeGreaterThanOrEqual(0);
      const teamText = textSpy.mock.results[teamCallIdx].value;

      expect(teamText.setInteractive).toHaveBeenCalledWith({
        useHandCursor: true,
      });
      expect(teamText.on).toHaveBeenCalledWith(
        "pointerover",
        expect.any(Function),
      );
      expect(teamText.on).toHaveBeenCalledWith(
        "pointerout",
        expect.any(Function),
      );
      expect(teamText.on).toHaveBeenCalledWith(
        "pointerdown",
        expect.any(Function),
      );
    });

    it("clicking a saved team updates workingMembers and closes popup", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "g",
            name: "Mages Only",
            members: [
              { actorClassId: "Mage", position: "BACKLINE" },
              { actorClassId: "Summoner", position: "BACKLINE" },
            ],
            createdAt: 1,
            lastModified: 1,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(partyCreation.popup).not.toBeNull();

      const teamCallIdx = textSpy.mock.calls.findIndex(
        (call: unknown[]) => (call[2] as string).trim() === "Mages Only",
      );
      expect(teamCallIdx).toBeGreaterThanOrEqual(0);
      const teamText = textSpy.mock.results[teamCallIdx].value;
      const pointerdown = teamText.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      pointerdown![1]();

      expect(partyCreation.workingMembers).toHaveLength(2);
      expect(partyCreation.workingMembers[0].name).toBe("Mage");
      expect(partyCreation.workingMembers[1].name).toBe("Summoner");
      expect(partyCreation.popup).toBeNull();
    });

    it("does nothing when clicked team has no resolvable members", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "g",
            name: "Unknown Team",
            members: [{ actorClassId: "UnknownClass", position: "FRONTLINE" }],
            createdAt: 1,
            lastModified: 1,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const teamCallIdx = textSpy.mock.calls.findIndex(
        (call: unknown[]) => (call[2] as string).trim() === "Unknown Team",
      );
      expect(teamCallIdx).toBeGreaterThanOrEqual(0);
      const teamText = textSpy.mock.results[teamCallIdx].value;
      const pointerdown = teamText.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      pointerdown![1]();

      expect(partyCreation.workingMembers).toEqual(players);
    });

    it("creates background rectangle with popup dimensions and depth", () => {
      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();

      const popupBgCalls = rectSpy.mock.calls.filter(
        (call: unknown[]) => call[4] === CONSTS.POPUP_BG,
      );
      const loadPopupBg = popupBgCalls[popupBgCalls.length - 1];
      expect(loadPopupBg).toBeTruthy();
      expect(loadPopupBg[2]).toBe(CONSTS.LOAD_POPUP_W);
      expect(loadPopupBg[3]).toBe(CONSTS.LOAD_POPUP_H);
    });

    it("shows close button that destroys the popup on click", async () => {
      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).showLoadPopup();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const closeCallIdx = textSpy.mock.calls.findIndex(
        (call: unknown[]) => call[2] === "X" && typeof call[1] === "number",
      );
      expect(closeCallIdx).toBeGreaterThanOrEqual(0);
      const closeText = textSpy.mock.results[closeCallIdx].value;

      expect(closeText.setInteractive).toHaveBeenCalledWith({
        useHandCursor: true,
      });

      const pointerdown = closeText.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      expect(pointerdown).toBeTruthy();

      expect(partyCreation.popup).not.toBeNull();
      pointerdown![1]();
      expect(partyCreation.popup).toBeNull();
    });

    it("destroyLoadPopup sets loadPopup to null", () => {
      (scene as any).showLoadPopup();
      expect((scene as any).popup).not.toBeNull();
      (scene as any).destroyPopup();
      expect((scene as any).popup).toBeNull();
    });

    it("replaces popup when showLoadPopup is called while already open", () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).showLoadPopup();
      const firstPopup = partyCreation.popup;
      expect(firstPopup).not.toBeNull();

      (partyCreation as any).showLoadPopup();
      expect(partyCreation.popup).not.toBe(firstPopup);
      expect(partyCreation.popup?.length).toBeGreaterThan(0);
    });
  });

  describe("initial team selection", () => {
    it("creates 'Default' team in localStorage on scene create", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const defaultCall = calls.find(
        (call: string[]) =>
          call[0] === "rogue_sun_player_teams" &&
          JSON.parse(call[1]).some(
            (team: PlayerTeam) => team.name === "Default",
          ),
      );
      expect(defaultCall).toBeTruthy();
      const saved = JSON.parse(defaultCall![1]);
      const defaultTeam = saved.find(
        (team: PlayerTeam) => team.name === "Default",
      );
      expect(defaultTeam.members).toEqual(
        players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        })),
      );
    });

    it("updates existing 'Default' team instead of creating a duplicate", async () => {
      const existing = {
        id: "existing-default",
        name: CONSTS.TEAM_NAME_DEFAULT,
        members: [{ actorClassId: "Fighter", position: "FRONTLINE" }],
        createdAt: 100,
        lastModified: 100,
      };
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([existing]),
      );

      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const last = calls[calls.length - 1];
      const saved = JSON.parse(last[1]);
      const defaultTeams = saved.filter(
        (team: PlayerTeam) => team.name === CONSTS.TEAM_NAME_DEFAULT,
      );
      expect(defaultTeams).toHaveLength(1);
      expect(defaultTeams[0].id).toBe("existing-default");
      expect(defaultTeams[0].members).toEqual(
        players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        })),
      );
    });

    it("selects 'Current Party' team on scene create when it exists", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "h",
            name: CONSTS.TEAM_NAME_CURRENT,
            members: [
              { actorClassId: "Fighter", position: "FRONTLINE" },
              { actorClassId: "Mage", position: "BACKLINE" },
            ],
            createdAt: 1,
            lastModified: 1,
          },
          {
            id: "i",
            name: "Default",
            members: [],
            createdAt: 2,
            lastModified: 2,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(partyCreation.workingMembers).toHaveLength(2);
      expect(partyCreation.workingMembers[0].name).toBe("Fighter");
      expect(partyCreation.workingMembers[1].name).toBe("Mage");
    });

    it("falls back to 'Default' when no 'Current Party' exists", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "j",
            name: "Default",
            members: [{ actorClassId: "Thief", position: "FLANK" }],
            createdAt: 1,
            lastModified: 1,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(partyCreation.workingMembers).toHaveLength(1);
      expect(partyCreation.workingMembers[0].name).toBe("Thief");
    });

    it("shows all players when no saved teams exist", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(partyCreation.workingMembers).toEqual(players);
    });
  });

  describe("party lane rendering", () => {
    it("shows lane header labels for each PRIMARY_LANE", () => {
      const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock
        .calls as unknown[][];
      const laneHeaders = textCalls.filter(
        (call) => call[1] === CONSTS.LANE_HEADER_Y + 40,
      );
      expect(laneHeaders.length).toBe(CONSTS.PRIMARY_LANES.length);
    });

    it("creates cards for all player characters", () => {
      const rectCalls = (scene.add.rectangle as ReturnType<typeof vi.fn>).mock
        .calls as unknown[][];
      const cardRects = rectCalls.filter((call) => call[4] === CONSTS.CARD_BG);
      expect(cardRects.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("pool cards", () => {
    it("creates a pool entry for each player class", () => {
      expect(scene.poolCards.length).toBe(players.length);
    });

    it("dims pool cards for placed actors", () => {
      for (const poolCard of scene.poolCards) {
        expect(poolCard.card.setAlpha).toHaveBeenCalledWith(0.4);
        expect(poolCard.card.disableInteractive).toHaveBeenCalled();
      }
    });

    it("fully enables pool cards for unplaced actors", () => {
      (scene as any).workingMembers = [];
      (scene as any).rebuildLanesAndPool();

      for (const poolCard of scene.poolCards) {
        const alphaCalls = (poolCard.card.setAlpha as ReturnType<typeof vi.fn>)
          .mock.calls;
        const lastAlpha = alphaCalls[alphaCalls.length - 1];
        expect(lastAlpha).toEqual([1]);
      }
    });
  });

  describe("drag-and-drop", () => {
    it("stores drag state on dragstart for available actor", () => {
      (scene as any).workingMembers = [players[0]];
      (scene as any).rebuildLanesAndPool();

      const mageCard = scene.poolCards.find(
        (poolCard) => poolCard.actor.name === "Mage",
      )!.card;
      scene.input.emit("dragstart", { x: 100, y: 100 }, mageCard);

      expect(scene.drag).not.toBeNull();
      expect(scene.drag!.actor.name).toBe("Mage");
    });

    it("refuses drag for already-placed actor", () => {
      (scene as any).workingMembers = [...players];
      (scene as any).rebuildLanesAndPool();

      const fighterCard = scene.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      scene.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);

      expect(scene.drag).toBeNull();
    });

    it("adds actor to workingMembers when dropped on a lane", () => {
      (scene as any).workingMembers = [];
      (scene as any).rebuildLanesAndPool();

      const fighterCard = scene.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      scene.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);

      const sceneCx = scene.cameras.main.centerX;
      const laneSpan =
        (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + CONSTS.CARD_W;
      const laneLeft = sceneCx - laneSpan / 2;
      const dropX = laneLeft + 2 * CONSTS.LANE_OFFSET + CONSTS.CARD_W / 2;
      const dropY = CONSTS.CARD_START_Y + 40 + 10;
      scene.input.emit("dragend", { x: dropX, y: dropY });

      expect(scene.workingMembers).toHaveLength(1);
      expect(scene.workingMembers[0].name).toBe("Fighter");
      expect(scene.workingMembers[0].position).toBe(
        CONSTS.ActorPosition.FRONTLINE,
      );
    });

    it("does not add actor when dropped outside lanes", () => {
      (scene as any).workingMembers = [];
      (scene as any).rebuildLanesAndPool();

      const fighterCard = scene.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      scene.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);

      scene.input.emit("dragend", { x: 0, y: 0 });

      expect(scene.workingMembers).toHaveLength(0);
      expect(scene.drag).toBeNull();
    });
  });

  describe("lane picker popup", () => {
    it("shows popup when pool card is clicked (no drag movement)", () => {
      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();
      (partyCreation as any).workingMembers = [];
      (partyCreation as any).rebuildLanesAndPool();

      const fighterCard = partyCreation.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      partyCreation.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);
      partyCreation.input.emit("dragend", { x: 100, y: 100 });

      expect(partyCreation.popup).not.toBeNull();

      // Verify "Select Lane" title is rendered
      const titleArgs = textSpy.mock.calls.find(
        (call: unknown[]) => call[2] === "Select Lane",
      );
      expect(titleArgs).toBeTruthy();
    });

    it("selecting a lane from picker places the actor", () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).workingMembers = [];
      (partyCreation as any).rebuildLanesAndPool();

      const fighterCard = partyCreation.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      partyCreation.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);
      partyCreation.input.emit("dragend", { x: 100, y: 100 });

      expect(partyCreation.popup).not.toBeNull();
      (partyCreation as any).pickLane(
        { name: "Fighter" },
        CONSTS.ActorPosition.BACKLINE,
      );

      const placed = partyCreation.workingMembers.find(
        (mem: { name: string; position?: string }) => mem.name === "Fighter",
      )!;
      expect(placed).toBeTruthy();
      expect(placed.position).toBe(CONSTS.ActorPosition.BACKLINE);
      expect(partyCreation.popup).toBeNull();
    });

    it("close X destroys the picker", () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).workingMembers = [];
      (partyCreation as any).rebuildLanesAndPool();

      const fighterCard = partyCreation.poolCards.find(
        (poolCard) => poolCard.actor.name === "Fighter",
      )!.card;
      partyCreation.input.emit("dragstart", { x: 100, y: 100 }, fighterCard);
      partyCreation.input.emit("dragend", { x: 100, y: 100 });

      expect(partyCreation.popup).not.toBeNull();

      (partyCreation as any).destroyPopup();

      expect(partyCreation.popup).toBeNull();
    });
  });

  describe("remove from team", () => {
    it("removes actor from workingMembers when lane card is clicked", () => {
      const initialLen = scene.workingMembers.length;
      (scene as any).removeFromTeam("Fighter");

      expect(scene.workingMembers.length).toBe(initialLen - 1);
      expect(scene.workingMembers.find((i) => i.name === "Fighter")).toBe(
        undefined,
      );
    });

    it("does nothing when removing non-existent member", () => {
      const initialLen = scene.workingMembers.length;
      (scene as any).removeFromTeam("NonExistent");
      expect(scene.workingMembers.length).toBe(initialLen);
    });
  });

  describe("save team button", () => {
    it("renders a 'Save Team' button", () => {
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Save Team",
        expect.any(Object),
      );
    });

    it("has a clickable background with pointerdown handler", () => {
      const rectCalls = (
        scene.add.rectangle as unknown as ReturnType<typeof vi.fn>
      ).mock.results as { value: Record<string, ReturnType<typeof vi.fn>> }[];
      const interactiveRects = rectCalls.filter((i) =>
        i.value.setInteractive?.mock.calls.some(
          (call: unknown[]) =>
            typeof call[0] === "object" &&
            (call[0] as Record<string, boolean>).useHandCursor === true,
        ),
      );
      expect(interactiveRects.length).toBeGreaterThanOrEqual(2);
    });

    it("saves team to localStorage via handleSaveTeam", async () => {
      const inputEl = { node: { value: "My Team" } };
      (scene as any).workingMembers = [
        {
          name: "Fighter",
          position: "FRONTLINE",
          speed: 30,
          health: 120,
          stamina: 80,
          energy: 50,
        },
      ];
      await (scene as any).handleSaveTeam(inputEl);

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const last = calls[calls.length - 1];
      const saved = JSON.parse(last[1]);
      const team = saved.find((i: PlayerTeam) => i.name === "My Team");
      expect(team).toBeTruthy();
      expect(team.members).toEqual([
        { actorClassId: "Fighter", position: "FRONTLINE" },
      ]);
    });

    it("does not save when team name is empty", async () => {
      const inputEl = { node: { value: "  " } };
      (scene as any).workingMembers = [
        { name: "Fighter", position: "FRONTLINE" },
      ];
      const setItemBefore = (localStorage.setItem as ReturnType<typeof vi.fn>)
        .mock.calls.length;
      await (scene as any).handleSaveTeam(inputEl);
      const setItemAfter = (localStorage.setItem as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      expect(setItemAfter).toBe(setItemBefore);
    });

    it("shows error text when name is too short", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      (partyCreation as any).showSavePopup();

      await (partyCreation as any).handleSaveTeam({ node: { value: "A" } });

      expect((partyCreation as any).saveErrText.setText).toHaveBeenCalledWith(
        `Name must be at least ${CONSTS.MIN_TEAM_NAME_LENGTH} characters.`,
      );
    });

    it("shows teamService validation errors in popup", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));
      (partyCreation as any).workingMembers = [];

      (partyCreation as any).showSavePopup();
      expect((partyCreation as any).saveErrText).not.toBeNull();

      await (partyCreation as any).handleSaveTeam({
        node: { value: "Default" },
      });

      expect((partyCreation as any).saveErrText.setText).toHaveBeenCalled();
    });
  });

  describe("team validation rules", () => {
    function makeScene(members: { name: string; position: string }[]) {
      const scn = new PartyCreation();
      scn.create();
      (scn as any).workingMembers = members;
      return scn;
    }

    it("passes for the default full team", () => {
      const errs = (scene as any).validateTeamRules();
      expect(errs).toEqual([]);
    });

    it("passes with exactly 3 characters in one lane", () => {
      const scn = makeScene([
        { name: "A", position: "FRONTLINE" },
        { name: "B", position: "FRONTLINE" },
        { name: "C", position: "FRONTLINE" },
        { name: "D", position: "BACKLINE" },
      ]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toEqual([]);
    });

    it("rejects a lane with 4 characters", () => {
      const scn = makeScene([
        { name: "A", position: "FRONTLINE" },
        { name: "B", position: "FRONTLINE" },
        { name: "C", position: "FRONTLINE" },
        { name: "D", position: "FRONTLINE" },
        { name: "E", position: "BACKLINE" },
      ]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toContain(
        "Maximum of 3 characters per lane - FRONTLINE has 4.",
      );
    });

    it("rejects fewer than 2 non-empty lanes (0 lanes)", () => {
      const scn = makeScene([]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toContain(
        "At least 2 primary lanes must have characters assigned.",
      );
    });

    it("rejects fewer than 2 non-empty lanes (1 lane)", () => {
      const scn = makeScene([{ name: "A", position: "FRONTLINE" }]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toContain(
        "At least 2 primary lanes must have characters assigned.",
      );
    });

    it("rejects more than 1 flank character", () => {
      const scn = makeScene([
        { name: "A", position: "FLANK" },
        { name: "B", position: "FLANK" },
        { name: "C", position: "FRONTLINE" },
        { name: "D", position: "BACKLINE" },
      ]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toContain(
        "Maximum of 1 character in the Flank lane (has 2).",
      );
    });

    it("rejects flank without a non-empty lane", () => {
      const scn = makeScene([{ name: "A", position: "FLANK" }]);
      const errs = (scn as any).validateTeamRules();
      expect(errs).toContain(
        "When there is a character in the Flank lane, at least 1 other primary lane must have at least 1 character.",
      );
    });

    it("rejects flank when a lane has 3+ characters", () => {
      const scn = makeScene([
        { name: "A", position: "FLANK" },
        { name: "B", position: "FRONTLINE" },
        { name: "C", position: "FRONTLINE" },
        { name: "D", position: "FRONTLINE" },
        { name: "E", position: "BACKLINE" },
      ]);
      const errs = (scn as any).validateTeamRules();
      expect(errs.some((msg: string) => /flank.*fewer than 3/i.test(msg))).toBe(
        true,
      );
    });
  });

  describe("Start Game enforces validation", () => {
    it("shows alert popup and does not transition when team is invalid", async () => {
      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      partyCreation.create();
      (partyCreation as any).workingMembers = [];

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      const pointerdown = rect.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      await pointerdown![1]();

      expect(partyCreation.popup).not.toBeNull();
      expect(partyCreation.scene.start).not.toHaveBeenCalled();
    });
  });

  describe("Help popup", () => {
    it("shows and hides the help popup with rules text", () => {
      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();

      (partyCreation as any).showHelpPopup();

      // Popup background rectangle
      expect(rectSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        CONSTS.HELP_POPUP_W,
        CONSTS.HELP_POPUP_H,
        CONSTS.POPUP_BG,
      );

      // Title text
      expect(textSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Party Creation Rules",
        expect.any(Object),
      );

      // Close button
      expect(textSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "X",
        expect.objectContaining({ color: CONSTS.POPUP_CLOSE_COLOR }),
      );

      // Rules body text
      const rulesText = (partyCreation as any).rulesText;
      expect(textSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        rulesText,
        expect.any(Object),
      );

      expect((partyCreation as any).popup).not.toBeNull();

      (partyCreation as any).destroyPopup();

      expect((partyCreation as any).popup).toBeNull();
    });
  });

  describe("Save Team enforces validation", () => {
    it("rejects save when team is invalid", () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).workingMembers = [];

      const errs = (partyCreation as any).validateTeamRules();

      expect(errs.length).toBeGreaterThan(0);
    });

    it("shows save popup when team is valid", () => {
      const partyCreation = new PartyCreation();
      const domSpy = vi.spyOn(partyCreation.add, "dom");
      partyCreation.create();
      (partyCreation as any).workingMembers = [
        { name: "A", position: "FRONTLINE" },
        { name: "B", position: "BACKLINE" },
      ];

      (partyCreation as any).showSavePopup();

      expect(domSpy).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "input",
        expect.objectContaining({ type: "text" }),
      );
    });
  });

  describe("popup overlay", () => {
    it("has no overlay by default", () => {
      expect(scene.popupOverlay).toBeNull();
    });

    it("creates overlay when help popup opens", () => {
      (scene as any).showHelpPopup();
      expect(scene.popupOverlay).not.toBeNull();
      expect(scene.popupOverlay!.setInteractive).toHaveBeenCalled();
    });

    it("creates overlay when lane picker opens", () => {
      (scene as any).showLanePicker({ name: "Fighter", position: "" });
      expect(scene.popupOverlay).not.toBeNull();
    });

    it("creates overlay when load popup opens", () => {
      (scene as any).showLoadPopup();
      expect(scene.popupOverlay).not.toBeNull();
    });

    it("destroys overlay when help popup is closed", () => {
      (scene as any).showHelpPopup();
      expect(scene.popupOverlay).not.toBeNull();
      (scene as any).destroyPopup();
      expect(scene.popupOverlay).toBeNull();
    });

    it("destroys overlay when lane picker is closed", () => {
      (scene as any).showLanePicker({ name: "Fighter", position: "" });
      expect(scene.popupOverlay).not.toBeNull();
      (scene as any).destroyPopup();
      expect(scene.popupOverlay).toBeNull();
    });

    it("destroys overlay when load popup is closed", () => {
      (scene as any).showLoadPopup();
      expect(scene.popupOverlay).not.toBeNull();
      (scene as any).destroyPopup();
      expect(scene.popupOverlay).toBeNull();
    });

    it("destroys overlay when the only popup closes", () => {
      (scene as any).showHelpPopup();
      expect(scene.popupOverlay).not.toBeNull();
      (scene as any).destroyPopup();
      expect(scene.popupOverlay).toBeNull();
    });

    it("creates overlay when save popup opens", () => {
      (scene as any).showSavePopup();
      expect(scene.popupOverlay).not.toBeNull();
    });

    it("destroys overlay when save popup is closed", () => {
      (scene as any).showSavePopup();
      expect(scene.popupOverlay).not.toBeNull();
      (scene as any).destroyPopup();
      expect(scene.popupOverlay).toBeNull();
    });

    it("covers the full scene at correct depth", () => {
      (scene as any).showHelpPopup();
      const rect = scene.popupOverlay!;
      expect(rect.setDepth).toHaveBeenCalledWith(CONSTS.POPUP_DEPTH - 1);
    });
  });
});
