import { describe, expect, it } from 'vitest';

import { parseDxf } from './dxfParser';

describe('parseDxf', () => {
  it('parses a minimal DXF string with one LINE', () => {
    const dxf = [
      '0',
      'SECTION',
      '2',
      'HEADER',
      '9',
      '$INSUNITS',
      '70',
      '4',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'TABLES',
      '0',
      'TABLE',
      '2',
      'LAYER',
      '70',
      '1',
      '0',
      'LAYER',
      '2',
      'Walls',
      '62',
      '7',
      '70',
      '0',
      '0',
      'ENDTAB',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
      '0',
      'LINE',
      '5',
      'A1',
      '8',
      'Walls',
      '10',
      '0',
      '20',
      '0',
      '11',
      '1000',
      '21',
      '0',
      '0',
      'ENDSEC',
      '0',
      'EOF'
    ].join('\n');

    const asset = parseDxf(dxf, 'line.dxf');

    expect(asset.units).toBe('mm');
    expect(asset.entities).toHaveLength(1);
    expect(asset.entities[0]).toMatchObject({
      id: 'A1',
      type: 'line',
      geometry: {
        type: 'line',
        start: { x_mm: 0, y_mm: 0 },
        end: { x_mm: 1000, y_mm: 0 }
      }
    });
  });

  it('records unsupported entities as ignored', () => {
    const dxf = [
      '0',
      'SECTION',
      '2',
      'ENTITIES',
      '0',
      'ELLIPSE',
      '8',
      '0',
      '10',
      '0',
      '20',
      '0',
      '11',
      '10',
      '21',
      '0',
      '40',
      '0.5',
      '41',
      '0',
      '42',
      '6.283185',
      '0',
      'ENDSEC',
      '0',
      'EOF'
    ].join('\n');

    const asset = parseDxf(dxf, 'unsupported.dxf');

    expect(asset.entities).toHaveLength(0);
    expect(asset.protocol).toEqual([
      {
        entity_id: 'ELLIPSE-0',
        status: 'ignored',
        reason: 'Unsupported entity type ELLIPSE.'
      }
    ]);
  });

  it('converts inches to millimeters using INSUNITS', () => {
    const dxf = [
      '0',
      'SECTION',
      '2',
      'HEADER',
      '9',
      '$INSUNITS',
      '70',
      '1',
      '0',
      'ENDSEC',
      '0',
      'SECTION',
      '2',
      'ENTITIES',
      '0',
      'LINE',
      '5',
      'A1',
      '8',
      '0',
      '10',
      '1',
      '20',
      '0',
      '11',
      '2',
      '21',
      '0',
      '0',
      'ENDSEC',
      '0',
      'EOF'
    ].join('\n');

    const asset = parseDxf(dxf, 'inches.dxf');
    const line = asset.entities[0];

    expect(asset.units).toBe('inch');
    expect(line).toMatchObject({
      geometry: {
        start: { x_mm: 25.4, y_mm: 0 },
        end: { x_mm: 50.8, y_mm: 0 }
      }
    });
  });
});
