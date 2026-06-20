/** Reference width used for responsive scaling calculations. */
export const GAME_WIDTH_SCALE = 1200;
/** Reference height used for responsive scaling calculations. */
export const GAME_HEIGHT_SCALE = 800;

/** Background color for the Phaser game canvas. */
export const BG_COLOR = "#028af8";

/** Outer progress bar width in the Preloader scene. */
export const PRELOADER_BAR_W = 468;
/** Outer progress bar height in the Preloader scene. */
export const PRELOADER_BAR_H = 32;
/** Stroke width of the outer progress bar. */
export const PRELOADER_BAR_STROKE = 1;
/** X-offset from centerX for the filler bar start position. */
export const PRELOADER_FILLER_X = 230;
/** Minimum/initial filler bar width. */
export const PRELOADER_FILLER_W = 4;
/** Filler bar height. */
export const PRELOADER_FILLER_H = 28;
/** Maximum filler growth (added to base width per unit progress). */
export const PRELOADER_FILLER_MAX = 460;
/** Color of the progress bar elements. */
export const PRELOADER_BAR_COLOR = 0xffffff;

/** Logo image Y-offset from vertical center on the main menu. */
export const LOGO_Y = 84;
/** Title text Y-offset from vertical center on the main menu. */
export const TITLE_Y = 76;
/** Title font size on the main menu. */
export const MENU_FONT_SIZE = 38;
/** Title stroke thickness on the main menu. */
export const MENU_STROKE = 8;
/** Title text color on the main menu. */
export const MENU_TEXT_COLOR = "#ffffff";
/** Title stroke color on the main menu. */
export const MENU_STROKE_COLOR = "#000000";

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
export const CARD_W = 200;
/** Height of each actor's progress bar. */
export const CARD_H = 20;
/** Vertical gap between actor cards. */
export const CARD_GAP = 56;
/** Y-position of the first actor card. */
export const CARD_START_Y = 80;
/** X-position offset for player cards from the left edge, and right margin for enemy cards. */
export const PLAYER_X = 40;
/** Extra width added to the card rectangle beyond the progress bar width. */
export const CARD_EXTRA_W = 14;
/** Height of the card rectangle surrounding each progress bar. */
export const CARD_HEIGHT = 46;
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
export const LABEL_Y = 18;
/** X-offset of the percentage text from the right edge of the progress bar. */
export const PCT_X = 2;

/** Fill color for player progress bars. */
export const PLAYER_FILL = 0x00aa00;
/** Fill color for enemy progress bars. */
export const ENEMY_FILL = 0xaa0000;
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

/** Delay in milliseconds before an actor's action completes. */
export const TURN_DELAY = 500;

/** Conversion factor from milliseconds to seconds. */
export const MS_TO_S = 1000;

/** Speed value for the Fighter player unit. */
export const SPD_FIGHTER = 30;
/** Speed value for the Mage player unit. */
export const SPD_MAGE = 22;
/** Speed value for the Thief player unit. */
export const SPD_THIEF = 35;
/** Speed value for the Slacker player unit. */
export const SPD_SLACKER = 6;
/** Speed value for the Goblin enemy unit. */
export const SPD_GOBLIN = 28;
/** Speed value for the Orc enemy unit. */
export const SPD_ORC = 12;
/** Speed value for the Skeleton enemy unit. */
export const SPD_SKELETON = 20;
/** Speed value for the Dragon enemy unit. */
export const SPD_DRAGON = 8;
/** Speed value for the Bat enemy unit. */
export const SPD_BAT = 40;
/** Speed value for the Slime enemy unit. */
export const SPD_SLIME = 15;
/** Speed value for each Twin enemy unit (both use the same speed). */
export const SPD_TWIN = 25;

/** Background color for the GameOver scene camera. */
export const GAMEOVER_BG = 0xff0000;
/** Alpha value for the background image in the GameOver scene. */
export const GAMEOVER_ALPHA = 0.5;
/** Font size for the "Game Over" title text. */
export const GAMEOVER_FONT_SIZE = 64;
/** Stroke thickness for the "Game Over" title text. */
export const GAMEOVER_STROKE = 8;
/** Text color for the "Game Over" title. */
export const GAMEOVER_TEXT_COLOR = "#ffffff";
/** Stroke color for the "Game Over" title. */
export const GAMEOVER_STROKE_COLOR = "#000000";

/** Progress threshold at which an actor becomes ready to act. */
export const READY_THRESHOLD = 100;
