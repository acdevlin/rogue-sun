import { PartyCreation } from "../PartyCreation";
import { describe, it, expect, vi, beforeEach } from "vitest";

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
          width: 800,
          height: 600,
          centerX: 400,
          centerY: 300,
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
    const s = new PartyCreation();
    const rectSpy = vi.spyOn(s.add, "rectangle");
    s.create();

    expect(rectSpy).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      0x444444,
    );
    const rect = rectSpy.mock.results[0].value;
    expect(rect.setStrokeStyle).toHaveBeenCalledWith(2, 0xffffff);
    expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });

  it("transitions to Game scene on button click", () => {
    const s = new PartyCreation();
    const rectSpy = vi.spyOn(s.add, "rectangle");
    s.create();

    const rect = rectSpy.mock.results[0].value;
    const pointerdown = rect.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerdown",
    );
    expect(pointerdown).toBeTruthy();
    pointerdown![1]();
    expect(s.scene.start).toHaveBeenCalledWith("Battle");
  });
});
