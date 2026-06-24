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
  },
  {
    name: "Mage",
    alias: "Jane Doe",
    speed: CONSTS.SPD_MAGE,
    health: 80,
    stamina: 60,
    energy: 120,
    position: CONSTS.ActorPosition.BACKLINE,
  },
  {
    name: "Thief",
    alias: "Frank",
    speed: CONSTS.SPD_THIEF,
    health: 90,
    stamina: 120,
    energy: 60,
    position: CONSTS.ActorPosition.FLANK,
  },
  {
    name: "Slacker",
    alias: "Gertrude",
    speed: CONSTS.SPD_SLACKER,
    health: 150,
    stamina: 50,
    energy: 50,
    position: CONSTS.ActorPosition.MIDLINE,
  },
  {
    name: "Summoner",
    alias: "Isaac",
    speed: CONSTS.SPD_MAGE,
    health: 70,
    stamina: 100,
    energy: 150,
    position: CONSTS.ActorPosition.BACKLINE,
  },
];
