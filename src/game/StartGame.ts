import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import * as Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";

/**
 * Core Phaser game configuration.
 * Uses auto-renderer, resize scale mode, and registers all scenes.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  parent: "game-container",
  backgroundColor: "#028af8",
  dom: {
    createContainer: true,
  },
  antialias: false,
  scene: [Boot, Preloader, MainMenu, MainGame, GameOver],
};

/**
 * Creates and returns a new Phaser game instance.
 *
 * @param parent The DOM element ID or HTMLElement to mount the game canvas into.
 * @returns A new Phaser.Game instance configured with the project's scenes and settings.
 */
const StartGame = (parent: string) => {
  return new Phaser.Game({ ...config, parent });
};

export default StartGame;
