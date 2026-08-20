import { describe, it, expect, vi } from "vitest";
import { Scene } from "phaser";

import { createBattleActionBar } from "../ActionBar";
import * as CONSTS from "../../../constants";

describe("createBattleActionBar", () => {
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
