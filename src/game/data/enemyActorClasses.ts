import * as CONSTS from "../../constants";
import type { PlayerActorData } from "./PlayerActorData";

export const enemies: PlayerActorData[] = [
  {
    name: "Goblin",
    speed: CONSTS.SPD_GOBLIN,
    health: 60,
    stamina: 40,
    energy: 20,
    position: CONSTS.ActorPosition.FLANK,
    description:
      "A small, green-skinned creature known for its cunning and agility.",
  },
  {
    name: "Orc",
    speed: CONSTS.SPD_ORC,
    health: 100,
    stamina: 80,
    energy: 40,
    position: CONSTS.ActorPosition.BACKLINE,
    description:
      "A fierce, muscular warrior known for its strength and aggression.",
  },
  {
    name: "Skeleton",
    speed: CONSTS.SPD_SKELETON,
    health: 50,
    stamina: 30,
    energy: 30,
    position: CONSTS.ActorPosition.MIDLINE,
    description: "An undead creature, reanimated by dark magic.",
  },
  {
    name: "Dragon",
    speed: CONSTS.SPD_DRAGON,
    health: 200,
    stamina: 150,
    energy: 100,
    position: CONSTS.ActorPosition.FLANK,
    description:
      "A legendary creature, known for its thick scales and ability to breathe fire.",
  },
  {
    name: "Bat",
    speed: CONSTS.SPD_BAT,
    health: 30,
    stamina: 20,
    energy: 10,
    position: CONSTS.ActorPosition.FRONTLINE,
    description: "A small, flying creature that typically attacks in swarms.",
  },
  {
    name: "Slime",
    speed: CONSTS.SPD_SLIME,
    health: 80,
    stamina: 50,
    energy: 20,
    position: CONSTS.ActorPosition.BACKLINE,
    description:
      "A gelatinous creature that can split into smaller versions of itself.",
  },
  {
    name: "Twin 1",
    speed: CONSTS.SPD_TWIN,
    health: 70,
    stamina: 40,
    energy: 30,
    position: CONSTS.ActorPosition.MIDLINE,
    description: "One of a pair.",
  },
  {
    name: "Twin 2",
    speed: CONSTS.SPD_TWIN,
    health: 70,
    stamina: 40,
    energy: 30,
    position: CONSTS.ActorPosition.MIDLINE,
    description: "The other of a pair.",
  },
];
