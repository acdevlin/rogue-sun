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

/** Width of each actor's progress bar. */
export const CARD_W = 180;
/** Height of each actor's progress bar. */
export const CARD_H = 12;
/** Vertical gap between actor cards. */
export const CARD_GAP = 94;
/** Y-position of the first actor card. */
export const CARD_START_Y = 80;
/** X-position offset for player cards from the left edge, and right margin for enemy cards. */
export const PLAYER_X = 40;
/** Extra width added to the card rectangle beyond the progress bar width. */
export const CARD_EXTRA_W = 14;
/** Height of the card rectangle surrounding each progress bar. */
export const CARD_HEIGHT = 92;
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
/** Initial color of the actor name label. */
export const LABEL_COLOR = "#ccc";
/** Color of the percentage progress text. */
export const PCT_COLOR = "#fff";

/** X-offset for stat text from the card left edge. */
export const STAT_TXT_X = 2;
/** Y-offset from the y-param to the health text. */
export const STAT_HP_Y = -14;
/** Y-offset from the y-param to the stamina text. */
export const STAT_SP_Y = 18;
/** Y-offset from the y-param to the energy text. */
export const STAT_EP_Y = 34;
