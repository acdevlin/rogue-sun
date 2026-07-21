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
  setAlpha: vi.fn().mockReturnThis(),
  disableInteractive: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  width: 0,
  height: 0,
  x: 0,
  y: 0,
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
    dom: vi.fn(() => ({ ...mockObj(), node: { value: "" } })),
  };
  load = { image: vi.fn() };
  time = { delayedCall: vi.fn() };
  input: {
    once: ReturnType<typeof vi.fn>;
    setDraggable: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    emit: ReturnType<typeof vi.fn>;
  };
  listeners: Record<string, (...args: unknown[]) => void>;

  constructor(key: string) {
    this.key = key;
    this.listeners = {};
    this.input = {
      once: vi.fn(),
      setDraggable: vi.fn(),
      on: vi.fn(
        (
          event: string,
          handler: (...args: unknown[]) => void,
          ctx?: unknown,
        ) => {
          this.listeners[event] = ctx ? handler.bind(ctx) : handler;
        },
      ),
      emit: vi.fn((event: string, ...args: unknown[]) => {
        this.listeners[event]?.(...args);
      }),
    };
  }
}

class Game {
  constructor(_cfg?: unknown) {
    void _cfg;
  }
  scale = { lockOrientation: vi.fn() };
}

class GameObject {
  x = 0;
  y = 0;
  setAlpha(_v?: number) {
    return this;
  }
}
const GameObjects = {
  Text: class extends GameObject {},
  Rectangle: class extends GameObject {},
};
const Cameras = { Scene2D: { Camera: class {} } };
const Scale = { FIT: 0, Center: { CENTER_BOTH: 0 } };
const AUTO = 0;
const Types = {};

export { mockObj, Scene, GameObjects, Cameras, Game, Scale, AUTO, Types };
export default { Scene, GameObjects, Cameras, Game, Scale, AUTO, Types };
