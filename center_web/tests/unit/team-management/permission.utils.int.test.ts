import { describe, it, expect } from "vitest";
import type { AddUserWizardInput } from "@/features/team-management/schemas";
import { convertWizardToBackendPermissions } from "@/features/team-management/utils/permission.utils";
import { canPerformAction, hasPropertyAccess } from "@/features/team-management/utils/permission.utils";
import type { TeamMember } from "@/features/team-management/types";

function makeWizardInputForPropertyStaff(): AddUserWizardInput {
  return {
    // Champs de base du wizard – on ne teste pas la validation ici, juste la structure minimale
    name: "Test Staff",
    email: "staff@example.com",
    password: "Password123!",
    role: "property_staff",
    accessType: "custom",
    // Permissions côté wizard (customPermissions)
    permissions: {
      hasFullAccess: false,
    },
  } as any;
}

function attachPropertySelection(
  wizard: AddUserWizardInput,
  propertyIds: string[],
  unitsByProperty: Record<string, string[]>
): AddUserWizardInput {
  const w: any = { ...wizard };
  w.selectedProperties = propertyIds;
  w.selectedUnits = unitsByProperty;
  w.customPermissions = {
    properties: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canArchive: false,
    },
    charges: {
      canView: true,
      canCreate: true,
      canEdit: true,
      canArchive: true,
    },
    tenants: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canArchive: false,
    },
    contacts: {
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
    },
    documents: {
      canView: true,
      canDownload: true,
    },
    financial: {
      canViewReports: true,
      canExport: true,
    },
  };
  return w as AddUserWizardInput;
}

function makeMemberFromPermissions(perms: ReturnType<typeof convertWizardToBackendPermissions>): TeamMember {
  return {
    id: "member-1",
    organization_id: "org-1",
    name: "Test Staff",
    email: "staff@example.com",
    role: "property_staff",
    status: "active",
    permissions: perms,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as TeamMember;
}

describe("permission.utils integration - convertWizardToBackendPermissions + canPerformAction", () => {
  it("property_staff with custom permissions should be able to view assigned properties and manage charges", () => {
    const baseWizard = makeWizardInputForPropertyStaff();
    const wizard = attachPropertySelection(baseWizard, ["prop-1", "prop-2"], {
      "prop-1": ["unit-1", "unit-2"],
      "prop-2": ["unit-3"],
    });

    const backendPermissions = convertWizardToBackendPermissions(wizard);
    const member = makeMemberFromPermissions(backendPermissions);

    // Vérifier accès propriétés/charges via canPerformAction
    expect(canPerformAction(member, "properties", "view")).toBe(true);
    expect(canPerformAction(member, "properties", "edit")).toBe(false);

    expect(canPerformAction(member, "charges", "view")).toBe(true);
    expect(canPerformAction(member, "charges", "create")).toBe(true);
    expect(canPerformAction(member, "charges", "edit")).toBe(true);
    expect(canPerformAction(member, "charges", "archive")).toBe(true);

    // Vérifier accès aux propriétés spécifiques
    expect(hasPropertyAccess(member, "prop-1")).toBe(true);
    expect(hasPropertyAccess(member, "prop-2")).toBe(true);
    expect(hasPropertyAccess(member, "prop-999")).toBe(false);
  });

  it("full access wizard should give hasFullAccess member that can do everything", () => {
    const baseWizard = makeWizardInputForPropertyStaff();
    const fullWizard: any = { ...baseWizard };
    fullWizard.permissions = { hasFullAccess: true };
    fullWizard.customPermissions = { hasFullAccess: true };

    const backendPermissions = convertWizardToBackendPermissions(fullWizard as AddUserWizardInput);
    const member = makeMemberFromPermissions(backendPermissions);

    expect(backendPermissions.hasFullAccess).toBe(true);

    // Tous les modules/actions doivent être autorisés
    expect(canPerformAction(member, "properties", "view")).toBe(true);
    expect(canPerformAction(member, "properties", "edit")).toBe(true);
    expect(canPerformAction(member, "charges", "archive")).toBe(true);
    expect(canPerformAction(member, "tenants", "create")).toBe(true);
    expect(canPerformAction(member, "contacts", "delete")).toBe(true);
    expect(canPerformAction(member, "documents", "download")).toBe(true);
    expect(canPerformAction(member, "financial", "reports")).toBe(true);

    // Propriétés : accès total
    expect(hasPropertyAccess(member, "any-prop")).toBe(true);
  });
});
