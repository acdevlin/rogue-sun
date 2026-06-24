import {
  READY_THRESHOLD,
  ActorPosition,
  ActorController,
} from "../../constants";

/**
 * Represents a single combatant in the timeline-based turn system.
 * Tracks progress toward readiness based on speed and elapsed time.
 */
export class ActionActor {
  /** Display name (class name for players, e.g. "Fighter"). */
  name: string = "Actor";
  /** Personal alias for named characters (e.g. "John Doe"). */
  alias?: string;
  /** Speed value used to calculate progress accumulation per second. */
  speed: number = 10;
  health: number = 100;
  stamina: number = 100;
  energy: number = 100;
  /** Current progress toward "readiness" (from 0 to readyThreshold). */
  progress: number = 0;
  /** Progress value at which the actor becomes ready to act. */
  readonly readyThreshold: number = READY_THRESHOLD;
  /** Whether this actor belongs to the player's party. */
  controller: ActorController | null = null;
  /** The position of the actor in the combat formation. */
  position: ActorPosition | null = null;

  /**
   * Default constructor.
   *
   * @param name Display name (class name for players, e.g. "Fighter").
   * @param alias Personal alias for named characters (e.g. "John Doe").
   * @param speed Base speed for progress accumulation.
   * @param position The position of the actor in the combat formation.
   * @param isPlayer Whether this actor belongs to the player's party.
   */
  constructor(params: {
    controller: ActorController;
    name: string;
    alias?: string;
    speed: number;
    health: number;
    stamina: number;
    energy: number;
    position: ActorPosition;
  }) {
    this.controller = params.controller;
    this.name = params.name;
    this.alias = params.alias;
    this.speed = params.speed;
    this.health = params.health;
    this.stamina = params.stamina;
    this.energy = params.energy;
    this.position = params.position;
  }

  /**
   * Multiplies the actor's speed by the given factor.
   * Used for buffs, debuffs, and status effects.
   *
   * @param factor The multiplier to apply to speed.
   */
  modifySpeed(factor: number) {
    this.speed *= factor;
  }

  /**
   * Adds progress toward readiness, capped at readyThreshold.
   *
   * @param amount The amount of progress to add.
   */
  addProgress(amount: number) {
    this.progress = Math.min(this.progress + amount, this.readyThreshold);
  }

  /**
   * Sets progress to an absolute value, clamped between 0 and readyThreshold.
   *
   * @param amount The new progress value.
   */
  setProgress(amount: number) {
    this.progress = Math.max(0, Math.min(amount, this.readyThreshold));
  }

  /**
   * Checks whether the actor has accumulated enough progress to act.
   *
   * @returns True if progress is at or above the ready threshold.
   */
  isReady(): boolean {
    return this.progress >= this.readyThreshold;
  }

  /** Resets progress to 0 after an action is completed. */
  reset() {
    this.progress = 0;
  }
}
