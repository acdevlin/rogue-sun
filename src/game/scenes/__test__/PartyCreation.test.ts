import { describe, it, expect, vi, beforeEach } from "vitest";

import { PartyCreation } from "../PartyCreation";
import * as CONSTS from "../../../constants";

describe("PartyCreation Scene", () => {
  let scene: PartyCreation;

  beforeEach(() => {
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

  it("transitions to Battle on Start Game button click", () => {
    const partyCreation = new PartyCreation();
    const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
    partyCreation.create();

    const rect = rectSpy.mock.results[rectSpy.mock.results.length - 1].value;
    const pointerdown = rect.on.mock.calls.find(
      (call: string[]) => call[0] === "pointerdown",
    );
    expect(pointerdown).toBeTruthy();
    pointerdown![1]();
    expect(partyCreation.scene.start).toHaveBeenCalledWith("Battle");
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
