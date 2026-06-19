export class ActionActor {
  name: string;
  speed: number;
  progress = 0;
  readonly readyThreshold = 100;
  isPlayer: boolean;

  constructor(name: string, speed: number, isPlayer: boolean) {
    this.name = name;
    this.speed = speed;
    this.isPlayer = isPlayer;
  }

  modifySpeed(factor: number) {
    this.speed *= factor;
  }

  addProgress(amount: number) {
    this.progress = Math.min(this.progress + amount, this.readyThreshold);
  }

  setProgress(amount: number) {
    this.progress = Math.max(0, Math.min(amount, this.readyThreshold));
  }

  isReady(): boolean {
    return this.progress >= this.readyThreshold;
  }

  reset() {
    this.progress = 0;
  }
}
