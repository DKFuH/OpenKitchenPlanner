import { describe, expect, it } from 'vitest';

import type { SkpComponent } from '@shared/types';
import { autoMapComponent, parseSkp } from './skpParser';

describe('skpParser', () => {
  it('parses mock SKP payloads into a reference model', () => {
    const buffer = Buffer.from(
      JSON.stringify({
        project_id: 'project-7',
        import_job_id: 'job-7',
        components: [
          {
            name: 'US_60',
            guid: 'guid-1',
            position: { x_mm: 100, y_mm: 200, z_mm: 0 },
            rotation: { z_deg: 90 },
            metadata: { Type: 'BaseCabinet' },
            vertices: [
              { x_mm: 0, y_mm: 0, z_mm: 0 },
              { x_mm: 600, y_mm: 0, z_mm: 0 },
              { x_mm: 600, y_mm: 580, z_mm: 720 }
            ]
          }
        ]
      }),
      'utf8'
    );

    const result = parseSkp(buffer, 'sample.skp');

    expect(result.project_id).toBe('project-7');
    expect(result.components).toHaveLength(1);
    expect(result.components[0]).toMatchObject({
      skp_component_name: 'US_60',
      skp_instance_guid: 'guid-1',
      position: { x_mm: 100, y_mm: 200, z_mm: 0 },
      rotation: { x_deg: 0, y_deg: 0, z_deg: 90 },
      dimensions: { width_mm: 600, depth_mm: 580, height_mm: 720 }
    });
    expect(result.components[0].mapping?.target_type).toBe('cabinet');
    expect(result.raw_geometry_url.startsWith('data:application/octet-stream;base64,')).toBe(true);
  });

  it('maps appliance-like names automatically', () => {
    const component: SkpComponent = {
      id: 'component-1',
      reference_model_id: 'model-1',
      skp_component_name: 'Kühlschrank Einbau',
      skp_instance_guid: 'guid-2',
      position: { x_mm: 0, y_mm: 0, z_mm: 0 },
      rotation: { x_deg: 0, y_deg: 0, z_deg: 0 },
      dimensions: { width_mm: 600, height_mm: 1800, depth_mm: 650 },
      metadata: {},
      mapping: null
    };

    expect(autoMapComponent(component)).toEqual({
      component_id: 'component-1',
      target_type: 'appliance',
      catalog_item_id: null,
      label: 'Kühlschrank Einbau'
    });
  });

  it('falls back to reference objects for unknown components', () => {
    const buffer = Buffer.from(
      JSON.stringify({
        components: [
          {
            name: 'Dekoration',
            guid: 'guid-3',
            position: { x_mm: 0, y_mm: 0, z_mm: 0 }
          }
        ]
      }),
      'utf8'
    );

    const result = parseSkp(buffer, 'unknown.skp');

    expect(result.components[0].mapping?.target_type).toBe('reference_object');
  });
});
