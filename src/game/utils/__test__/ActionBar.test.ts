import { describe, it, expect, vi } from "vitest";
import { Scene } from "phaser";

import {
  createBattleActionBar,
  makeInteractive,
  activateTooltip,
  bindPressEffect,
} from "../ActionBar";
import * as CONSTS from "../../../constants";

describe("createBattleActionBar", () => {
  it("creates all action-bar icons at correct centered positions", () => {
    const scene = new Scene("test");
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();
    const onRetreat = vi.fn();

    createBattleActionBar({
      scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      showTooltip,
      hideTooltip,
      onRetreat,
    });

    const dx = CONSTS.ACTION_ICON_DX;
    const call = (iconScene: any, idx: number) =>
      iconScene.add.image.mock.calls[idx];
    expect(call(scene, 0)).toEqual([
      CONSTS.BTN_CX - dx * 2,
      CONSTS.BTN_CY,
      "icon_attack",
    ]);
    expect(call(scene, 1)).toEqual([
      CONSTS.BTN_CX - dx,
      CONSTS.BTN_CY,
      "icon_tactics",
    ]);
    expect(call(scene, 2)).toEqual([CONSTS.BTN_CX, CONSTS.BTN_CY, "icon_cast"]);
    expect(call(scene, 3)).toEqual([
      CONSTS.BTN_CX + dx,
      CONSTS.BTN_CY,
      "icon_wait",
    ]);
    expect(call(scene, 4)).toEqual([
      CONSTS.BTN_CX + dx * 2,
      CONSTS.BTN_CY,
      "icon_retreat",
    ]);
  });

  it("wires tooltips for all icons with correct labels and anchor math", () => {
    const scene = new Scene("test");
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();
    const onRetreat = vi.fn();

    createBattleActionBar({
      scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      showTooltip,
      hideTooltip,
      onRetreat,
    });

    // Icons are created in order: attack, tactics, cast, wait, retreat.
    const icons = [
      { label: "ATTACK", idx: 0 },
      { label: "TACTICS", idx: 1 },
      { label: "MAGIC", idx: 2 },
      { label: "WAIT", idx: 3 },
      { label: "RETREAT", idx: 4 },
    ];

    for (const { label, idx } of icons) {
      const icon = (scene.add.image as any).mock.results[idx].value;
      const over = icon.on.mock.calls.find(
        (call: unknown[]) => call[0] === "pointerover",
      );
      expect(over).toBeTruthy();
      over[1]();
      expect(showTooltip).toHaveBeenCalledWith(
        label,
        icon.x,
        CONSTS.BTN_CY - icon.displayHeight / 2,
      );

      const out = icon.on.mock.calls.find(
        (call: unknown[]) => call[0] === "pointerout",
      );
      expect(out).toBeTruthy();
      out[1]();
      expect(hideTooltip).toHaveBeenCalled();
    }
  });

  it("wires RETREAT click handler via pointerup and enables hand cursor interactivity", () => {
    const scene = new Scene("test");
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();
    const onRetreat = vi.fn();

    const { iconRetreat } = createBattleActionBar({
      scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      showTooltip,
      hideTooltip,
      onRetreat,
    });

    expect((iconRetreat as any).setInteractive).toHaveBeenCalledWith({
      useHandCursor: true,
    });

    const pointerDown = (iconRetreat as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerdown",
    );
    expect(pointerDown).toBeTruthy();

    const pointerUp = (iconRetreat as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerup",
    );
    expect(pointerUp).toBeTruthy();
    pointerUp![1]();
    expect(onRetreat).toHaveBeenCalledOnce();
  });
});

describe("makeInteractive", () => {
  it("enables interactivity with hand cursor", () => {
    const scene = new Scene("test");
    const icon = scene.add.image(0, 0, "icon_cast");

    makeInteractive(icon as any);

    expect(icon.setInteractive).toHaveBeenCalledWith({ useHandCursor: true });
  });
});

describe("activateTooltip", () => {
  it("wires pointerover/pointerout with label and anchor math", () => {
    const scene = new Scene("test");
    const icon = scene.add.image(100, 200, "icon_cast") as any;
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();

    activateTooltip(scene, icon, "MAGIC", showTooltip, hideTooltip);

    const over = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    expect(over).toBeTruthy();
    over![1]();
    expect(showTooltip).toHaveBeenCalledWith(
      "MAGIC",
      100,
      200 - icon.displayHeight / 2,
    );

    const out = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerout",
    );
    expect(out).toBeTruthy();
    out![1]();
    expect(hideTooltip).toHaveBeenCalled();
  });

  it("triggers scale tween on pointerover and revert on pointerout", () => {
    const scene = new Scene("test") as any;
    const tweensAdd = vi.fn();
    scene.tweens = { add: tweensAdd };
    const icon = scene.add.image(100, 200, "icon_cast") as any;
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();

    activateTooltip(scene, icon, "MAGIC", showTooltip, hideTooltip);

    const over = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    over![1]();
    expect(tweensAdd).toHaveBeenCalledWith({
      targets: icon,
      scale: CONSTS.ACTION_ICON_MOUSEOVER_SCALE,
      duration: 100,
      ease: "Power2",
    });

    const out = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerout",
    );
    out![1]();
    expect(tweensAdd).toHaveBeenCalledWith({
      targets: icon,
      scale: CONSTS.ACTION_ICON_DEFAULT_SCALE,
      duration: 100,
      ease: "Power2",
    });
  });

  it("does not call tweens when scene.tweens is undefined", () => {
    const scene = new Scene("test");
    const icon = scene.add.image(100, 200, "icon_cast") as any;
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();

    activateTooltip(scene, icon, "MAGIC", showTooltip, hideTooltip);

    const over = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    expect(() => over![1]()).not.toThrow();

    const out = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerout",
    );
    expect(() => out![1]()).not.toThrow();
  });
});

describe("bindPressEffect", () => {
  it("scales down and raises depth on pointerdown, restores on pointerup", () => {
    const scene = new Scene("test") as any;
    const tweensAdd = vi.fn();
    scene.tweens = { add: tweensAdd };
    const icon = scene.add.image(100, 200, "icon_cast") as any;
    const onPress = vi.fn();

    bindPressEffect(scene, icon, onPress);

    const down = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerdown",
    );
    expect(down).toBeTruthy();
    down![1]();
    expect(icon.setDepth).toHaveBeenCalledWith(CONSTS.ACTION_ICON_PRESS_DEPTH);
    expect(tweensAdd).toHaveBeenCalledWith({
      targets: icon,
      scale: CONSTS.ACTION_ICON_PRESS_SCALE,
      duration: CONSTS.ACTION_ICON_PRESS_TWEEN,
      ease: "Power1",
    });

    const up = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerup",
    );
    expect(up).toBeTruthy();
    up![1]();
    expect(onPress).toHaveBeenCalledOnce();
    expect(tweensAdd).toHaveBeenCalledWith({
      targets: icon,
      scale: CONSTS.ACTION_ICON_MOUSEOVER_SCALE,
      depth: CONSTS.ACTION_ICON_DEPTH,
      duration: CONSTS.ACTION_ICON_PRESS_TWEEN,
      ease: "Power1",
    });
  });

  it("always wires press effects even without onPress callback", () => {
    const scene = new Scene("test") as any;
    const tweensAdd = vi.fn();
    scene.tweens = { add: tweensAdd };
    const icon = scene.add.image(100, 200, "icon_cast") as any;

    bindPressEffect(scene, icon);

    // Press effects are wired regardless of whether onPress is provided.
    const down = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerdown",
    );
    expect(down).toBeTruthy();
    down![1]();
    expect(icon.setDepth).toHaveBeenCalledWith(CONSTS.ACTION_ICON_PRESS_DEPTH);
    expect(tweensAdd).toHaveBeenCalled();
  });

  it("fires onPress on pointerup even without tweens system", () => {
    const scene = new Scene("test");
    const icon = scene.add.image(100, 200, "icon_cast") as any;
    const onPress = vi.fn();

    bindPressEffect(scene, icon, onPress);

    const down = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerdown",
    );
    expect(() => down![1]()).not.toThrow();

    const up = icon.on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerup",
    );
    up![1]();
    expect(onPress).toHaveBeenCalledOnce();
  });
});
