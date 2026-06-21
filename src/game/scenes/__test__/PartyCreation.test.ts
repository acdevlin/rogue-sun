import { PartyCreation } from "../PartyCreation";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as CONSTS from "../../../constants";

vi.mock("phaser", () => {
  const mockObj = () => ({
    setOrigin: vi.fn().mockReturnThis(),
    setStrokeStyle: vi.fn().mockReturnThis(),
    setDepth: vi.fn().mockReturnThis(),
    setInteractive: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockReturnThis(),
    setColor: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    width: 0,
    height: 0,
  });

  return {
    AUTO: 0,
    Scale: {
      RESIZE: "resize",
      Center: { CENTER_BOTH: "center-both" },
    },
    Scene: class MockScene {
      key: string;
      cameras = {
        main: {
          width: CONSTS.SCENE_800_600_W,
          height: CONSTS.SCENE_800_600_H,
          centerX: CONSTS.SCENE_800_600_CX,
          centerY: CONSTS.SCENE_800_600_CY,
          setBackgroundColor: vi.fn(),
        },
      };
      add = {
        text: vi.fn(() => mockObj()),
        rectangle: vi.fn(() => mockObj()),
      };
      scene = { start: vi.fn() };

      constructor(key: string) {
        this.key = key;
      }
    },
  };
});

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

    expect(rectSpy).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      CONSTS.BTN_FILL,
    );
    const rect = rectSpy.mock.results[0].value;
    expect(rect.setStrokeStyle).toHaveBeenCalledWith(
      CONSTS.BTN_STROKE_W,
      CONSTS.BTN_STROKE,
    );
    expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });

  it("transitions to Game scene on button click", () => {
    const partyCreation = new PartyCreation();
    const rectSpy = vi.spyOn(partyCreation.add, "rectangle");
    partyCreation.create();

    const rect = rectSpy.mock.results[0].value;
    // Find the pointerdown event registration and invoke its callback
    // (mock calls store args as [eventName, handler], so [1] is the handler fn)
    const pointerdown = rect.on.mock.calls.find(
      (call: string[]) => call[0] === "pointerdown",
    );
    expect(pointerdown).toBeTruthy();
    pointerdown![1]();
    expect(partyCreation.scene.start).toHaveBeenCalledWith("Battle");
  });
});
