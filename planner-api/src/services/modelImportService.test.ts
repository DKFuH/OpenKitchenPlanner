import { describe, expect, it } from 'vitest'
import { extractModelImportMeta } from './modelImportService.js'
import { readFileSync } from 'node:fs'

describe('modelImportService', () => {
  it('parses OBJ in meter scale and converts bbox to mm', () => {
    const obj = [
      'v 0 0 0',
      'v 0.6 0 0',
      'v 0 0.72 0',
      'v 0 0 0.56',
    ].join('\n')

    const meta = extractModelImportMeta('korpus.obj', obj)

    expect(meta.sourceFormat).toBe('obj')
    expect(meta.defaultScale.factor_to_mm).toBe(1000)
    expect(meta.bboxMm).toEqual({ width_mm: 600, height_mm: 720, depth_mm: 560 })
    expect(meta.vertexCount).toBe(4)
  })

  it('parses OBJ in cm scale and converts bbox to mm', () => {
    const obj = [
      'v 0 0 0',
      'v 60 0 0',
      'v 0 72 0',
      'v 0 0 56',
    ].join('\n')

    const meta = extractModelImportMeta('korpus.obj', obj)

    expect(meta.defaultScale.factor_to_mm).toBe(10)
    expect(meta.defaultScale.source_unit).toBe('cm')
    expect(meta.bboxMm).toEqual({ width_mm: 600, height_mm: 720, depth_mm: 560 })
  })

  it('parses DAE position source arrays', () => {
    const dae = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<COLLADA>',
      '  <library_geometries>',
      '    <geometry id="geom-1">',
      '      <mesh>',
      '        <source id="geom-1-positions">',
      '          <float_array id="geom-1-positions-array" count="12">0 0 0 0.6 0 0 0 0.72 0 0 0 0.56</float_array>',
      '        </source>',
      '      </mesh>',
      '    </geometry>',
      '  </library_geometries>',
      '</COLLADA>',
    ].join('\n')

    const meta = extractModelImportMeta('asset.dae', dae)

    expect(meta.sourceFormat).toBe('dae')
    expect(meta.bboxMm).toEqual({ width_mm: 600, height_mm: 720, depth_mm: 560 })
  })

  it('throws for unsupported file extension', () => {
    expect(() => extractModelImportMeta('asset.xyz', '...')).toThrow('Unterstützt werden')
  })

  it('throws for empty file content', () => {
    expect(() => extractModelImportMeta('asset.obj', '   ')).toThrow('Datei ist leer')
  })

  it('throws when no geometry vertices are found', () => {
    expect(() => extractModelImportMeta('asset.obj', 'o mesh\nf 1 2 3')).toThrow('Keine Geometriedaten im Modell gefunden')
  })

  it('throws when bbox has no volume', () => {
    const obj = [
      'v 0 0 0',
      'v 0 0 0',
      'v 0 0 0',
    ].join('\n')

    expect(() => extractModelImportMeta('flat.obj', obj)).toThrow('Ungültige Bounding-Box')
  })

  it('measures embedded glTF geometry including node transforms in meters', () => {
    const doc = JSON.parse(readFileSync(new URL('../../../planner-frontend/public/object-library/standard-base-60/model.gltf', import.meta.url), 'utf8'))
    const meshNode = doc.nodes.find((node: { mesh?: number }) => node.mesh !== undefined)
    delete meshNode.matrix
    meshNode.scale = [2, 1, 1]
    const meta = extractModelImportMeta('cabinet.gltf', JSON.stringify(doc))
    expect(meta.bboxMm).toEqual({ width_mm: 1200, height_mm: 720, depth_mm: 560 })
  })

  it('rejects glTF with external buffers and invalid buffer ranges', () => {
    const doc = JSON.parse(readFileSync(new URL('../../../planner-frontend/public/object-library/standard-base-60/model.gltf', import.meta.url), 'utf8'))
    const original = doc.buffers[0].uri
    doc.buffers[0].uri = 'https://example.com/model.bin'
    expect(() => extractModelImportMeta('external.gltf', JSON.stringify(doc))).toThrow('eingebettet')
    doc.buffers[0].uri = original
    doc.accessors.find((accessor: { type: string }) => accessor.type === 'VEC3').count = 1_000_001
    expect(() => extractModelImportMeta('broken.gltf', JSON.stringify(doc))).toThrow('Puffergrenzen')
  })

  it('imports GLB binary geometry without converting it to UTF-8', () => {
    const doc = JSON.parse(readFileSync(new URL('../../../planner-frontend/public/object-library/standard-base-60/model.gltf', import.meta.url), 'utf8'))
    const binary = Buffer.from(doc.buffers[0].uri.split(',')[1], 'base64')
    delete doc.buffers[0].uri
    const json = Buffer.from(JSON.stringify(doc))
    const paddedJson = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 32)])
    const paddedBinary = Buffer.concat([binary, Buffer.alloc((4 - binary.length % 4) % 4)])
    const glb = Buffer.alloc(28 + paddedJson.length + paddedBinary.length)
    glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8)
    glb.writeUInt32LE(paddedJson.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); paddedJson.copy(glb, 20)
    glb.writeUInt32LE(paddedBinary.length, 20 + paddedJson.length); glb.writeUInt32LE(0x004e4942, 24 + paddedJson.length); paddedBinary.copy(glb, 28 + paddedJson.length)
    expect(extractModelImportMeta('cabinet.glb', glb).bboxMm).toEqual({ width_mm: 600, height_mm: 720, depth_mm: 560 })
    glb.writeUInt32LE(glb.length + 4, 8)
    expect(() => extractModelImportMeta('broken.glb', glb)).toThrow('GLB-Datei')
  })

  it('requires a height and explicit units for a closed DXF plan', () => {
    const dxf = ['0','SECTION','2','HEADER','9','$INSUNITS','70','4','0','ENDSEC','0','SECTION','2','ENTITIES','0','LWPOLYLINE','8','PLAN','90','4','70','1','10','100','20','200','10','700','20','200','10','700','20','760','10','100','20','760','0','ENDSEC','0','EOF'].join('\n')
    expect(() => extractModelImportMeta('plan.dxf', dxf)).toThrow('Objekthöhe')
    expect(extractModelImportMeta('plan.dxf', dxf, { height_mm: 720 }).bboxMm).toEqual({ width_mm: 600, height_mm: 720, depth_mm: 560 })
    expect(() => extractModelImportMeta('plan.dxf', dxf.replace('$INSUNITS\n70\n4', '$INSUNITS\n70\n0'), { height_mm: 720 })).toThrow('Einheit')
  })
})
