import { generateId } from "../utils/TeamUtils";
import { players } from "../data/playerActorClasses";
import type { PlayerTeam } from "../data/PlayerTeam";

export class PlayerTeamService {
  private readonly STORAGE_KEY = "rogue_sun_player_teams";

  /**
   * Reads all saved teams from localStorage.
   *
   * @returns An array of PlayerTeam objects, or an empty array if none exist.
   */
  async readAll(): Promise<PlayerTeam[]> {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as PlayerTeam[];
    } catch {
      return [];
    }
  }

  /**
   * Creates a new team and persists it to localStorage.
   *
   * @param teamData - The team name and member list (id and timestamps are generated).
   * @param existingTeams - Optional pre-fetched team list to avoid a second readAll.
   * @returns The newly created PlayerTeam.
   */
  async create(
    teamData: Omit<PlayerTeam, "id" | "createdAt" | "lastModified">,
    existingTeams?: PlayerTeam[],
  ): Promise<PlayerTeam> {
    const teams = existingTeams ?? (await this.readAll());
    const newTeam: PlayerTeam = {
      id: generateId(),
      name: teamData.name,
      createdAt: Date.now(),
      lastModified: Date.now(),
      members: teamData.members,
    };
    await this.writeAll([...teams, newTeam]);
    return newTeam;
  }

  /**
   * Reads a single team by its ID.
   *
   * @param teamId - The unique identifier of the team.
   * @returns The matching PlayerTeam, or null if not found.
   */
  async read(teamId: string): Promise<PlayerTeam | null> {
    const teams = await this.readAll();
    return teams.find((team) => team.id === teamId) || null;
  }

  /**
   * Partially updates a team's properties. Sets lastModified to the current time.
   *
   * @param teamId - The unique identifier of the team to update.
   * @param updates - Partial team fields to apply.
   * @returns True if the team was found and updated, false otherwise.
   */
  async update(teamId: string, updates: Partial<PlayerTeam>): Promise<boolean> {
    const teams = await this.readAll();
    const index = teams.findIndex((team) => team.id === teamId);
    if (index < 0) return false;

    teams[index] = {
      ...teams[index],
      ...updates,
      lastModified: Date.now(),
    };
    await this.writeAll(teams);
    return true;
  }

  /**
   * Deletes a team by its ID.
   *
   * @param teamId - The unique identifier of the team to delete.
   * @returns True if the team was found and removed, false otherwise.
   */
  async delete(teamId: string): Promise<boolean> {
    const teams = await this.readAll();
    const filtered = teams.filter((team) => team.id !== teamId);
    if (filtered.length === teams.length) return false;

    await this.writeAll(filtered);
    return true;
  }

  /**
   * Persists the full team array to localStorage.
   *
   * @param teams - The complete list of teams to write.
   */
  private async writeAll(teams: PlayerTeam[]): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(teams));
  }

  /**
   * Validates a team's name and members, returning any errors found.
   *
   * @param team - The partial team data to validate.
   * @param existingTeams - Optional array of existing teams for uniqueness check.
   * @returns An object with a `valid` boolean and an `errors` string array.
   */
  validateTeam(
    team: Partial<PlayerTeam>,
    existingTeams?: PlayerTeam[],
  ): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!team.name || team.name.trim().length < 2) {
      errors.push("Team name must be at least 2 characters");
    }

    const name = team.name?.trim();
    if (name && existingTeams) {
      const dup = existingTeams.find(
        (team) => team.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      );
      if (dup && dup.id !== team.id) {
        errors.push("A team with name '" + name + "' already exists.");
      }
    }

    if (!team.members || team.members.length === 0) {
      errors.push("Team must have at least one member");
    }

    if (team.members) {
      const classIds = team.members.map((member) => member.actorClassId);
      const duplicates = classIds.filter(
        (classId, idx) => classIds.indexOf(classId) !== idx,
      );
      if (duplicates.length > 0) {
        errors.push(
          `Duplicate class IDs: ${[...new Set(duplicates)].join(", ")}`,
        );
      }

      for (const member of team.members) {
        if (!players.find((cls) => cls.name === member.actorClassId)) {
          errors.push(`Invalid class ID: ${member.actorClassId}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
