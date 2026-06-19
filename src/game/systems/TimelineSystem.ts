import { ActionActor } from "./ActionActor";

export class TimelineSystem {
  actors: ActionActor[] = [];
  readyQueue: ActionActor[] = [];

  addActor(a: ActionActor) {
    this.actors.push(a);
  }

  removeActor(a: ActionActor) {
    this.actors = this.actors.filter((x) => x !== a);
    this.readyQueue = this.readyQueue.filter((x) => x !== a);
  }

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

  step(): ActionActor | null {
    if (this.readyQueue.length === 0) return null;
    return this.readyQueue.shift()!;
  }
}
