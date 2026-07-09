import { describe, it, expect } from "vitest";
import * as CONSTS from "..";

describe("constants barrel exports", () => {
  it("exports all ui.ts constants", () => {
    expect(CONSTS.PROGRESS_BAR_W).toBe(180);
    expect(CONSTS.PROGRESS_BAR_H).toBe(12);
    expect(CONSTS.LANE_CARD_GAP).toBe(110);
    expect(CONSTS.LANE_FIRST_CARD_Y).toBe(132);
    expect(CONSTS.LANE_HEADER_Y).toBe(55);
    expect(CONSTS.ACTING_HEADER_Y).toBe(20);
    expect(CONSTS.ACTING_HEADER_FONT).toBe("30px");
    expect(CONSTS.ACTING_HEADER_STROKE).toBe(6);
    expect(CONSTS.ACTING_HEADER_BG).toBe(0xcccccc);
    expect(CONSTS.PARTY_CREATION_TITLE_Y).toBe(40);
    expect(CONSTS.HELP_BTN_X).toBe(120);
    expect(CONSTS.HELP_BTN_Y).toBe(160);
    expect(CONSTS.HELP_TEXT_W).toBe(400);
    expect(CONSTS.LANE_PICKER_W).toBe(180);
    expect(CONSTS.LANE_PICKER_H).toBe(200);
    expect(CONSTS.HELP_POPUP_W).toBe(500);
    expect(CONSTS.HELP_POPUP_H).toBe(380);
    expect(CONSTS.LOAD_POPUP_W).toBe(280);
    expect(CONSTS.LOAD_POPUP_H).toBe(250);
    expect(CONSTS.SAVE_POPUP_W).toBe(280);
    expect(CONSTS.SAVE_POPUP_H).toBe(200);
    expect(CONSTS.SAVED_TEAMS_ENTRY_SPACING).toBe(26);
    expect(CONSTS.SAVED_TEAMS_ENTRY_FONT_SIZE).toBe(14);
    expect(CONSTS.SAVED_TEAMS_MUTED_COLOR).toBe("#999999");
    expect(CONSTS.POOL_CARD_W).toBe(130);
    expect(CONSTS.CARD_HEIGHT).toBe(100);
    expect(CONSTS.CARD_EXTRA_W).toBe(14);
    expect(CONSTS.FILL_INSET).toBe(1);
    expect(CONSTS.CARD_BG).toBe(0x2a2a2a);
    expect(CONSTS.CARD_Y_OFFSET).toBe(1);
    expect(CONSTS.PROGRESS_FILL).toBe(0xcccccc);
    expect(CONSTS.CARD_DEPTH).toBe(-2);
    expect(CONSTS.BTN_BOTTOM_OFFSET).toBe(100);
    expect(CONSTS.BTN_PAD).toBe(20);
    expect(CONSTS.BTN_FILL).toBe(0x444444);
    expect(CONSTS.BTN_STROKE_W).toBe(2);
    expect(CONSTS.BTN_STROKE).toBe(0xffffff);
    expect(CONSTS.BTN_DEPTH).toBe(-1);
    expect(CONSTS.BTN_HOVER_FILL).toBe(0x666666);
    expect(CONSTS.BTN_HOVER_TEXT).toBe("#ffff00");
    expect(CONSTS.POPUP_DEPTH).toBe(10);
    expect(CONSTS.POPUP_BG).toBe(0x333333);
    expect(CONSTS.POPUP_STROKE).toBe(0x666666);
    expect(CONSTS.POPUP_STROKE_W).toBe(2);
  });

  it("exports all scenes.ts constants", () => {
    expect(CONSTS.TEAM_NAME_DEFAULT).toBe("Default");
    expect(CONSTS.TEAM_NAME_CURRENT).toBe("Current Party");
    expect(CONSTS.MIN_TEAM_NAME_LENGTH).toBe(2);
    expect(CONSTS.SAVE_TEAM_POPUP_TITLE).toBe("Save Team");
    expect(CONSTS.SAVE_TEAM_BTN_LABEL).toBe("Save");
    expect(CONSTS.SAVE_TEAM_INPUT_PLACEHOLDER).toBe("Team name...");
    expect(CONSTS.PARTYCREATION_BG).toBe(0x8866cc);
    expect(CONSTS.TITLE_FONT_SIZE).toBe(64);
    expect(CONSTS.TITLE_TEXT_COLOR).toBe("#ffffff");
    expect(CONSTS.TITLE_STROKE_COLOR).toBe("#000000");
    expect(CONSTS.GAMEOVER_BG).toBe(0xff0000);
    expect(CONSTS.MENU_FONT_SIZE).toBe(38);
    expect(CONSTS.MENU_STROKE).toBe(8);
    expect(CONSTS.MENU_TEXT_COLOR).toBe("#ffffff");
    expect(CONSTS.MENU_STROKE_COLOR).toBe("#000000");
    expect(CONSTS.PRELOADER_BAR_W).toBe(468);
    expect(CONSTS.PRELOADER_BAR_H).toBe(32);
    expect(CONSTS.LOGO_Y).toBe(84);
    expect(CONSTS.TITLE_Y).toBe(76);
  });

  it("exports all actors.ts constants", () => {
    expect(CONSTS.SPD_FIGHTER).toBe(30);
    expect(CONSTS.SPD_MAGE).toBe(22);
    expect(CONSTS.SPD_THIEF).toBe(35);
    expect(CONSTS.SPD_SLACKER).toBe(6);
    expect(CONSTS.SPD_GOBLIN).toBe(28);
    expect(CONSTS.SPD_ORC).toBe(12);
    expect(CONSTS.SPD_SKELETON).toBe(20);
    expect(CONSTS.SPD_DRAGON).toBe(8);
    expect(CONSTS.SPD_BAT).toBe(40);
    expect(CONSTS.SPD_SLIME).toBe(15);
    expect(CONSTS.SPD_TWIN).toBe(25);
    expect(CONSTS.PRIMARY_LANES).toEqual(["BACKLINE", "MIDLINE", "FRONTLINE"]);
    expect(CONSTS.READY_THRESHOLD).toBe(100);
  });

  it("exports all game.ts constants", () => {
    expect(CONSTS.GAME_WIDTH_SCALE).toBe(1400);
    expect(CONSTS.GAME_HEIGHT_SCALE).toBe(800);
    expect(CONSTS.BG_COLOR).toBe("#028af8");
    expect(CONSTS.TURN_DELAY).toBe(500);
    expect(CONSTS.MS_TO_S).toBe(1000);
  });

  it("exports all test.ts constants", () => {
    expect(CONSTS.SCENE_800_600_W).toBe(800);
    expect(CONSTS.SCENE_800_600_H).toBe(600);
    expect(CONSTS.SCENE_800_600_CX).toBe(400);
    expect(CONSTS.SCENE_800_600_CY).toBe(300);
    expect(CONSTS.BTN_CX).toBe(400);
    expect(CONSTS.BTN_CY).toBe(500);
    expect(CONSTS.BTN_TEST_SCALE).toBe(2);
    expect(CONSTS.TEXT_W).toBe(100);
    expect(CONSTS.TEXT_H).toBe(30);
  });
});
