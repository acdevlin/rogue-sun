import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlayerTeamService } from "../PlayerTeamService";
import type { PlayerTeam } from "../../data/PlayerTeam";

const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  length: 0,
  key: vi.fn(() => ""),
};

const sampleTeam: PlayerTeam = {
  id: "test-id-123",
  name: "Test Team",
  createdAt: 1234567890,
  lastModified: 1234567890,
  members: [
    { actorClassId: "Fighter", position: "FRONTLINE" },
    { actorClassId: "Mage", position: "BACKLINE" },
  ],
};

const teams: PlayerTeam[] = [sampleTeam];

describe("PlayerTeamService", () => {
  let service: PlayerTeamService;

  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage);
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    service = new PlayerTeamService();
  });

  describe("readAll", () => {
    it("returns empty array when localStorage is empty", async () => {
      const result = await service.readAll();
      expect(result).toEqual([]);
    });

    it("parses and returns team data from localStorage", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.readAll();
      expect(result).toEqual(teams);
    });

    it("returns empty array when JSON parsing fails", async () => {
      mockStorage["rogue_sun_player_teams"] = "invalid json";
      const result = await service.readAll();
      expect(result).toEqual([]);
    });
  });

  describe("create", () => {
    it("creates new team with generated ID and timestamps", async () => {
      const newTeamData = { name: "New Team", members: sampleTeam.members };
      const result = await service.create(newTeamData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Team");
      expect(typeof result.createdAt).toBe("number");
      expect(typeof result.lastModified).toBe("number");
      expect(result.members).toEqual(sampleTeam.members);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData).toHaveLength(1);
    });
  });

  describe("read", () => {
    it("returns team when ID matches", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.read(sampleTeam.id);
      expect(result).toEqual(sampleTeam);
    });

    it("returns null when ID does not match", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.read("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("updates team when ID exists", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const updates: Partial<PlayerTeam> = { name: "Updated Name" };
      const result = await service.update(sampleTeam.id, updates);

      expect(result).toBe(true);
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData[0].name).toBe("Updated Name");
      expect(storedData[0].lastModified).toBeGreaterThan(
        sampleTeam.lastModified,
      );
    });

    it("returns false when ID does not exist", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.update("non-existent-id", {
        name: "Updated",
      });
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes team when ID exists", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.delete(sampleTeam.id);

      expect(result).toBe(true);
      const storedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(storedData).toHaveLength(0);
    });

    it("returns false when ID does not exist", async () => {
      mockStorage["rogue_sun_player_teams"] = JSON.stringify(teams);
      const result = await service.delete("non-existent-id");
      expect(result).toBe(false);
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("validateTeam", () => {
    it("validates valid team", () => {
      const result = service.validateTeam(sampleTeam);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("rejects team with short name", () => {
      const invalidTeam = { ...sampleTeam, name: "x" };
      const result = service.validateTeam(invalidTeam);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Team name must be at least 2 characters",
      );
    });

    it("rejects team with no members", () => {
      const invalidTeam = { ...sampleTeam, members: [] };
      const result = service.validateTeam(invalidTeam);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Team must have at least one member");
    });

    it("rejects team with duplicate class IDs", () => {
      const invalidTeam = {
        ...sampleTeam,
        members: [
          { actorClassId: "Fighter", position: "FRONTLINE" },
          { actorClassId: "Fighter", position: "FRONTLINE" },
        ],
      };
      const result = service.validateTeam(invalidTeam);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Duplicate class IDs");
    });

    it("rejects team with invalid class IDs", () => {
      const invalidTeam = {
        ...sampleTeam,
        members: [
          { actorClassId: "Fighter", position: "FRONTLINE" },
          { actorClassId: "InvalidClass", position: "MIDLINE" },
        ],
      };
      const result = service.validateTeam(invalidTeam);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toBe("Invalid class ID: InvalidClass");
    });

    it("rejects duplicate name when existingTeams is provided", () => {
      const existing = [{ ...sampleTeam, id: "other", name: "Existing Squad" }];
      const result = service.validateTeam(
        { name: "Existing Squad", members: sampleTeam.members },
        existing,
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "A team with name 'Existing Squad' already exists.",
      );
    });

    it("allows same name when id matches (same team being updated)", () => {
      const existing = [{ ...sampleTeam, name: "My Team" }];
      const result = service.validateTeam(
        { id: sampleTeam.id, name: "My Team", members: sampleTeam.members },
        existing,
      );
      expect(result.valid).toBe(true);
    });

    it("passes when name is unique among existing teams", () => {
      const existing = [{ ...sampleTeam, id: "other", name: "Other Team" }];
      const result = service.validateTeam(
        { name: "New Name", members: sampleTeam.members },
        existing,
      );
      expect(result.valid).toBe(true);
    });
  });
});
