import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { disposeTemplate, fitTemplateObject, parseTemplateObject } from '../editor/assetTemplateGeometry.js'
import type { AssetLibraryItem } from '../../plugins/assetLibrary/index.js'

export function AssetTemplatePreview({ file, format, dimensions, onError, onReady }: {
  file: File
  format: AssetLibraryItem['source_format']
  dimensions: AssetLibraryItem['bbox_json']
  onError: (message: string) => void
  onReady: () => void
}) {
  const mount = useRef<HTMLDivElement>(null)
  const errorCallback = useRef(onError)
  errorCallback.current = onError
  const readyCallback = useRef(onReady)
  readyCallback.current = onReady
  useEffect(() => {
    const element = mount.current
    if (!element) return
    let disposed = false
    let cleanup: (() => void) | undefined
    void file.arrayBuffer().then(data => parseTemplateObject(data, format, dimensions.height_mm)).then(source => {
      if (disposed) { disposeTemplate(source); return }
      const object = fitTemplateObject(source, dimensions)
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(element.clientWidth || 400, 210)
      element.append(renderer.domElement)
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#eef1f4')
      scene.add(object, new THREE.HemisphereLight(0xffffff, 0x777777, 2))
      const light = new THREE.DirectionalLight(0xffffff, 2)
      light.position.set(3, 5, 4)
      scene.add(light)
      const size = Math.max(dimensions.width_mm, dimensions.height_mm, dimensions.depth_mm) / 1000
      const camera = new THREE.PerspectiveCamera(40, (element.clientWidth || 400) / 210, .001, Math.max(100, size * 20))
      const target = new THREE.Vector3(0, dimensions.height_mm / 2000, 0)
      camera.position.copy(target).add(new THREE.Vector3(size * 1.6, size, size * 1.8))
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.target.copy(target)
      controls.update()
      let frame = 0
      const render = () => { if (disposed) return; renderer.render(scene, camera); frame = requestAnimationFrame(render) }
      cleanup = () => { cancelAnimationFrame(frame); controls.dispose(); disposeTemplate(object); renderer.dispose(); renderer.domElement.remove() }
      render()
      readyCallback.current()
    }).catch(error => { if (!disposed) errorCallback.current(error instanceof Error ? error.message : 'Vorschau konnte nicht geladen werden') })
    return () => { disposed = true; cleanup?.() }
  }, [file, format, dimensions])
  return <div ref={mount} aria-label="3D-Vorschau der Vorlagendatei" style={{ height: 210, width: '100%', overflow: 'hidden' }} />
}
