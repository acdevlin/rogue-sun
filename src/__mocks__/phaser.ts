import { vi } from "vitest";

const mockObj = () => ({
  setOrigin: vi.fn().mockReturnThis(),
  setStrokeStyle: vi.fn().mockReturnThis(),
  setDepth: vi.fn().mockReturnThis(),
  setInteractive: vi.fn().mockReturnThis(),
  setFillStyle: vi.fn().mockReturnThis(),
  setColor: vi.fn().mockReturnThis(),
  setVisible: vi.fn().mockReturnThis(),
  destroy: vi.fn().mockReturnThis(),
  setText: vi.fn().mockReturnThis(),
  setSize: vi.fn().mockReturnThis(),
  setStroke: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  width: 0,
  height: 0,
});

class Scene {
  key: string;
  scene = { start: vi.fn() };
  cameras = {
    main: {
      centerX: 400,
      centerY: 300,
      width: 800,
      height: 600,
      setBackgroundColor: vi.fn(),
    },
  };
  add = {
    text: vi.fn(() => mockObj()),
    rectangle: vi.fn(() => mockObj()),
  };
  load = { image: vi.fn() };
  time = { delayedCall: vi.fn() };
  input = { once: vi.fn() };

  constructor(key: string) {
    this.key = key;
  }
}

class Game {
  constructor(_cfg?: unknown) {
    void _cfg;
  }
  scale = { lockOrientation: vi.fn() };
}

const GameObjects = { Text: class {}, Rectangle: class {} };
const Cameras = { Scene2D: { Camera: class {} } };
const Scale = { FIT: 0, Center: { CENTER_BOTH: 0 } };
const AUTO = 0;
const Types = {};

export { Scene, GameObjects, Cameras, Game, Scale, AUTO, Types };
export default { Scene, GameObjects, Cameras, Game, Scale, AUTO, Types };
