/**
 * Represents a single combatant in the timeline-based turn system.
 * Tracks progress toward readiness based on speed and elapsed time.
 */
export class ActionActor {
  /** Display name. */
  name: string;
  /** Speed value used to calculate progress accumulation per second. */
  speed: number;
  /** Current progress toward "readiness" (from 0 to readyThreshold). */
  progress = 0;
  /** Progress value at which the actor becomes ready to act. */
  readonly readyThreshold = 100;
  /** Whether this actor belongs to the player's party. */
  isPlayer: boolean;

  /**
   * Default constructor.
   *
   * @param name Display name for the actor.
   * @param speed Base speed for progress accumulation.
   * @param isPlayer Whether this actor belongs to the player's party.
   */
  constructor(name: string, speed: number, isPlayer: boolean) {
    this.name = name;
    this.speed = speed;
    this.isPlayer = isPlayer;
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
