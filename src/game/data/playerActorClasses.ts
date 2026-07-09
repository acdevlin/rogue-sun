import * as CONSTS from "../../constants";
import { PlayerActorData } from "./PlayerActorData";

export const players: PlayerActorData[] = [
  {
    name: "Fighter",
    alias: "John Doe",
    speed: CONSTS.SPD_FIGHTER,
    health: 120,
    stamina: 80,
    energy: 50,
    position: CONSTS.ActorPosition.FRONTLINE,
    description: "A strong and resilient warrior, excelling in close combat.",
  },
  {
    name: "Mage",
    alias: "Jane Doe",
    speed: CONSTS.SPD_MAGE,
    health: 80,
    stamina: 60,
    energy: 120,
    position: CONSTS.ActorPosition.BACKLINE,
    description:
      "A master of arcane arts, capable of casting powerful spells from a distance.",
  },
  {
    name: "Thief",
    alias: "Frank",
    speed: CONSTS.SPD_THIEF,
    health: 90,
    stamina: 120,
    energy: 60,
    position: CONSTS.ActorPosition.FLANK,
    description:
      "A nimble and cunning character, skilled in fast sneaky attacks.",
  },
  {
    name: "Slacker",
    alias: "Gertrude",
    speed: CONSTS.SPD_SLACKER,
    health: 150,
    stamina: 50,
    energy: 50,
    position: CONSTS.ActorPosition.MIDLINE,
    description:
      "A lazy character who possesses the power to...well honestly we're not sure what!",
  },
  {
    name: "Summoner",
    alias: "Isaac",
    speed: CONSTS.SPD_MAGE,
    health: 70,
    stamina: 100,
    energy: 150,
    position: CONSTS.ActorPosition.BACKLINE,
    description: "A conjurer of mystical creatures and powerful enchantments.",
  },
];
