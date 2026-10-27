import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import * as THREE from 'three'
import { createOpeningVisual } from '../src/components/editor/roomOpeningGeometry.js'

// GLTFExporter uses this browser API only to embed its geometry buffer.
class NodeFileReader {
  result: string | ArrayBuffer | null = null
  onloadend: (() => void) | null = null
  readAsArrayBuffer(blob: Blob) {
    void blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.() })
  }
  readAsDataURL(blob: Blob) {
    void blob.arrayBuffer().then(buffer => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buffer).toString('base64')}`
      this.onloadend?.()
    })
  }
}
Object.assign(globalThis, { FileReader: NodeFileReader })

const root = fileURLToPath(new URL('../', import.meta.url))
const source = path.join(root, 'object-library')
const output = path.join(root, 'public/object-library')
const exporter = new GLTFExporter()
const index: Array<{ id: string; name: string; category: string; template: string; model: string; plan: string }> = []

for (const directory of await readdir(source, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue
  const file = path.join(source, directory.name, 'template.json')
  const template = JSON.parse(await readFile(file, 'utf8'))
  if (template.schema_version !== 1 || template.units !== 'mm' || template.id !== directory.name) throw new Error(`Invalid template: ${file}`)
  const { width_mm, height_mm } = template.dimensions
  if (!(width_mm > 0 && height_mm > 0)) throw new Error(`Invalid dimensions: ${file}`)
  const visual = ['door', 'window'].includes(template.category)
    ? createOpeningVisual({ ...template.parameters, ...template.dimensions, type: template.category, sill_height_mm: 0, wall_id: '', offset_mm: 0 })
    : new THREE.Group()
  if (!['door', 'window'].includes(template.category)) {
    const material = new THREE.MeshStandardMaterial({ color: '#d8c3a5', roughness: 0.8 })
    material.name = 'carcass'
    const box = new THREE.Mesh(new THREE.BoxGeometry(width_mm / 1000, height_mm / 1000, template.dimensions.depth_mm / 1000), material)
    box.name = 'carcass'
    box.position.y = height_mm / 2000
    visual.add(box)
  }
  const model = await exporter.parseAsync(visual, { binary: false })
  const destination = path.join(output, template.id)
  await mkdir(destination, { recursive: true })
  await writeFile(path.join(destination, 'model.gltf'), JSON.stringify(model))
  await writeFile(path.join(destination, 'template.json'), JSON.stringify(template, null, 2) + '\n')

  const pairs: Array<string | number> = [0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1021', 9, '$INSUNITS', 70, 4, 0, 'ENDSEC', 0, 'SECTION', 2, 'ENTITIES']
  const line = (layer: string, x0: number, y0: number, x1: number, y1: number) => pairs.push(0, 'LINE', 8, layer, 10, x0, 20, y0, 30, 0, 11, x1, 21, y1, 31, 0)
  // DXF in millimetres: footprint at the origin, elevation above it, separate layers.
  const depth = template.dimensions.depth_mm
  pairs.push(0, 'LWPOLYLINE', 8, 'PLAN', 90, 4, 70, 1)
  for (const [x, y] of [[0, 0], [width_mm, 0], [width_mm, depth], [0, depth]]) pairs.push(10, x, 20, y)
  const bottom = depth + 250
  for (const [x0, y0, x1, y1] of [[0, bottom, width_mm, bottom], [width_mm, bottom, width_mm, bottom + height_mm], [width_mm, bottom + height_mm, 0, bottom + height_mm], [0, bottom + height_mm, 0, bottom]]) line('ELEVATION_FRAME', x0, y0, x1, y1)
  const leaves = template.parameters.leaf_count ?? 1
  for (let i = 1; i < leaves; i++) line('ELEVATION_MULLIONS', width_mm * i / leaves, bottom, width_mm * i / leaves, bottom + height_mm)
  const rows = template.parameters.muntin_rows ?? 0
  for (let i = 1; i <= rows; i++) line('ELEVATION_MUNTINS', 0, bottom + height_mm * i / (rows + 1), width_mm, bottom + height_mm * i / (rows + 1))
  pairs.push(0, 'ENDSEC', 0, 'EOF')
  await writeFile(path.join(destination, 'plan.dxf'), pairs.join('\n') + '\n')
  index.push({ id: template.id, name: template.name, category: template.category, template: `${template.id}/template.json`, model: `${template.id}/model.gltf`, plan: `${template.id}/plan.dxf` })
  visual.traverse(object => {
    const mesh = object as import('three').Mesh
    mesh.geometry?.dispose()
    if (Array.isArray(mesh.material)) mesh.material.forEach(material => material.dispose())
    else mesh.material?.dispose()
  })
}
await writeFile(path.join(output, 'index.json'), JSON.stringify(index, null, 2) + '\n')
console.log(`Object library: ${index.length} file templates exported as glTF + DXF.`)
