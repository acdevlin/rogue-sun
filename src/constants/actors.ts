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

/** Positional values for actors. */
export const ActorPosition = {
  FRONTLINE: "FRONTLINE",
  BACKLINE: "BACKLINE",
  MIDLINE: "MIDLINE",
  FLANK: "FLANK",
};

export type ActorPosition = (typeof ActorPosition)[keyof typeof ActorPosition];

export const ActorController = {
  PLAYER: "PLAYER",
  ENEMY: "ENEMY",
};

export type ActorController =
  (typeof ActorController)[keyof typeof ActorController];

/** Progress threshold at which an actor becomes ready to act. */
export const READY_THRESHOLD = 100;
