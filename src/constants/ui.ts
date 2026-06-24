/** Y-position of the "currently acting" header from the top of the screen. */
export const HEADER_Y = 20;
/** Font size of the "currently acting" header text. */
export const HEADER_FONT = "30px";
/** Stroke thickness of the "currently acting" header text. */
export const HEADER_STROKE = 6;
/** Background color of the "currently acting" header. */
export const HEADER_BG = 0xcccccc;
/** Horizontal padding for the acting header background. */
export const HEADER_BG_PAD_X = 20;
/** Vertical padding for the acting header background. */
export const HEADER_BG_PAD_Y = 10;
export const HEADER_PARTYCREATION_Y = 40;

/** Width of each actor's progress bar. */
export const CARD_W = 180;
/** Height of each actor's progress bar. */
export const CARD_H = 12;
/** Vertical gap between actor cards. */
export const CARD_GAP = 110;
/** Y-position of the first actor card. */
export const CARD_START_Y = 132;
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
/** X-position offset for player cards from the left edge, and right margin for enemy cards. */
export const PLAYER_X = 40;
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
/** X-offset of the percentage text from the right edge of the progress bar. */
export const PCT_X = 2;

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
export const HEADER_TEXT_COLOR = "#ffffff";
/** Stroke color of the acting header text. */
export const HEADER_STROKE_COLOR = "#000000";

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
/** Color of the percentage progress text. */
export const PCT_COLOR = "#fff";

/** X-offset for stat text from the card left edge. */
export const STAT_TXT_X = 2;
/** Y-offset from the y-param to the health text (below progress bar). */
export const STAT_HP_Y = 16;
/** Y-offset from the y-param to the stamina text. */
export const STAT_SP_Y = 26;
/** Y-offset from the y-param to the energy text. */
export const STAT_EP_Y = 36;

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
