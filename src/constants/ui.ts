/** Y-position of the "currently acting" header from the top of the screen. */
export const ACTING_HEADER_Y = 20;
/** Font size of the "currently acting" header text. */
export const ACTING_HEADER_FONT = "30px";
/** Stroke thickness of the "currently acting" header text. */
export const ACTING_HEADER_STROKE = 6;
/** Background color of the "currently acting" header. */
export const ACTING_HEADER_BG = 0xcccccc;
/** Horizontal padding for the acting header background. */
export const ACTING_HEADER_BG_PAD_X = 20;
/** Vertical padding for the acting header background. */
export const ACTING_HEADER_BG_PAD_Y = 10;
/** Y-position of the title text in the PartyCreation scene. */
export const PARTY_CREATION_TITLE_Y = 40;

/** Width of each actor's progress bar. */
export const PROGRESS_BAR_W = 180;
/** Height of each actor's progress bar. */
export const PROGRESS_BAR_H = 12;
/** Vertical gap between stacked cards in a lane. */
export const LANE_CARD_GAP = 110;
/** Y-position of the first card row in the lane grid. */
export const LANE_FIRST_CARD_Y = 132;
/** Y-position for the lane header labels (BACKLINE/MIDLINE/FRONTLINE). */
export const LANE_HEADER_Y = 55;
/** Font size for lane header text. */
export const LANE_HEADER_FONT = 18;
/** Color for lane header text. */
export const LANE_HEADER_COLOR = "#ffffff";
/** Horizontal offset between position lanes (BACKLINE/MIDLINE/FRONTLINE). */
export const LANE_OFFSET = 210;
/** Number of primary lanes (BACKLINE, MIDLINE, FRONTLINE). */
export const NUM_LANES = 3;
/** Width in pixels for lane guide lines. */
export const LANE_LINE_W = 1;
/** Color for lane guide lines. */
export const LANE_LINE_COLOR = 0x444444;
/** Y-offset from lane header bottom to the header separator line. */
export const LANE_HEADER_SEP_Y = 6;
/** Padding in pixels on each side of the FLANK label within the separator line. */
export const FLANK_LABEL_PAD = 12;
/** Fallback width for the FLANK label when rendering context is unavailable (e.g. in tests). */
export const FLANK_LABEL_FALLBACK_W = 56;
/** Vertical gap between the bottom of the last non-FLANK card and the first FLANK card. */
export const FLANK_OFFSET = 34;
/** Horizontal inset from the screen edge to the start of the lane grid on both player and enemy sides. */
export const LANE_INSET = 40;
/** Extra width added to the card rectangle beyond the progress bar width. */
export const CARD_EXTRA_W = 14;
/** Height of the card rectangle surrounding each progress bar. */
export const CARD_HEIGHT = 100;
/** Background color of the card rectangle. */
export const CARD_BG = 0x2a2a2a;
/** Stroke color of the card rectangle. */
export const CARD_STROKE = 0x444444;
/** Stroke width of the card rectangle. */
export const CARD_STROKE_W = 1;
/** Background color of the progress bar fill area. */
export const FILL_BG = 0x222222;
/** Inset of the progress fill from the bar edges (applied to all sides). */
export const FILL_INSET = 1;
/** Extra width and height added to the highlight rectangle beyond the progress bar. */
export const HIGHLIGHT_EXTRA = 6;
/** Stroke width of the highlight rectangle. */
export const HIGHLIGHT_STROKE_W = 2;
/** Color of the highlight rectangle (shown when actor is acting). */
export const HIGHLIGHT_COLOR = 0xffff00;
/** X-offset of the actor name label from the left edge of the card. */
export const LABEL_X = 4;
/** Y-offset of the actor name label above the top of the progress bar. */
export const LABEL_Y = 40;
/** Fill color for all progress bars (both player and enemy). */
export const PROGRESS_FILL = 0xcccccc;
/** Stroke color for the acting header when a player is acting. */
export const PLAYER_ACTING_STROKE = "#44ff44";
/** Stroke color for the acting header when an enemy is acting. */
export const ENEMY_ACTING_STROKE = "#ff4444";
/** Label text color when actor is acting or ready. */
export const LABEL_COLOR_ACTIVE = "#ffff00";
/** Label text color when actor is idle (neither acting nor ready). */
export const LABEL_COLOR_IDLE = "#cccccc";

/** Font size for actor name labels and percentage text (standardized from 13px and 12px). */
export const UI_FONT = 14;
/** Font family used for all UI text. */
export const UI_FONT_FAMILY = "Arial Black";

/** Color of the acting header text. */
export const ACTING_HEADER_TEXT_COLOR = "#ffffff";
/** Stroke color of the acting header text. */
export const ACTING_HEADER_STROKE_COLOR = "#000000";

/** Y-offset of the card center from the y-param. */
export const CARD_Y_OFFSET = 1;
/** Depth of the card rectangle. */
export const CARD_DEPTH = -2;
/** Depth of the highlight rectangle. */
export const HIGHLIGHT_DEPTH = -1;

/** Font size for stat text. */
export const STAT_FONT_SIZE = 12;
/** Color of the HP stat text. */
export const STAT_HP_COLOR = "#ff4444";
/** Color of the SP stat text. */
export const STAT_SP_COLOR = "#ffcc00";
/** Color of the EP stat text. */
export const STAT_EP_COLOR = "#66ccff";
/** Initial color of the actor name label. */
export const LABEL_COLOR = "#ccc";
/** X-offset for stat text from the card left edge. */
export const STAT_TXT_X = 2;
/** Y-offset from the y-param to the health text (below progress bar). */
export const STAT_HP_Y = 16;
/** Y-offset from the y-param to the stamina text. */
export const STAT_SP_Y = 26;
/** Y-offset from the y-param to the energy text. */
export const STAT_EP_Y = 36;

/** Width of each pool card in the PartyCreation scene. */
export const POOL_CARD_W = 130;
/** Horizontal gap between pool cards in the PartyCreation scene. */
export const POOL_CARD_GAP = 24;
/** Y-position of the pool card row in the PartyCreation scene. */
export const POOL_ROW_Y = 550;
/** Alpha value for placed (inactive) pool cards. */
export const POOL_DIM_ALPHA = 0.4;

/** Y-offset added to lane header and card start positions in PartyCreation. */
export const LANE_Y_OFFSET = 40;
/** Extra padding below the last lane card when detecting drop position. */
export const DROP_HIT_PADDING = 10;

/** Vertical offset from the bottom of the screen for UI buttons. */
export const BTN_BOTTOM_OFFSET = 100;
/** Padding between button text and its background rectangle. */
export const BTN_PAD = 20;
/** Fill color for button background. */
export const BTN_FILL = 0x444444;
/** Stroke width for button background. */
export const BTN_STROKE_W = 2;
/** Stroke color for button background. */
export const BTN_STROKE = 0xffffff;
/** Depth for button background rectangle. */
export const BTN_DEPTH = -1;
/** Fill color for button background on hover. */
export const BTN_HOVER_FILL = 0x666666;
/** Text color for button label on hover. */
export const BTN_HOVER_TEXT = "#ffff00";

/** Center X-position of the Help and Save Team buttons on the left side. */
export const HELP_BTN_X = 120;
/** Vertical gap between the Help button and the Save Team button below it. */
export const HELP_SAVE_GAP = 72;
/** Y-position of the Help button. */
export const HELP_BTN_Y = 160;
/** Scale factor for the compact left-side buttons in PartyCreation. */
export const COMPACT_BTN_SCALE = 0.75;
/** Word wrap width for the help popup body text. */
export const HELP_TEXT_W = 400;
/** Font size for the help popup text. */
export const HELP_FONT_SIZE = 14;
/** Extra vertical space between lines in the help popup text. */
export const HELP_LINE_SPACING = 4;
/** Color for the help popup text. */
export const HELP_COLOR = "#cccccc";

/** Width of the help popup. */
export const HELP_POPUP_W = 500;
/** Height of the help popup. */
export const HELP_POPUP_H = 380;
/** Y-offset from popup top to the title text. */
export const HELP_POPUP_TITLE_Y = 12;
/** X-offset from popup left edge to the body text. */
export const HELP_POPUP_TEXT_X = 20;
/** Y-offset from popup top to the body text. */
export const HELP_POPUP_TEXT_Y = 50;

/** Width of the lane picker popup. */
export const LANE_PICKER_W = 180;
/** Height of the lane picker popup. */
export const LANE_PICKER_H = 200;
/** Background color of the popup. */
export const POPUP_BG = 0x333333;
/** Stroke color of the popup border. */
export const POPUP_STROKE = 0x666666;
/** Stroke width of the popup border. */
export const POPUP_STROKE_W = 2;
/** Depth of the popup (above all other elements). */
export const POPUP_DEPTH = 10;
/** Font size for popup title text. */
export const POPUP_TITLE_FS = 16;
/** Font size for popup close button text. */
export const POPUP_CLOSE_FS = 18;
/** Inset from popup top-right corner for the close button. */
export const POPUP_CLOSE_INSET = 5;
/** Font size for popup lane option text. */
export const POPUP_OPTION_FONT = 14;
/** Color for the popup close button. */
export const POPUP_CLOSE_COLOR = "#ff4444";
/** Y-offset from popup top to the first lane option text. */
export const POPUP_OPTION_Y = 45;
/** Vertical spacing between lane option entries. */
export const POPUP_OPTION_GAP = 35;
/** Y-offset from popup top to the title text. */
export const POPUP_TITLE_Y = 10;

/** Fill color for the popup dimming overlay. */
export const POPUP_OVERLAY_COLOR = 0x000000;
/** Alpha for the popup dimming overlay. */
export const POPUP_OVERLAY_ALPHA = 0.6;

/** Width of the load-team popup. */
export const LOAD_POPUP_W = 280;
/** Height of the load-team popup. */
export const LOAD_POPUP_H = 250;
/** X-offset from popup left edge to team entry text. */
export const LOAD_POPUP_TEXT_X = 16;
/** Y-offset from popup top to the first team entry text. */
export const LOAD_POPUP_TEXT_Y = 48;
/** Vertical spacing between saved team entries in the load popup. */
export const SAVED_TEAMS_ENTRY_SPACING = 26;
/** Font size for saved team entry text. */
export const SAVED_TEAMS_ENTRY_FONT_SIZE = 14;
/** Text color for muted/no-teams state in the load popup. */
export const SAVED_TEAMS_MUTED_COLOR = "#999999";

/** Width of the save-team popup. */
export const SAVE_POPUP_W = 280;
/** Height of the save-team popup. */
export const SAVE_POPUP_H = 200;
/** Y-offset from popup top to the text input element. */
export const SAVE_POPUP_INPUT_Y = 60;
/** Y-offset from popup top to the Save button. */
export const SAVE_POPUP_BTN_Y = 120;
/** Y-offset from popup top to the validation error text. */
export const SAVE_POPUP_ERR_Y = 160;
/** Font size for the save popup validation error text. */
export const SAVE_POPUP_ERR_FS = 12;
/** Horizontal padding for the save button background beyond its label width. */
export const SAVE_POPUP_BTN_PAD_X = 20;
/** Vertical padding for the save button background beyond its label height. */
export const SAVE_POPUP_BTN_PAD_Y = 10;
/** Stroke thickness for the save button label. */
export const SAVE_POPUP_BTN_STROKE_W = 2;
