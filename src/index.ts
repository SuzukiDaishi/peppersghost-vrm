import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { VRM } from '@pixiv/three-vrm'
import { mixamoClipToVRMClip } from './VRMAnimationClip'
import { PeppersGhostEffect } from 'three/examples/jsm/effects/PeppersGhostEffect.js'
import { userVRMLoadAsync } from './UserLoader'

/** アニメーションファイルのパス */
const DEFAULT_ANIMATION = './assets/xbot@Walking.fbx'

/** キャラクターファイルのパス */
const DEFAULT_CHARACTER = './assets/1903884660012638236.vrm'

let vrm: VRM // VRMファイル
let mixer: THREE.AnimationMixer // アニメーション混ぜるやつ
let action: THREE.AnimationAction // アニメーション
let effect: PeppersGhostEffect // ペッパーズゴーストにするやつ
let camera: THREE.OrthographicCamera // カメラ
let loadButton: HTMLInputElement // モデルアップロードボタン
let actionFbxAnimation: THREE.AnimationClip

// 準備ができたら実行
window.addEventListener('DOMContentLoaded', async () => {

  // レンダラー作成
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  // ユーザーVRMモデルの読み込み

  // inputボタンを定義
  loadButton = document.createElement('input')
  loadButton.accept = '.vrm'
  loadButton.innerText = '読み込み'
  loadButton.type = 'file'

  // ファイルが選択された時
  loadButton.onchange = async () => {
    if (loadButton.files !== null && loadButton.files.length>0) {

      // モデル読み込み
      scene.remove(vrm.scene)
      vrm = await userVRMLoadAsync(loadButton.files[0])
      vrm.scene.position.set(0, -0.8, 0)
      scene.add(vrm.scene)

      // アニメーション再ロード
      mixer = new THREE.AnimationMixer(vrm.scene)
      const actionClip = mixamoClipToVRMClip(actionFbxAnimation, vrm, false)
      actionClip.name = 'action'
      action = mixer.clipAction(actionClip).setEffectiveWeight(1.0)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.clampWhenFinished = true
      action.play()

    }
  }
  
  // 画面が押された場合inputボタンをクリック
  renderer.domElement.onclick = () => loadButton.click()

  // シーン作成
  const scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(
    window.innerWidth / -2, 
    window.innerWidth / 2, 
    window.innerHeight / 2, 
    window.innerHeight / -2,
    0.1, 
    1000
  )

  // 光源作成
  const light = new THREE.DirectionalLight(0xffffff)
  light.position.set(1, 1, 1).normalize()
  scene.add(light)

  // キャラクター読み込み
  const gltfLoader = new GLTFLoader()
  const gltf = await gltfLoader.loadAsync(DEFAULT_CHARACTER)
  vrm = await VRM.from(gltf)
  vrm.scene.position.set(0, -0.8, 0)
  scene.add(vrm.scene)
  
  // アニメーション読み込み
  mixer = new THREE.AnimationMixer(vrm.scene)
  const fbxLoader = new FBXLoader()
  const actionFbx = await fbxLoader.loadAsync(DEFAULT_ANIMATION)
  actionFbxAnimation = actionFbx.animations[0]
  const actionClip = mixamoClipToVRMClip(actionFbx.animations[0], vrm, false)
  actionClip.name = 'action'
  action = mixer.clipAction(actionClip).setEffectiveWeight(1.0)
  action.setLoop(THREE.LoopRepeat, Infinity)
  action.clampWhenFinished = true
  action.play()

  // ペッパーズゴーストエフェクト作成
  effect = new PeppersGhostEffect(renderer)
  effect.setSize(window.innerWidth, window.innerHeight)
  effect.cameraDistance = 2

  // メインループ
  let lastTime = new Date().getTime()
  const tick = () => {

    // キャラクター回転
    vrm.scene.rotation.y += 0.01
    
    // アニメーション
    const time = new Date().getTime()
    mixer.update(time - lastTime)
    lastTime = time

    // レンダリング
    effect.render(scene, camera)

    // フレーム更新
    window.requestAnimationFrame(tick)
  }
  tick()

})
