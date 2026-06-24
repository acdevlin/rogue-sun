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

    it("clicking a saved team updates currentMembers", async () => {
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

      expect(partyCreation.currentMembers).toHaveLength(2);
      expect(partyCreation.currentMembers[0].name).toBe("Mage");
      expect(partyCreation.currentMembers[1].name).toBe("Summoner");
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

      expect(partyCreation.currentMembers).toEqual(players);
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

      expect(partyCreation.currentMembers).toHaveLength(2);
      expect(partyCreation.currentMembers[0].name).toBe("Fighter");
      expect(partyCreation.currentMembers[1].name).toBe("Mage");
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

      expect(partyCreation.currentMembers).toHaveLength(1);
      expect(partyCreation.currentMembers[0].name).toBe("Thief");
    });

    it("shows all players when no saved teams exist", async () => {
      const partyCreation = new PartyCreation();
      partyCreation.create();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(partyCreation.currentMembers).toEqual(players);
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
});
