import { describe, it, expect, vi } from "vitest";
import { Scene } from "phaser";

import {
  createBattleActionBar,
  makeInteractive,
  activateTooltip,
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

  it("wires tooltips for MAGIC/ATTACK/RETREAT with correct anchor math", () => {
    const scene = new Scene("test");
    const showTooltip = vi.fn();
    const hideTooltip = vi.fn();
    const onRetreat = vi.fn();

    const { iconCast, iconRetreat, iconAttack } = createBattleActionBar({
      scene,
      cx: CONSTS.BTN_CX,
      y: CONSTS.BTN_CY,
      showTooltip,
      hideTooltip,
      onRetreat,
    });

    const castOver = (iconCast as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    expect(castOver).toBeTruthy();
    castOver![1]();
    expect(showTooltip).toHaveBeenCalledWith(
      "MAGIC",
      CONSTS.BTN_CX,
      CONSTS.BTN_CY - iconCast.displayHeight / 2,
    );
    const castOut = (iconCast as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerout",
    );
    expect(castOut).toBeTruthy();
    castOut![1]();
    expect(hideTooltip).toHaveBeenCalled();

    const retreatOver = (iconRetreat as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    expect(retreatOver).toBeTruthy();
    retreatOver![1]();
    expect(showTooltip).toHaveBeenCalledWith(
      "RETREAT",
      iconRetreat.x,
      CONSTS.BTN_CY - iconRetreat.displayHeight / 2,
    );

    const attackOver = (iconAttack as any).on.mock.calls.find(
      (call: unknown[]) => call[0] === "pointerover",
    );
    expect(attackOver).toBeTruthy();
    attackOver![1]();
    expect(showTooltip).toHaveBeenCalledWith(
      "ATTACK",
      iconAttack.x,
      CONSTS.BTN_CY - iconAttack.displayHeight / 2,
    );
  });

  it("wires RETREAT click handler and enables hand cursor interactivity", () => {
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
    pointerDown![1]();
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
});
