import * as THREE from 'three'
import { VRM, VRMSchema } from '@pixiv/three-vrm'

const BONE_NAME_LIST: VRMSchema.HumanoidBoneName[] = [
  VRMSchema.HumanoidBoneName.Head,
  VRMSchema.HumanoidBoneName.Neck,
  VRMSchema.HumanoidBoneName.Chest,
  VRMSchema.HumanoidBoneName.Spine,
  VRMSchema.HumanoidBoneName.Hips,
  VRMSchema.HumanoidBoneName.RightShoulder,
  VRMSchema.HumanoidBoneName.RightUpperArm,
  VRMSchema.HumanoidBoneName.RightLowerArm,
  VRMSchema.HumanoidBoneName.RightHand,
  VRMSchema.HumanoidBoneName.LeftShoulder,
  VRMSchema.HumanoidBoneName.LeftUpperArm,
  VRMSchema.HumanoidBoneName.LeftLowerArm,
  VRMSchema.HumanoidBoneName.LeftHand,
  VRMSchema.HumanoidBoneName.RightUpperLeg,
  VRMSchema.HumanoidBoneName.RightLowerLeg,
  VRMSchema.HumanoidBoneName.RightFoot,
  VRMSchema.HumanoidBoneName.LeftUpperLeg,
  VRMSchema.HumanoidBoneName.LeftLowerLeg,
  VRMSchema.HumanoidBoneName.LeftFoot,
]

const MIXAMO_ID_LIST: string[] = [
  'mixamorigHead',
  'mixamorigNeck',
  'mixamorigSpine2',
  'mixamorigSpine',
  'mixamorigHips',
  'mixamorigRightShoulder',
  'mixamorigRightArm',
  'mixamorigRightForeArm',
  'mixamorigRightHand',
  'mixamorigLeftShoulder',
  'mixamorigLeftArm',
  'mixamorigLeftForeArm',
  'mixamorigLeftHand',
  'mixamorigRightUpLeg',
  'mixamorigRightLeg',
  'mixamorigRightFoot',
  'mixamorigLeftUpLeg',
  'mixamorigLeftLeg',
  'mixamorigLeftFoot',
]

const BVHWEBVIEWR_ID_LIST: string[] = [
  'head',
  'neck',
  'chest',
  'abdomen',
  'hip',
  'rCollar',
  'rShldr',
  'rForeArm',
  'rHand',
  'lCollar',
  'lShldr',
  'lForeArm',
  'lHand',
  'rButtock',
  'rShin',
  'rFoot',
  'lButtock',
  'lShin',
  'lFoot',
]

const TDPT_ID_LIST: string[] = [
  'Head',
  'Neck',
  'Chest',
  'Spine',
  'Hips',
  'RightShoulder',
  'RightUpperArm',
  'RightLowerArm',
  'RightHand',
  'LeftShoulder',
  'LeftUpperArm',
  'LeftLowerArm',
  'LeftHand',
  'RightUpperLeg',
  'RightLowerLeg',
  'RightFoot',
  'LeftUpperLeg',
  'LeftLowerLeg',
  'LeftFoot',
]

function findTrack(name: string, tracks: THREE.KeyframeTrack[]): THREE.KeyframeTrack | null {
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].name == name) return tracks[i]
  }
  return null
}

function values2quaternion(values: Float32Array, i: number): THREE.Quaternion {
  return new THREE.Quaternion(
    values[i * 4],
    values[i * 4 + 1],
    values[i * 4 + 2],
    values[i * 4 + 3]
  )
}

function createKeys(id: string, tracks: THREE.KeyframeTrack[], isRootMotion: boolean = true) {
  const posTrack = findTrack(`.bones[${id}].position`, tracks)
  const rotTrack = findTrack(`.bones[${id}].quaternion`, tracks)

  if (!posTrack) return
  if (!rotTrack) return

  const keys = []
  const rate = 0.008
  for (let i = 0; i < posTrack.times.length; i++) {
    const key: {[name: string]: number | [number, number, number] | [number, number, number, number]} = {}

    key['time'] = parseInt(`${posTrack.times[i] * 1000}`);
    
    if (id == 'rButtock' || id == 'lButtock') {
      const id2 = id == 'rButtock' ? 'rThigh' : 'lThigh'
      let q1 = values2quaternion(rotTrack.values, i)
      const rotTrack2 = findTrack(`.bones[${id2}].quaternion`, tracks)
      if (!rotTrack2) return
      q1.multiply(values2quaternion(rotTrack2.values, i))
      key['rot'] = [-q1.x, q1.y, -q1.z, q1.w]
    } else {
      key['rot'] = [
        -rotTrack.values[i * 4],
        rotTrack.values[i * 4 + 1],
        -rotTrack.values[i * 4 + 2],
        rotTrack.values[i * 4 + 3],
      ]
    }

    if ( (id == 'hip' || id == 'Hips') && isRootMotion ) {
      key['pos'] = [
        -posTrack.values[i * 3] * rate,
        posTrack.values[i * 3 + 1] * rate,
        -posTrack.values[i * 3 + 2] * rate,
      ]
    }

    keys.push(key)
  }
  if (keys.length == 0) return null
  return keys
}

enum BVHFormt {
  BvhWebViewr,
  Tdpt,
}
 
function createClip(clip: THREE.AnimationClip, vrm: VRM, isRootMotion: boolean = true, bvhFormat: BVHFormt = BVHFormt.Tdpt) {
  let idList: string[]

  switch (bvhFormat) {
    case BVHFormt.BvhWebViewr:
      idList = BVHWEBVIEWR_ID_LIST
      break
    case BVHFormt.Tdpt:
      idList = TDPT_ID_LIST
      break
  }
  
  const bones = BONE_NAME_LIST.map((boneName) => {
    return vrm.humanoid!.getBoneNode(boneName)
  })
  .filter((item): item is NonNullable<typeof item> => item != null)
  .map(v => v as THREE.Bone)

  const hierarchy = []
  for (let i = 0; i < idList.length; i++) {
    const keys = createKeys(idList[i], clip.tracks, isRootMotion)
    if (keys != null) {
      hierarchy.push({ keys: keys })
    }
  }

  const resClip = THREE.AnimationClip.parseAnimation(
    { hierarchy: hierarchy },
    bones
  )


  resClip.tracks.some((track) => {
    track.name = track.name.replace(
      /^\.bones\[([^\]]+)\].(position|quaternion|scale)$/,
      '$1.$2'
    )
  })

  return resClip
}

function mixamoClipToVRMClip(clip: THREE.AnimationClip, vrm: VRM, isRootMotion: boolean = true): THREE.AnimationClip {
  let tracks = clip.tracks
  const bones = BONE_NAME_LIST.map((boneName) => {
    return vrm.humanoid!.getBoneNode(boneName)! as THREE.Bone
  })
  const hierarchy = []
  for (let id of MIXAMO_ID_LIST) {
    const posTrack = findTrack(`${id}.position`, tracks)
    const rotTrack = findTrack(`${id}.quaternion`, tracks)
    const keys = []
    const rate = 0.008
    if (rotTrack !== null) {
      for (let i=0; i<rotTrack.times.length; i++) {
        const key: {[name: string]: number | [number, number, number] | [number, number, number, number]} = {}
        key['time'] = parseInt(`${rotTrack.times[i] * 1000}`)
        key['rot'] = [
          -rotTrack.values[i * 4],
          rotTrack.values[i * 4 + 1],
          -rotTrack.values[i * 4 + 2],
          rotTrack.values[i * 4 + 3],
        ]
        if ('mixamorigHips' === id && posTrack !== null && isRootMotion) {
          key['pos'] = [
            -posTrack.values[i * 3] * rate,
            posTrack.values[i * 3 + 1] * rate,
            -posTrack.values[i * 3 + 2] * rate,
          ]
        }
        keys.push(key)
      }
    }
    if (keys.length > 0) {
      hierarchy.push({keys: keys})
    }
  }
  let resClip = THREE.AnimationClip.parseAnimation({ hierarchy: hierarchy }, bones)
  resClip.tracks.some((track) => {
    track.name = track.name.replace(
      /^\.bones\[([^\]]+)\].(position|quaternion|scale)$/,
      '$1.$2'
    )
  })
  return resClip
}

function bvhWebViewrClipToVRMClip(clip: THREE.AnimationClip, vrm: VRM, isRootMotion: boolean = true): THREE.AnimationClip {
  return createClip(clip, vrm, isRootMotion, BVHFormt.BvhWebViewr)
}

function tdptClipToVRMClip(clip: THREE.AnimationClip, vrm: VRM, isRootMotion: boolean = true): THREE.AnimationClip {
  return createClip(clip, vrm, isRootMotion, BVHFormt.Tdpt)
}

export {
  mixamoClipToVRMClip,
  bvhWebViewrClipToVRMClip,
  tdptClipToVRMClip,
}