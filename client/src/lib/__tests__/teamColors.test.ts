import { describe, it, expect } from "vitest";
import { TEAM_COLORS } from "@/lib/teamColors";

describe("TEAM_COLORS", () => {
  it("has all 10 KBO teams", () => {
    expect(Object.keys(TEAM_COLORS)).toHaveLength(10);
  });

  it("each team has required fields", () => {
    for (const [id, team] of Object.entries(TEAM_COLORS)) {
      expect(team).toBeDefined();
      expect(typeof team.name).toBe("string");
      expect(team.name.length).toBeGreaterThan(0);
      expect(typeof team.shortName).toBe("string");
      expect(team.shortName.length).toBeGreaterThan(0);
      expect(typeof team.primary).toBe("string");
      expect(team.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof team.secondary).toBe("string");
      expect(team.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(typeof team.tertiary).toBe("string");
      expect(team.tertiary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("includes doosan", () => {
    expect(TEAM_COLORS["doosan"]).toBeDefined();
    expect(TEAM_COLORS["doosan"].name).toContain("두산");
  });

  it("includes lg", () => {
    expect(TEAM_COLORS["lg"]).toBeDefined();
    expect(TEAM_COLORS["lg"].name).toContain("LG");
  });
});
