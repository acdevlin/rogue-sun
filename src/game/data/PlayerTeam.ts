import type { TeamMember } from "./TeamMember";

export interface PlayerTeam {
  id: string;
  name: string;
  createdAt: number;
  lastModified: number;
  members: TeamMember[];
}
