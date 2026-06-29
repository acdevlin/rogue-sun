import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { PartyCreation } from "../PartyCreation";
import type { PlayerTeam } from "../../data/PlayerTeam";
import * as CONSTS from "../../../constants";
import { players } from "../../data/playerActorClasses";
import type { PlayerActorData } from "../../data/PlayerActorData";

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

  it("renders 'Start Game' button text", () => {
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      "Start Game",
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
        (team: PlayerTeam) => team.name === "Current Party",
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
        name: "Current Party",
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
        saved.filter((team: PlayerTeam) => team.name === "Current Party"),
      ).toHaveLength(1);
      expect(current.members).toEqual(
        players.map((player) => ({
          actorClassId: player.name,
          position: player.position,
        })),
      );
    });
  });

  describe("saved teams list", () => {
    it("shows 'Saved Teams' header label", () => {
      expect(scene.add.text).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
        "Saved Teams",
        expect.any(Object),
      );
    });

    it("shows 'No saved teams' when localStorage is empty", async () => {
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
            name: "Current Party",
            members: [],
            createdAt: 3,
            lastModified: 3,
          },
        ]),
      );

      const partyCreation = new PartyCreation();
      const textSpy = vi.spyOn(partyCreation.add, "text");
      partyCreation.create();

      await new Promise((resolve) => setTimeout(resolve, 0));

      const teamEntries = textSpy.mock.calls
        .filter(
          (call: unknown[]) =>
            typeof call[2] === "string" && call[2].startsWith("  "),
        )
        .map((call: unknown[]) => (call[2] as string).trim());
      const idxCurrent = teamEntries.indexOf("Current Party");
      const idxDefault = teamEntries.indexOf("Default");
      const idxZ = teamEntries.indexOf("Z Team");
      expect(idxCurrent).toBe(0);
      expect(idxDefault).toBe(1);
      expect(idxZ).toBe(2);
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

    it("clicking a saved team updates workingMembers", async () => {
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

      await new Promise((resolve) => setTimeout(resolve, 0));

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

    it("selects 'Current Party' team on scene create when it exists", async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(
        JSON.stringify([
          {
            id: "h",
            name: "Current Party",
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
    beforeEach(() => {
      vi.stubGlobal("alert", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

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

      expect(partyCreation.picker).not.toBeNull();

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

      expect(partyCreation.picker).not.toBeNull();
      (partyCreation as any).pickLane(
        { name: "Fighter" },
        CONSTS.ActorPosition.BACKLINE,
      );

      const placed = partyCreation.workingMembers.find(
        (mem: { name: string; position?: string }) => mem.name === "Fighter",
      )!;
      expect(placed).toBeTruthy();
      expect(placed.position).toBe(CONSTS.ActorPosition.BACKLINE);
      expect(partyCreation.picker).toBeNull();
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

      expect(partyCreation.picker).not.toBeNull();

      (partyCreation as any).destroyLanePicker();

      expect(partyCreation.picker).toBeNull();
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

    it("saves team to localStorage when save completes", async () => {
      vi.stubGlobal("prompt", vi.fn().mockReturnValue("New Team"));
      vi.stubGlobal("alert", vi.fn());

      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const sceneAny = partyCreation as unknown as {
        promptSaveTeam: () => Promise<void>;
        workingMembers: PlayerActorData[];
      };
      sceneAny.workingMembers = [
        {
          name: "Fighter",
          position: "FRONTLINE",
          speed: 30,
          health: 120,
          stamina: 80,
          energy: 50,
        },
      ];
      await sceneAny.promptSaveTeam();

      const calls = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls;
      const last = calls[calls.length - 1];
      const saved = JSON.parse(last[1]);
      const team = saved.find((i: PlayerTeam) => i.name === "New Team");
      expect(team).toBeTruthy();
      expect(team.members).toEqual([
        { actorClassId: "Fighter", position: "FRONTLINE" },
      ]);

      vi.unstubAllGlobals();
    });

    it("does not save when team name is empty", async () => {
      vi.stubGlobal("prompt", vi.fn().mockReturnValue("  "));
      vi.stubGlobal("alert", vi.fn());

      const sceneAny = scene as unknown as {
        promptSaveTeam: () => Promise<void>;
      };
      const setItemBefore = (localStorage.setItem as ReturnType<typeof vi.fn>)
        .mock.calls.length;
      await sceneAny.promptSaveTeam();
      const setItemAfter = (localStorage.setItem as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      expect(setItemAfter).toBe(setItemBefore);

      vi.unstubAllGlobals();
    });
  });

  describe("team validation rules", () => {
    beforeEach(() => {
      vi.stubGlobal("alert", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

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
    beforeEach(() => {
      vi.stubGlobal("alert", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("alerts and does not transition when team is invalid", async () => {
      const partyCreation = new PartyCreation();
      const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
      partyCreation.create();
      (partyCreation as any).workingMembers = [];

      const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
      const pointerdown = rect.on.mock.calls.find(
        (call: string[]) => call[0] === "pointerdown",
      );
      await pointerdown![1]();

      expect(globalThis.alert).toHaveBeenCalled();
      expect(partyCreation.scene.start).not.toHaveBeenCalled();
    });
  });

  describe("Help popup", () => {
    beforeEach(() => {
      vi.stubGlobal("alert", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

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

      expect((partyCreation as any).helpPopup).not.toBeNull();

      (partyCreation as any).destroyHelpPopup();

      expect((partyCreation as any).helpPopup).toBeNull();
    });
  });

  describe("Save Team enforces validation", () => {
    beforeEach(() => {
      vi.stubGlobal("alert", vi.fn());
      vi.stubGlobal("prompt", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("rejects save when team is invalid", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).workingMembers = [];

      const errs = (partyCreation as any).validateTeamRules();

      expect(errs.length).toBeGreaterThan(0);
      expect(globalThis.prompt).not.toHaveBeenCalled();
    });

    it("proceeds to prompt when team is valid", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      (partyCreation as any).workingMembers = [
        { name: "A", position: "FRONTLINE" },
        { name: "B", position: "BACKLINE" },
      ];

      await (partyCreation as any).promptSaveTeam();

      expect(globalThis.prompt).toHaveBeenCalled();
    });
  });
});
