import { describe, it, expect, vi, beforeEach } from "vitest";

import { PartyCreation } from "../PartyCreation";
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

      expect(localStorage.setItem).toHaveBeenCalled();
      const key = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls[0][0];
      const raw = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      expect(key).toBe("rogue_sun_player_teams");
      const saved = JSON.parse(raw);
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe("Current Party");
      expect(saved[0].members).toEqual(
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

      const raw = (localStorage.setItem as ReturnType<typeof vi.fn>).mock
        .calls[0][1];
      const saved = JSON.parse(raw);
      expect(saved).toHaveLength(1);
      expect(saved[0].id).toBe("existing-id");
      expect(saved[0].name).toBe("Current Party");
      expect(saved[0].members).toEqual(
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
