import { describe, it, expect, vi } from "vitest";
import type { Scene } from "phaser";

import { createBtn, createActorCard, createLaneBlock } from "../UiElements";
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
    // Find the pointerdown event registration and invoke its callback
    // (mock calls store args as [eventName, handler], so [1] is the handler fn)
    const pointerdown = rect.on.mock.calls.find(
      (call: string[]) => call[0] === "pointerdown",
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
      (call: string[]) => call[0] === "pointerover",
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
    const out = rect.on.mock.calls.find(
      (call: string[]) => call[0] === "pointerout",
    );
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

describe("createLaneBlock", () => {
  const headerY = 55;
  const startY = 132;
  const gap = 94;

  it("draws lane header labels for each PRIMARY_LANE", () => {
    const scene = makeScene();
    createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft: 40,
      cardW: CONSTS.CARD_W,
      gap,
      maxLane: 2,
      flankIdx: 0,
      headerY,
      startY,
      controller: CONSTS.ActorController.PLAYER,
    });
    const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock
      .calls as unknown[][];
    const headers = textCalls.filter((call: unknown[]) => call[1] === headerY);
    expect(headers.length).toBe(CONSTS.PRIMARY_LANES.length);
  });

  it("draws header separator rectangle", () => {
    const scene = makeScene();
    createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft: 40,
      cardW: CONSTS.CARD_W,
      gap,
      maxLane: 2,
      flankIdx: 0,
      headerY,
      startY,
      controller: CONSTS.ActorController.PLAYER,
    });
    const rectSpy = scene.add.rectangle as ReturnType<typeof vi.fn>;
    const lineRects = rectSpy.mock.calls.filter(
      (call: unknown[]) => call[4] === CONSTS.LANE_LINE_COLOR,
    );
    expect(lineRects.length).toBeGreaterThanOrEqual(1);
  });

  it("draws FLANK section when flankIdx > 0", () => {
    const scene = makeScene();
    createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft: 40,
      cardW: CONSTS.CARD_W,
      gap,
      maxLane: 2,
      flankIdx: 1,
      headerY,
      startY,
      controller: CONSTS.ActorController.PLAYER,
    });
    const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock
      .calls as unknown[][];
    const flankLabel = textCalls.find((call: unknown[]) => call[2] === "FLANK");
    expect(flankLabel).toBeTruthy();
  });

  it("does NOT draw FLANK when flankIdx === 0", () => {
    const scene = makeScene();
    createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft: 40,
      cardW: CONSTS.CARD_W,
      gap,
      maxLane: 2,
      flankIdx: 0,
      headerY,
      startY,
      controller: CONSTS.ActorController.PLAYER,
    });
    const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock
      .calls as unknown[][];
    const flankLabel = textCalls.find((call: unknown[]) => call[2] === "FLANK");
    expect(flankLabel).toBeUndefined();
  });

  it("reverses lane order for non-PLAYER controller", () => {
    const scene = makeScene();
    const laneLeft = 40;
    const cardW = CONSTS.CARD_W;
    const laneSpan = (CONSTS.NUM_LANES - 1) * CONSTS.LANE_OFFSET + cardW;
    createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft,
      cardW,
      gap,
      maxLane: 2,
      flankIdx: 0,
      headerY,
      startY,
      controller: CONSTS.ActorController.ENEMY,
    });
    const textCalls = (scene.add.text as ReturnType<typeof vi.fn>).mock
      .calls as unknown[][];
    const headers = textCalls.filter((call: unknown[]) => call[1] === headerY);
    // For enemy, BACKLINE is rightmost at laneLeft + laneSpan - cardW / 2
    const backlineCall = headers.find(
      (call: unknown[]) => call[2] === "BACKLINE",
    );
    expect(backlineCall![0]).toBe(laneLeft + laneSpan - cardW / 2);
  });

  it("returns laneSpan, blockCx, and bot", () => {
    const scene = makeScene();
    const result = createLaneBlock({
      scene: scene as unknown as Scene,
      laneLeft: 40,
      controller: CONSTS.ActorController.PLAYER,
      cardW: CONSTS.CARD_W,
      gap,
      maxLane: 2,
      flankIdx: 1,
      headerY,
      startY,
    });
    expect(result.laneSpan).toBeGreaterThan(0);
    expect(result.blockCx).toBeGreaterThan(0);
    expect(result.bot).toBeGreaterThan(0);
  });
});

describe("createActorCard", () => {
  const cardOpts = {
    x: 100,
    y: 200,
    w: CONSTS.CARD_W,
    name: "Hero",
    health: 50,
    stamina: 30,
    energy: 20,
  };

  it("creates a card rectangle at correct position and size", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    expect(scene.add.rectangle).toHaveBeenCalledWith(
      100 + CONSTS.CARD_W / 2,
      200 + CONSTS.CARD_Y_OFFSET,
      CONSTS.CARD_W + CONSTS.CARD_EXTRA_W,
      CONSTS.CARD_HEIGHT,
      CONSTS.CARD_BG,
    );
  });

  it("applies stroke, origin, and depth to the card", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const rect = scene.add.rectangle.mock.results[0].value;
    expect(rect.setStrokeStyle).toHaveBeenCalledWith(
      CONSTS.CARD_STROKE_W,
      CONSTS.CARD_STROKE,
    );
    expect(rect.setOrigin).toHaveBeenCalledWith(0.5);
    expect(rect.setDepth).toHaveBeenCalledWith(CONSTS.CARD_DEPTH);
  });

  it("creates name label text with correct color", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    expect(scene.add.text).toHaveBeenCalledWith(
      100 + CONSTS.LABEL_X,
      200 - CONSTS.LABEL_Y,
      "Hero",
      expect.objectContaining({
        fontSize: `${CONSTS.UI_FONT}px`,
        color: CONSTS.LABEL_COLOR,
      }),
    );
  });

  it("shows alias above class name when alias is provided", () => {
    const scene = makeScene();
    createActorCard({
      scene: scene as unknown as Scene,
      ...cardOpts,
      alias: "John",
    });
    expect(scene.add.text).toHaveBeenCalledWith(
      100 + CONSTS.LABEL_X,
      200 - CONSTS.LABEL_Y,
      "John\nHero",
      expect.any(Object),
    );
  });

  it("creates HP stat text showing health value", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    expect(scene.add.text).toHaveBeenCalledWith(
      100 + CONSTS.STAT_TXT_X,
      200 + CONSTS.STAT_HP_Y,
      "HP 50",
      expect.objectContaining({
        fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
        color: CONSTS.STAT_HP_COLOR,
      }),
    );
  });

  it("creates SP stat text showing stamina value", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    expect(scene.add.text).toHaveBeenCalledWith(
      100 + CONSTS.STAT_TXT_X,
      200 + CONSTS.STAT_SP_Y,
      "SP 30",
      expect.objectContaining({
        fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
        color: CONSTS.STAT_SP_COLOR,
      }),
    );
  });

  it("creates EP stat text showing energy value", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    expect(scene.add.text).toHaveBeenCalledWith(
      100 + CONSTS.STAT_TXT_X,
      200 + CONSTS.STAT_EP_Y,
      "EP 20",
      expect.objectContaining({
        fontSize: `${CONSTS.STAT_FONT_SIZE}px`,
        color: CONSTS.STAT_EP_COLOR,
      }),
    );
  });

  it("returns card, bg, fill, label, and stat texts", () => {
    const scene = makeScene();
    const result = createActorCard({
      scene: scene as unknown as Scene,
      ...cardOpts,
    });
    expect(result.card).toBeTruthy();
    expect(result.progressBg).toBeTruthy();
    expect(result.fill).toBeTruthy();
    expect(result.label).toBeTruthy();
    expect(result.healthTxt).toBeTruthy();
    expect(result.staminaTxt).toBeTruthy();
    expect(result.energyTxt).toBeTruthy();
  });

  it("creates progress background rect at correct position, size, and color", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const bar = scene.add.rectangle.mock.calls[1];
    expect(bar[0]).toBe(100 + CONSTS.CARD_W / 2);
    expect(bar[1]).toBe(200 + CONSTS.CARD_H / 2);
    expect(bar[2]).toBe(CONSTS.CARD_W);
    expect(bar[3]).toBe(CONSTS.CARD_H);
    expect(bar[4]).toBe(CONSTS.FILL_BG);
  });

  it("progress bg origin is set to 0.5", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const bgRect = scene.add.rectangle.mock.results[1].value;
    expect(bgRect.setOrigin).toHaveBeenCalledWith(0.5);
  });

  it("creates progress fill rect starting at zero width", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const fill = scene.add.rectangle.mock.calls[2];
    expect(fill[0]).toBe(100 + CONSTS.FILL_INSET);
    expect(fill[1]).toBe(200 + CONSTS.FILL_INSET);
    expect(fill[2]).toBe(0);
    expect(fill[3]).toBe(CONSTS.CARD_H - CONSTS.FILL_INSET * 2);
    expect(fill[4]).toBe(CONSTS.PROGRESS_FILL);
  });

  it("progress fill origin is set to (0,0)", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const fillRect = scene.add.rectangle.mock.results[2].value;
    expect(fillRect.setOrigin).toHaveBeenCalledWith(0, 0);
  });

  it("uses default PROGRESS_FILL when fillColor is omitted", () => {
    const scene = makeScene();
    createActorCard({ scene: scene as unknown as Scene, ...cardOpts });
    const fill = scene.add.rectangle.mock.calls[2];
    expect(fill[4]).toBe(CONSTS.PROGRESS_FILL);
  });

  it("uses custom fillColor when provided", () => {
    const scene = makeScene();
    createActorCard({
      scene: scene as unknown as Scene,
      ...cardOpts,
      fillColor: 0xff0000,
    });
    const fill = scene.add.rectangle.mock.calls[2];
    expect(fill[4]).toBe(0xff0000);
  });
});
