import { Scene } from "phaser";

/**
 * Boot scene — loads minimal assets needed by the Preloader.
 * Keeps payload small since this scene has no loading bar of its own.
 */
export class Boot extends Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("background", "assets/bg.png");
  }

  create() {
    this.scene.start("Preloader");
  }
}
