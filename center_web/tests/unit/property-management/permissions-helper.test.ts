import { describe, it, expect } from "vitest";
import {
  canEditPropertyForMember,
  canArchivePropertyForMember,
} from "@/features/property-management/lib/permissions-logic";
import type { TeamMember } from "@/features/team-management/types";

function makeMember(partial: Partial<TeamMember>): TeamMember {
  return {
    id: "member-1",
    organization_id: "org-1",
    name: "Test Member",
    email: "test@example.com",
    role: "assistant_pm",
    status: "active",
    permissions: partial.permissions as TeamMember["permissions"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as TeamMember;
}

describe("permissions-logic - canEditPropertyForMember", () => {
  it("returns true when user is not a team member (property manager)", () => {
    const result = canEditPropertyForMember(null, "prop-1");
    expect(result).toBe(true);
  });

  it("returns false when team member has no edit permission", () => {
    const member = makeMember({
      permissions: { properties: { canEdit: false } } as any,
    });

    const result = canEditPropertyForMember(member, "prop-1");
    expect(result).toBe(false);
  });

  it("returns true when canEdit and no specificProperties (full access)", () => {
    const member = makeMember({
      permissions: {
        properties: { canEdit: true, specificProperties: [] },
      } as any,
    });

    const result = canEditPropertyForMember(member, "any-id");
    expect(result).toBe(true);
  });

  it("returns true only for properties listed in specificProperties", () => {
    const member = makeMember({
      permissions: {
        properties: { canEdit: true, specificProperties: ["prop-1"] },
      } as any,
    });

    const canEdit1 = canEditPropertyForMember(member, "prop-1");
    const canEdit2 = canEditPropertyForMember(member, "prop-2");

    expect(canEdit1).toBe(true);
    expect(canEdit2).toBe(false);
  });
});

describe("permissions-logic - canArchivePropertyForMember", () => {
  it("returns true when user is not a team member (property manager)", () => {
    const result = canArchivePropertyForMember(null, "prop-1");
    expect(result).toBe(true);
  });

  it("returns false when team member has no archive permission", () => {
    const member = makeMember({
      permissions: { properties: { canArchive: false } } as any,
    });

    const result = canArchivePropertyForMember(member, "prop-1");
    expect(result).toBe(false);
  });

  it("returns true when canArchive and no specificProperties (full access)", () => {
    const member = makeMember({
      permissions: {
        properties: { canArchive: true, specificProperties: [] },
      } as any,
    });

    const result = canArchivePropertyForMember(member, "any-id");
    expect(result).toBe(true);
  });

  it("returns true only for properties listed in specificProperties", () => {
    const member = makeMember({
      permissions: {
        properties: { canArchive: true, specificProperties: ["prop-1"] },
      } as any,
    });

    const canArchive1 = canArchivePropertyForMember(member, "prop-1");
    const canArchive2 = canArchivePropertyForMember(member, "prop-2");

    expect(canArchive1).toBe(true);
    expect(canArchive2).toBe(false);
  });
});
