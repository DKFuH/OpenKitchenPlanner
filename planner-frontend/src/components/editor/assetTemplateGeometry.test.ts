import { readFile } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { disposeTemplate, fitTemplateObject, parseTemplateObject } from './assetTemplateGeometry.js'

afterEach(() => vi.unstubAllGlobals())

describe('file template geometry', () => {
  it('loads the actual embedded model, preserves material names and fits the placement dimensions', async () => {
    vi.stubGlobal('ProgressEvent', class { constructor(public type: string) {} })
    const bytes = await readFile(new URL('../../../public/object-library/window-tilt-turn-double/model.gltf', import.meta.url))
    const source = await parseTemplateObject(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'gltf', 1200)
    const materialNames: string[] = []
    source.traverse(node => {
      if (node instanceof THREE.Mesh) materialNames.push(...(Array.isArray(node.material) ? node.material : [node.material]).map(material => material.name))
    })
    expect(materialNames).toContain('glass')
    expect(materialNames).toContain('frame')
    const fitted = fitTemplateObject(source, { width_mm: 1800, height_mm: 1500, depth_mm: 200 })
    const box = new THREE.Box3().setFromObject(fitted)
    const size = box.getSize(new THREE.Vector3())
    expect(size.x).toBeCloseTo(1.8)
    expect(size.y).toBeCloseTo(1.5)
    expect(size.z).toBeCloseTo(.2)
    expect(box.min.y).toBeCloseTo(0)
    expect((box.min.x + box.max.x) / 2).toBeCloseTo(0)
    disposeTemplate(fitted)
  })

  it('uses only the PLAN profile of an exported DXF and extrudes the specified height', async () => {
    const bytes = await readFile(new URL('../../../public/object-library/standard-base-60/plan.dxf', import.meta.url))
    const source = await parseTemplateObject(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), 'dxf', 900)
    const size = new THREE.Box3().setFromObject(source).getSize(new THREE.Vector3())
    expect(size.x).toBeCloseTo(.6)
    expect(size.y).toBeCloseTo(.9)
    expect(size.z).toBeCloseTo(.56)
    disposeTemplate(source)
  })
})
