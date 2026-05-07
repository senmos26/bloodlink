import { test, expect } from '@playwright/test';
import computeAllocation from '@/features/regularisations/engine';
import type { EngineInput, EngineResult, RegularizationData } from '@/features/regularisations/engine/types';

function buildBaseData(): RegularizationData {
  return {
    property: { id: 'prop-test-1', name: 'Propriété Test' },
    period: { start: '2025-01-01', end: '2025-03-31' },
    units: [
      { id: 'unit-1', unit_number: 'A1', size_sq_ft: 100, tantiemes: 1000 },
      { id: 'unit-2', unit_number: 'A2', size_sq_ft: 300, tantiemes: 3000 },
    ],
    leases: [
      { unit_id: 'unit-1', tenant_id: 'tenant-1', tenant_name: 'Locataire 1', occupants: 2 },
      { unit_id: 'unit-2', tenant_id: 'tenant-2', tenant_name: 'Locataire 2', occupants: 3 },
    ],
    expenses: [
      { id: 'exp-1', amount: 1000, category: 'water' },
      { id: 'exp-2', amount: 3000, category: 'electricity' },
    ],
  };
}

function buildInput(overrides: Partial<EngineInput> = {}): EngineInput {
  const data = buildBaseData();
  const base: EngineInput = {
    propertyId: data.property.id,
    unitIds: data.units.map((u) => u.id),
    allocationKey: 'surface',
    period: data.period,
    provisionAmount: undefined,
    data,
  };
  return { ...base, ...overrides };
}

function summarize(result: EngineResult) {
  return {
    total_charges: result.total_charges,
    provision_amount: result.provision_amount,
    provision_months: result.provision_months,
    unitCount: result.results.length,
    allocations: result.results.map((r) => ({
      unit_id: r.unit_id,
      factor_used: r.factor_used,
      percentage: r.percentage,
      allocated_amount: r.allocated_amount,
      total_provisions: r.total_provisions,
      balance: r.balance,
    })),
  };
}

test.describe('Regularisations Engine – computeAllocation', () => {
  test('répartit correctement les charges par surface sans provisions', () => {
    const input = buildInput({ allocationKey: 'surface', provisionAmount: undefined });

    const result = computeAllocation(input);
    const summary = summarize(result);

    expect(summary.total_charges).toBeCloseTo(4000, 6);
    expect(summary.provision_amount).toBeUndefined();
    expect(summary.provision_months).toBe(3);
    expect(summary.unitCount).toBe(2);

    const [u1, u2] = summary.allocations;

    // Facteurs
    expect(u1.factor_used).toBeCloseTo(100, 6);
    expect(u2.factor_used).toBeCloseTo(300, 6);

    // Pourcentages
    expect(u1.percentage).toBeCloseTo(0.25, 6);
    expect(u2.percentage).toBeCloseTo(0.75, 6);

    // Montants alloués
    expect(u1.allocated_amount).toBeCloseTo(1000, 2);
    expect(u2.allocated_amount).toBeCloseTo(3000, 2);

    // Pas de provisions => total_provisions = 0, balance = -allocated_amount
    expect(u1.total_provisions).toBeCloseTo(0, 6);
    expect(u2.total_provisions).toBeCloseTo(0, 6);
    expect(u1.balance).toBeCloseTo(-1000, 2);
    expect(u2.balance).toBeCloseTo(-3000, 2);
  });

  test('gère les provisions mensuelles et calcule le solde avec la bonne convention', () => {
    const input = buildInput({ allocationKey: 'surface', provisionAmount: 100 });

    const result = computeAllocation(input);
    const summary = summarize(result);

    expect(summary.total_charges).toBeCloseTo(4000, 6);
    expect(summary.provision_amount).toBeCloseTo(100, 6);
    expect(summary.provision_months).toBe(3);

    const [u1, u2] = summary.allocations;

    // Total des provisions par unité = provisionAmount * nb mois
    expect(u1.total_provisions).toBeCloseTo(300, 2);
    expect(u2.total_provisions).toBeCloseTo(300, 2);

    // Solde = total_provisions - allocated_amount
    expect(u1.balance).toBeCloseTo(300 - 1000, 2); // négatif => le locataire doit payer
    expect(u2.balance).toBeCloseTo(300 - 3000, 2);
  });

  test('lève une erreur si aucune charge commune n\'est trouvée', () => {
    const data: RegularizationData = {
      ...buildBaseData(),
      expenses: [],
    };

    const input: EngineInput = {
      propertyId: data.property.id,
      unitIds: data.units.map((u) => u.id),
      allocationKey: 'surface',
      period: data.period,
      provisionAmount: undefined,
      data,
    };

    expect(() => computeAllocation(input)).toThrow('Aucune charge commune trouvée pour cette période');
  });

  test('lève une erreur si le facteur total est nul pour la clé choisie', () => {
    const data: RegularizationData = {
      ...buildBaseData(),
      units: [
        { id: 'unit-1', unit_number: 'A1', size_sq_ft: 0 },
        { id: 'unit-2', unit_number: 'A2', size_sq_ft: 0 },
      ],
    };

    const input: EngineInput = {
      propertyId: data.property.id,
      unitIds: data.units.map((u) => u.id),
      allocationKey: 'surface',
      period: data.period,
      provisionAmount: undefined,
      data,
    };

    expect(() => computeAllocation(input)).toThrow('Facteur total nul pour la clé de répartition sélectionnée');
  });
});
