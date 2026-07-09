import { ActorPosition } from "../../constants";

export interface PlayerActorData {
  name: string;
  alias?: string;
  speed: number;
  health: number;
  stamina: number;
  energy: number;
  position: ActorPosition;
  description: string;
}
