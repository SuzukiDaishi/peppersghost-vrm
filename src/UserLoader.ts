import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { VRM } from '@pixiv/three-vrm'

async function userGLTFLoadAsync(
  userGLTFFile: File,
  manager: THREE.LoadingManager = new THREE.LoadingManager(),
  fileReader: FileReader = new FileReader()
) {
  fileReader.readAsArrayBuffer(userGLTFFile)
  const fileURL = URL.createObjectURL(userGLTFFile)
  manager.setURLModifier((url)=>url)
  const gltfLoader = new GLTFLoader(manager)
  return await gltfLoader.loadAsync(fileURL)
}

async function userVRMLoadAsync(
  userVRMFile: File,
  manager: THREE.LoadingManager = new THREE.LoadingManager(),
  fileReader: FileReader = new FileReader()
) {
  const gltf = await userGLTFLoadAsync(userVRMFile, manager, fileReader)
  return await VRM.from(gltf)
}

export {
  userGLTFLoadAsync,
  userVRMLoadAsync,
}