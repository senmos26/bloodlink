import { describe, it, expect } from "vitest";
import {
  getRoleById,
  getRolePermissions,
  canRolePerformAction,
  isAdminRole,
  isReadOnlyRole,
  hasFullAccess,
} from "@/features/team-management/utils/roles.utils";

describe("roles.utils - role definitions", () => {
  it("should return a role by id", () => {
    const role = getRoleById("assistant_pm");
    expect(role).toBeTruthy();
    expect(role?.permissions.properties.canEdit).toBe(true);
  });

  it("should return null permissions for unknown role", () => {
    const perms = getRolePermissions("unknown-role");
    expect(perms).toBeNull();
  });
});

describe("roles.utils - canRolePerformAction", () => {
  it("assistant_pm should be able to edit properties", () => {
    const canEdit = canRolePerformAction("assistant_pm", "properties", "edit");
    expect(canEdit).toBe(true);
  });

  it("owner should NOT be able to edit properties", () => {
    const canEdit = canRolePerformAction("owner", "properties", "edit");
    expect(canEdit).toBe(false);
  });
});

describe("roles.utils - role helpers", () => {
  it("should detect admin roles correctly", () => {
    expect(isAdminRole("owner")).toBe(true);
    expect(isAdminRole("assistant_pm")).toBe(true);
    expect(isAdminRole("auditor")).toBe(false);
  });

  it("should detect read-only roles correctly", () => {
    expect(isReadOnlyRole("auditor")).toBe(true);
    expect(isReadOnlyRole("system_support")).toBe(true);
    expect(isReadOnlyRole("owner")).toBe(false);
  });

  it("should detect full access role", () => {
    expect(hasFullAccess("assistant_pm")).toBe(true);
    expect(hasFullAccess("owner")).toBe(false);
  });
});
