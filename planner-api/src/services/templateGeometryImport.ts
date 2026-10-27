import { Matrix4, Quaternion, Vector3 } from 'three'
import DxfParser from 'dxf-parser'

export function readGltfDocument(data: Buffer, binary: boolean) {
  if (!binary) return { document: JSON.parse(data.toString('utf8')), binaryChunk: undefined as Buffer | undefined }
  if (data.length < 20 || data.readUInt32LE(0) !== 0x46546c67 || data.readUInt32LE(4) !== 2 || data.readUInt32LE(8) !== data.length) {
    throw new Error('Ungültige GLB-Datei (Version 2 erforderlich)')
  }
  let document: any
  let binaryChunk: Buffer | undefined
  for (let offset = 12; offset < data.length;) {
    if (offset + 8 > data.length) throw new Error('Unvollständiger GLB-Block')
    const length = data.readUInt32LE(offset)
    const type = data.readUInt32LE(offset + 4)
    if (length % 4 || offset + 8 + length > data.length) throw new Error('Ungültige GLB-Blocklänge')
    const chunk = data.subarray(offset + 8, offset + 8 + length)
    if (type === 0x4e4f534a) document = JSON.parse(chunk.toString('utf8').trim())
    if (type === 0x004e4942) binaryChunk = chunk
    offset += 8 + length
  }
  if (!document) throw new Error('GLB enthält kein glTF-Dokument')
  return { document, binaryChunk }
}

// Read actual position buffers rather than trusting accessor min/max supplied by a file.
export function gltfVertices(data: Buffer, binary: boolean): Vector3[] {
  const { document: doc, binaryChunk } = readGltfDocument(data, binary)
  if (doc.asset?.version !== '2.0') throw new Error('glTF 2.0 erforderlich')
  if (doc.extensionsRequired?.length) throw new Error('Komprimierte oder erweiterte glTF-Dateien bitte als einfaches glTF 2.0 exportieren')
  for (const image of doc.images ?? []) {
    if (image.uri && !/^data:image\/(png|jpeg|webp);base64,/i.test(image.uri)) throw new Error('Texturen müssen in der Datei eingebettet sein')
  }
  const buffers: Buffer[] = (doc.buffers ?? []).map((buffer: any, index: number) => {
    let decoded: Buffer
    if (!buffer.uri && index === 0 && binaryChunk) decoded = binaryChunk
    else if (typeof buffer.uri === 'string' && /^data:application\/(octet-stream|gltf-buffer);base64,/i.test(buffer.uri)) decoded = Buffer.from(buffer.uri.split(',')[1], 'base64')
    else throw new Error('Geometrie muss eingebettet sein: bitte GLB oder glTF mit eingebetteten Daten verwenden')
    if (decoded.length < buffer.byteLength) throw new Error('Unvollständiger glTF-Puffer')
    return decoded
  })
  const vertices: Vector3[] = []
  const active = new Set<number>()
  const visit = (index: number, parent: Matrix4, depth = 0) => {
    if (depth > 100 || active.has(index)) throw new Error('Ungültiger glTF-Szenengraph')
    const node = doc.nodes?.[index]
    if (!node) throw new Error('glTF-Knoten fehlt')
    active.add(index)
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3().fromArray(node.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(node.scale ?? [1, 1, 1]),
    )
    const world = parent.clone().multiply(local)
    if (node.skin !== undefined) throw new Error('Animierte Modelle bitte als statische Geometrie exportieren')
    for (const primitive of doc.meshes?.[node.mesh]?.primitives ?? []) {
      if (primitive.targets?.length) throw new Error('Morph-Geometrie bitte als statische Geometrie exportieren')
      const accessor = doc.accessors?.[primitive.attributes?.POSITION]
      const view = doc.bufferViews?.[accessor?.bufferView]
      if (!accessor || accessor.type !== 'VEC3' || accessor.componentType !== 5126 || accessor.sparse || !view) throw new Error('Nicht unterstützte glTF-Positionsdaten')
      const buffer = buffers[view.buffer]
      const stride = view.byteStride ?? 12
      const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0)
      const count = accessor.count
      if (!buffer || !Number.isSafeInteger(count) || count < 1 || count > 1_000_000 || stride < 12 || start < 0 || start + (count - 1) * stride + 12 > Math.min(buffer.length, (view.byteOffset ?? 0) + view.byteLength)) throw new Error('Ungültige glTF-Puffergrenzen')
      if (vertices.length + count > 1_000_000) throw new Error('Modell enthält zu viele Punkte (max. 1 Mio.)')
      for (let i = 0; i < count; i++) {
        const p = start + i * stride
        const vertex = new Vector3(buffer.readFloatLE(p), buffer.readFloatLE(p + 4), buffer.readFloatLE(p + 8)).applyMatrix4(world)
        if (![vertex.x, vertex.y, vertex.z].every(Number.isFinite)) throw new Error('Ungültige glTF-Koordinaten')
        vertices.push(vertex)
      }
    }
    for (const child of node.children ?? []) visit(child, world, depth + 1)
    active.delete(index)
  }
  const scene = doc.scenes?.[doc.scene ?? 0]
  if (!scene?.nodes?.length) throw new Error('glTF enthält keine Szene')
  for (const node of scene.nodes) visit(node, new Matrix4())
  return vertices
}

export function dxfPlanVertices(content: string, heightMm?: number) {
  const Parser = DxfParser as unknown as new () => { parseSync(input: string): { header?: Record<string, unknown>; entities?: any[] } | null }
  const doc = new Parser().parseSync(content)
  if (!doc) throw new Error('DXF konnte nicht gelesen werden')
  const factors: Record<number, number> = { 1: 25.4, 2: 304.8, 4: 1, 5: 10, 6: 1000 }
  const factor = factors[Number(doc.header?.$INSUNITS)]
  if (!factor) throw new Error('DXF benötigt eine eindeutige Einheit ($INSUNITS: mm, cm, m, Zoll oder Fuß)')
  if (!heightMm || heightMm <= 0) throw new Error('Für einen DXF-Grundriss bitte die Objekthöhe in mm angeben')
  const profiles = (doc.entities ?? []).filter((entity: any) => entity.type === 'LWPOLYLINE' && entity.shape)
  const planProfiles = profiles.some((entity: any) => entity.layer === 'PLAN') ? profiles.filter((entity: any) => entity.layer === 'PLAN') : profiles
  if (!planProfiles.length) throw new Error('DXF-Grundriss benötigt mindestens eine geschlossene LWPOLYLINE')
  const vertices: Vector3[] = []
  for (const profile of planProfiles as any[]) {
    if (profile.vertices.length < 3 || profile.vertices.some((v: any) => v.bulge || !Number.isFinite(v.x) || !Number.isFinite(v.y))) throw new Error('DXF: geschlossene Konturen mit geraden Kanten erforderlich')
    for (const vertex of profile.vertices) {
      vertices.push(new Vector3(vertex.x * factor, 0, -vertex.y * factor), new Vector3(vertex.x * factor, heightMm, -vertex.y * factor))
    }
  }
  return vertices
}
