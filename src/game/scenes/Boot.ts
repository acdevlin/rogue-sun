import { Scene } from "phaser";

/**
 * Boot scene — loads minimal assets needed by the Preloader.
 * Keeps payload small since this scene has no loading bar of its own.
 */
export class Boot extends Scene {
  /**
   * Default constructor.
   */
  constructor() {
    super("Boot");
  }

  /**
   * Loads the background image needed by the Preloader scene.
   */
  preload() {
    this.load.image("background", "assets/bg.png");
  }

  /**
   * Transitions to the Preloader scene once the background is loaded.
   */
  create() {
    this.scene.start("Preloader");
  }
}
