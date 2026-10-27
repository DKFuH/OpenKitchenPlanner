import { readdir, readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import DxfParser from 'dxf-parser'

describe('file-based object library', () => {
  it('provides an editable template, a parseable millimetre DXF and a nonempty glTF for every object', async () => {
    const root = new URL('../../object-library/', import.meta.url)
    const output = new URL('../../public/object-library/', import.meta.url)
    const directories = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory())
    expect(directories.length).toBeGreaterThanOrEqual(21)
    for (const directory of directories) {
      const template = JSON.parse(await readFile(new URL(`${directory.name}/template.json`, root), 'utf8'))
      expect(template.id).toBe(directory.name)
      expect(template.units).toBe('mm')
      const model = JSON.parse(await readFile(new URL(`${directory.name}/model.gltf`, output), 'utf8'))
      expect(model.asset.version).toBe('2.0')
      expect(model.meshes.length).toBeGreaterThan(0)
      expect(model.buffers[0].uri).toMatch(/^data:application\/octet-stream;base64,/)
      const drawing = new DxfParser().parseSync(await readFile(new URL(`${directory.name}/plan.dxf`, output), 'utf8'))
      expect(drawing?.header.$INSUNITS).toBe(4)
      expect(drawing?.entities.some(entity => entity.layer === 'PLAN')).toBe(true)
      expect(drawing?.entities.some(entity => entity.layer === 'ELEVATION_FRAME')).toBe(true)
    }
  })
})
