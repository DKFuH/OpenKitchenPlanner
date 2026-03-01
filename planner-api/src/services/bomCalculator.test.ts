import { describe, expect, it } from 'vitest';
import type { ProjectSnapshot } from '../../../../shared-schemas/src/types';
import { calculateBOM, sumBOMLines } from './bomCalculator';

function baseProject(): ProjectSnapshot {
  return {
    id: 'project-1',
    cabinets: [],
    appliances: [],
    accessories: [],
    priceListItems: [
      { catalog_item_id: 'cab-60', list_price_net: 500, dealer_price_net: 300 },
      { catalog_item_id: 'stove-1', list_price_net: 1200, dealer_price_net: 800 }
    ],
    taxGroups: [{ id: 'tax-de', name: 'DE 19%', tax_rate: 0.19 }],
    quoteSettings: {
      freight_flat_rate: 89,
      assembly_rate_per_item: 45
    }
  };
}

describe('bomCalculator', () => {
  it('returns only freight line for empty project', () => {
    const project = baseProject();
    const lines = calculateBOM(project);

    expect(lines).toHaveLength(1);
    expect(lines[0].type).toBe('freight');
    expect(lines[0].list_price_net).toBe(89);
  });

  it('creates lines for 3 cabinets and 1 appliance', () => {
    const project = baseProject();
    project.cabinets = [
      {
        id: 'c1',
        catalog_item_id: 'cab-60',
        tax_group_id: 'tax-de',
        flags: {
          requires_customization: false,
          height_variant: null,
          labor_surcharge: false,
          special_trim_needed: false
        }
      },
      {
        id: 'c2',
        catalog_item_id: 'cab-60',
        tax_group_id: 'tax-de',
        flags: {
          requires_customization: false,
          height_variant: null,
          labor_surcharge: false,
          special_trim_needed: false
        }
      },
      {
        id: 'c3',
        catalog_item_id: 'cab-60',
        tax_group_id: 'tax-de',
        flags: {
          requires_customization: false,
          height_variant: null,
          labor_surcharge: false,
          special_trim_needed: false
        }
      }
    ];
    project.appliances = [
      {
        id: 'a1',
        catalog_item_id: 'stove-1',
        tax_group_id: 'tax-de',
        flags: {
          requires_customization: false,
          height_variant: null,
          labor_surcharge: false,
          special_trim_needed: false
        }
      }
    ];

    const lines = calculateBOM(project);
    const cabinetLines = lines.filter((line) => line.type === 'cabinet');
    const applianceLines = lines.filter((line) => line.type === 'appliance');

    expect(cabinetLines).toHaveLength(3);
    expect(applianceLines).toHaveLength(1);
    expect(lines.some((line) => line.type === 'freight')).toBe(true);
  });

  it('adds surcharge line when special trim flag is set', () => {
    const project = baseProject();
    project.cabinets = [
      {
        id: 'c1',
        catalog_item_id: 'cab-60',
        tax_group_id: 'tax-de',
        flags: {
          requires_customization: false,
          height_variant: null,
          labor_surcharge: false,
          special_trim_needed: true
        }
      }
    ];

    const lines = calculateBOM(project);
    expect(lines.some((line) => line.type === 'surcharge')).toBe(true);

    const totals = sumBOMLines(lines);
    expect(totals.total_list_net).toBeGreaterThan(0);
    expect(totals.total_net_after_discounts).toBeGreaterThan(0);
  });
});
