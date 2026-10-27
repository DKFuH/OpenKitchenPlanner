import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js'
import DxfParser from 'dxf-parser'
import { tenantScopedHeaders } from '../../api/runtimeContext.js'
import { assetLibraryApi } from '../../api/assetLibrary.js'
import type { AssetLibraryItem } from '../../plugins/assetLibrary/index.js'

export function disposeTemplate(object: THREE.Object3D) {
  object.traverse(node => {
    if (!(node instanceof THREE.Mesh || node instanceof THREE.Line)) return
    node.geometry.dispose()
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose()
      material.dispose()
    }
  })
}

export async function parseTemplateObject(data: ArrayBuffer, format: AssetLibraryItem['source_format'], heightMm: number): Promise<THREE.Object3D> {
  const manager = new THREE.LoadingManager()
  manager.setURLModifier(url => {
    if (/^(data:|blob:)/i.test(url)) return url
    throw new Error('Externe Modelldateien oder Texturen sind nicht eingebettet')
  })
  if (format === 'glb' || format === 'gltf') {
    const model = await new GLTFLoader(manager).parseAsync(data, '')
    return model.scene
  }
  const text = new TextDecoder().decode(data)
  if (format === 'obj') return new OBJLoader(manager).parse(text)
  if (format === 'dae') {
    const model = new ColladaLoader(manager).parse(text, '')
    if (!model) throw new Error('DAE konnte nicht gelesen werden')
    return model.scene
  }
  const document = new DxfParser().parseSync(text)
  if (!document) throw new Error('DXF konnte nicht gelesen werden')
  const factor = ({ 1: .0254, 2: .3048, 4: .001, 5: .01, 6: 1 } as Record<number, number>)[Number(document.header?.$INSUNITS)]
  if (!factor) throw new Error('DXF-Einheit fehlt')
  const profiles = document.entities.filter((entity: any) => entity.type === 'LWPOLYLINE' && entity.shape) as any[]
  const selected = profiles.some(p => p.layer === 'PLAN') ? profiles.filter(p => p.layer === 'PLAN') : profiles
  if (!selected.length) throw new Error('Geschlossene DXF-Grundrisskontur fehlt')
  const group = new THREE.Group()
  for (const profile of selected) {
    if (profile.vertices.some((v: any) => v.bulge)) throw new Error('DXF-Konturen mit Kreisbögen werden noch nicht unterstützt')
    const shape = new THREE.Shape(profile.vertices.map((v: any) => new THREE.Vector2(v.x * factor, v.y * factor)))
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: heightMm / 1000, bevelEnabled: false })
    geometry.rotateX(-Math.PI / 2)
    group.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#c7b49b', roughness: .7 })))
  }
  return group
}

export function fitTemplateObject(object: THREE.Object3D, dimensions: { width_mm: number; height_mm: number; depth_mm: number }) {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = bounds.getSize(new THREE.Vector3())
  if (![size.x, size.y, size.z].every(value => Number.isFinite(value) && value > 0)) throw new Error('Modell besitzt keine räumliche Ausdehnung')
  const centered = new THREE.Group()
  centered.add(object)
  object.position.sub(new THREE.Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, (bounds.min.z + bounds.max.z) / 2))
  centered.scale.set(dimensions.width_mm / 1000 / size.x, dimensions.height_mm / 1000 / size.y, dimensions.depth_mm / 1000 / size.z)
  return centered
}

export async function loadAssetTemplate(id: string, dimensions: { width_mm: number; height_mm: number; depth_mm: number }) {
  const asset = await assetLibraryApi.get(id)
  const response = await fetch(`/api/v1/tenant/assets/${encodeURIComponent(id)}/file`, { headers: tenantScopedHeaders() })
  if (!response.ok) throw new Error('Vorlagendatei konnte nicht geladen werden')
  const object = await parseTemplateObject(await response.arrayBuffer(), asset.source_format, asset.bbox_json.height_mm)
  return fitTemplateObject(object, dimensions)
}
