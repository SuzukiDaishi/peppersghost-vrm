import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { VRM } from '@pixiv/three-vrm'
import { mixamoClipToVRMClip } from './VRMAnimationClip'
import { PeppersGhostEffect } from 'three/examples/jsm/effects/PeppersGhostEffect.js'

let vrm: VRM
let mixer: THREE.AnimationMixer
let walk: THREE.AnimationAction
let effect: PeppersGhostEffect

window.addEventListener('DOMContentLoaded', async () => {

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
  )

  const cameraContainer = new THREE.Object3D()
  cameraContainer.add(camera)
  cameraContainer.position.set(0, 0, 0)
  scene.add(cameraContainer)

  const light = new THREE.DirectionalLight(0xffffff)
  light.position.set(1, 1, 1).normalize()
  scene.add(light)

  const gltfLoader = new GLTFLoader()
  const gltf = await gltfLoader.loadAsync('./assets/1903884660012638236.vrm')
  vrm = await VRM.from(gltf)
  vrm.scene.position.set(0, -0.8, 0)
  scene.add(vrm.scene)

  effect = new PeppersGhostEffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );
  effect.cameraDistance = 2;

  mixer = new THREE.AnimationMixer(vrm.scene)
  const fbxLoader = new FBXLoader()
  const walkFbx = await fbxLoader.loadAsync('./assets/walking.fbx')
  const walkClip = mixamoClipToVRMClip(walkFbx.animations[0], vrm, false)
  walkClip.name = 'walk'
  walk = mixer.clipAction(walkClip).setEffectiveWeight(1.0)
  walk.setLoop(THREE.LoopRepeat, Infinity);
  walk.clampWhenFinished = true

  walk.play()

  let lastTime = new Date().getTime()
  const tick = (): void => {
    effect.render(scene, camera)

    vrm.scene.rotation.y += 0.01

    let time = new Date().getTime()
    mixer.update(time - lastTime)
    lastTime = time

    requestAnimationFrame(tick)
  }
  tick()
})
