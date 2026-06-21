import { describe, it, expect, vi } from "vitest";
import type { Scene } from "phaser";

vi.mock("phaser", () => {
  class Scene {
    scene = { start: vi.fn() };
    load = { image: vi.fn() };
    cameras = { main: { centerX: 0, centerY: 0, width: 0, height: 0 } };
    add = { text: vi.fn(), rectangle: vi.fn() };
    constructor(_key?: string) {
      void _key;
    }
  }
  const GameObjects = { Text: class {}, Rectangle: class {} };
  return {
    Scene,
    GameObjects,
    default: { Scene, GameObjects },
    AUTO: 0,
    Scale: { FIT: undefined, Center: { CENTER_BOTH: undefined } },
    Game: class {
      constructor(_cfg?: unknown) {
        void _cfg;
      }
      scale = { lockOrientation: vi.fn() };
    },
    Types: {},
  };
});

import { createBtn } from "../UiElements";
import * as CONSTS from "../../../constants";

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

type MockScene = {
  add: {
    text: ReturnType<typeof vi.fn>;
    rectangle: ReturnType<typeof vi.fn>;
  };
};

function makeScene(): MockScene {
  return {
    add: { text: vi.fn(() => mockObj()), rectangle: vi.fn(() => mockObj()) },
  };
}

describe("createBtn", () => {
  it("creates text with correct label and position", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Click",
      onClick: vi.fn(),
    });
    expect(scene.add.text).toHaveBeenCalledWith(
      CONSTS.BTN_CX,
      CONSTS.BTN_CY,
      "Click",
      expect.objectContaining({ fontFamily: CONSTS.UI_FONT_FAMILY }),
    );
  });

  it("creates text at default scale 1 when scale is omitted", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      expect.objectContaining({ fontSize: Math.round(CONSTS.MENU_FONT_SIZE) }),
    );
  });

  it("applies scale to font size", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
      scale: CONSTS.BTN_TEST_SCALE,
    });
    expect(scene.add.text).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(String),
      expect.objectContaining({
        fontSize: Math.round(CONSTS.MENU_FONT_SIZE * CONSTS.BTN_TEST_SCALE),
      }),
    );
  });

  it("creates a styled background rectangle", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    expect(scene.add.rectangle).toHaveBeenCalledWith(
      CONSTS.BTN_CX,
      CONSTS.BTN_CY,
      expect.any(Number),
      expect.any(Number),
      CONSTS.BTN_FILL,
    );
  });

  it("wires pointerdown to onClick callback", () => {
    const onClick = vi.fn();
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick,
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    const pointerdown = rect.on.mock.calls.find(
      (c: string[]) => c[0] === "pointerdown",
    );
    expect(pointerdown).toBeTruthy();
    pointerdown![1]();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("registers pointerover and pointerout hover handlers", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    expect(rect.on).toHaveBeenCalledWith("pointerover", expect.any(Function));
    expect(rect.on).toHaveBeenCalledWith("pointerout", expect.any(Function));
  });

  it("returns label and bg game objects", () => {
    const scene = makeScene();
    const result = createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    expect(result.label).toBeTruthy();
    expect(result.bg).toBeTruthy();
  });

  it("pointerover sets hover fill and text color", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    const btn = scene.add.text.mock.results[0].value;
    const over = rect.on.mock.calls.find(
      (c: string[]) => c[0] === "pointerover",
    );
    over![1]();
    expect(rect.setFillStyle).toHaveBeenCalledWith(CONSTS.BTN_HOVER_FILL);
    expect(btn.setColor).toHaveBeenCalledWith(CONSTS.BTN_HOVER_TEXT);
  });

  it("pointerout resets fill and text color", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    const btn = scene.add.text.mock.results[0].value;
    const out = rect.on.mock.calls.find((c: string[]) => c[0] === "pointerout");
    out![1]();
    expect(rect.setFillStyle).toHaveBeenCalledWith(CONSTS.BTN_FILL);
    expect(btn.setColor).toHaveBeenCalledWith(CONSTS.MENU_TEXT_COLOR);
  });

  it("sets bg depth to BTN_DEPTH", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    expect(rect.setDepth).toHaveBeenCalledWith(CONSTS.BTN_DEPTH);
  });

  it("sets bg interactive with hand cursor", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const rect = scene.add.rectangle.mock.results[0].value;
    expect(rect.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });

  it("sets text origin to 0.5", () => {
    const scene = makeScene();
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    const btn = scene.add.text.mock.results[0].value;
    expect(btn.setOrigin).toHaveBeenCalledWith(0.5);
  });

  it("applies BTN_PAD to bg width and height", () => {
    const scene = makeScene();
    const btnObj = mockObj();
    btnObj.width = CONSTS.TEXT_W;
    btnObj.height = CONSTS.TEXT_H;
    scene.add.text.mockReturnValue(btnObj);
    createBtn({
      scene: scene as unknown as Scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      label: "Go",
      onClick: vi.fn(),
    });
    expect(scene.add.rectangle).toHaveBeenCalledWith(
      CONSTS.BTN_CX,
      CONSTS.BTN_CY,
      CONSTS.TEXT_W + CONSTS.BTN_PAD,
      CONSTS.TEXT_H + CONSTS.BTN_PAD,
      CONSTS.BTN_FILL,
    );
  });
});
