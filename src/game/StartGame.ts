import { Boot } from "./scenes/Boot";
import { GameOver } from "./scenes/GameOver";
import { Battle } from "./scenes/Battle";
import { PartyCreation } from "./scenes/PartyCreation";
import { MainMenu } from "./scenes/MainMenu";
import * as Phaser from "phaser";
import { Preloader } from "./scenes/Preloader";
import {
  BG_COLOR,
  GAME_WIDTH_SCALE,
  GAME_HEIGHT_SCALE,
  TEXT_RESOLUTION,
} from "../constants";

/**
 * Core Phaser game configuration. Registers all scenes and configures resolution scaling.
 */
const config: Phaser.Types.Core.GameConfig & { resolution: number } = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.Center.CENTER_BOTH,
    width: GAME_WIDTH_SCALE,
    height: GAME_HEIGHT_SCALE,
  },
  parent: "game-container",
  backgroundColor: BG_COLOR,
  dom: {
    createContainer: true,
  },
  resolution: TEXT_RESOLUTION,
  scene: [Boot, Preloader, MainMenu, Battle, GameOver, PartyCreation],
  callbacks: {
    postBoot: (game) => {
      try {
        // Force mobile browsers to landscape orientation.
        game.scale.lockOrientation("landscape");
      } catch {
        // Fallback to using a rotation prompt if lockOrientation is not supported.
        const element = document.body;
        const toggle = () =>
          element.classList.toggle(
            "force-landscape",
            window.innerHeight > window.innerWidth,
          );
        window.addEventListener("resize", toggle);
        toggle();
      }
    },
  },
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
