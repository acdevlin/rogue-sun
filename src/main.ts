import StartGame from "./game/StartGame";

/**
 * Entry point for the game.
 * Bootstraps the Phaser game instance once the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
  StartGame("game-container");
});
