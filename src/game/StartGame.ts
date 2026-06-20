import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Game as MainGame } from "./scenes/Game";
import { MainMenu } from "./scenes/MainMenu";
import * as Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";
import { BG_COLOR } from "../constants";

/** Resolution multiplier for crisp text on high-DPI displays. */
export const TEXT_RESOLUTION = Math.ceil(globalThis.devicePixelRatio ?? 1);

/**
 * Core Phaser game configuration. Registers all scenes and configures resolution scaling.
 */
const config: Phaser.Types.Core.GameConfig & { resolution: number } = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
  },
  parent: "game-container",
  backgroundColor: BG_COLOR,
  dom: {
    createContainer: true,
  },
  resolution: TEXT_RESOLUTION,
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
