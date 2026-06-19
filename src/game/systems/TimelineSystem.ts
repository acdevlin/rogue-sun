import { ActionActor } from "./ActionActor";

/**
 * Manages the turn-order timeline.
 * Tracks all actors and their readiness, advancing progress each update
 * and maintaining a first-ready-first-out queue of actors waiting to act.
 */
export class TimelineSystem {
  /** All registered actors. */
  actors: ActionActor[] = [];
  /** Actors who have reached the ready threshold, ordered by when they became ready. */
  readyQueue: ActionActor[] = [];

  /**
   * Registers an actor into the timeline.
   *
   * @param a The actor to register.
   */
  addActor(a: ActionActor) {
    this.actors.push(a);
  }

  /**
   * Removes an actor from both the actors list and the ready queue.
   * Safe to call on actors that are not yet in the ready queue.
   *
   * @param a The actor to remove.
   */
  removeActor(a: ActionActor) {
    this.actors = this.actors.filter((x) => x !== a);
    this.readyQueue = this.readyQueue.filter((x) => x !== a);
  }

  /**
   * Advances progress for all actors by dt seconds.
   * Skips actors already at the ready threshold.
   * Any actor crossing the threshold is added to the ready queue.
   * Does nothing if the ready queue already has entries.
   *
   * @param dt Delta time in seconds to advance progress by.
   */
  update(dt: number) {
    if (this.readyQueue.length > 0) return;
    for (const a of this.actors) {
      if (a.isReady()) continue;
      a.progress += a.speed * dt;
      if (a.progress >= a.readyThreshold) {
        a.progress = a.readyThreshold;
        this.readyQueue.push(a);
      }
    }
  }

  /**
   * Pops the next ready actor from the queue.
   *
   * @returns The next ready actor, or null if the queue is empty.
   */
  step(): ActionActor | null {
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue.shift()!;
  }
}
