import { ActionActor } from "../systems/ActionActor";
import { ActorPosition, ActorController } from "../../constants";

export type ActorParams = {
  controller: ActorController;
  name: string;
  speed: number;
  health: number;
  stamina: number;
  energy: number;
  position: ActorPosition;
};

export const makeActor = (overrides?: Partial<ActorParams>): ActionActor =>
  new ActionActor({
    controller: ActorController.PLAYER,
    name: "Hero",
    speed: 30,
    health: 100,
    stamina: 100,
    energy: 100,
    position: ActorPosition.FRONTLINE,
    ...overrides,
  });
