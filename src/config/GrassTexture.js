import * as THREE from 'three'

const loadGrassTextures = (textureLoader) => {
const grassTextures = {}
const grassColorTexture = textureLoader.load('textures\\grass\\7\\color.png')
const grassMetalnessTexture = textureLoader.load('textures\\grass\\7\\metalness.png')
const grassAmbientOcclusionTexture = textureLoader.load('textures\\grass\\7\\ambientOcclusion.png')
const grassNormalTexture = textureLoader.load('textures\\grass\\7\\normal.png')
const grassRoughnessTexture = textureLoader.load('textures\\grass\\7\\roughness.png')
const grassHeightTexture = textureLoader.load('textures\\grass\\7\\height.png')


grassColorTexture.repeat.set(25, 25)
grassAmbientOcclusionTexture.repeat.set(25, 25)
grassNormalTexture.repeat.set(25, 25)
grassRoughnessTexture.repeat.set(25, 25)
grassHeightTexture.repeat.set(25, 25)
grassMetalnessTexture.repeat.set(25, 25)


grassColorTexture.wrapS = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapS = THREE.RepeatWrapping
grassNormalTexture.wrapS = THREE.RepeatWrapping
grassRoughnessTexture.wrapS = THREE.RepeatWrapping
grassHeightTexture.wrapS = THREE.RepeatWrapping
grassMetalnessTexture.wrapS = THREE.RepeatWrapping

grassColorTexture.wrapT = THREE.RepeatWrapping
grassAmbientOcclusionTexture.wrapT = THREE.RepeatWrapping
grassNormalTexture.wrapT = THREE.RepeatWrapping
grassRoughnessTexture.wrapT = THREE.RepeatWrapping
grassHeightTexture.wrapT = THREE.RepeatWrapping
grassMetalnessTexture.wrapT = THREE.RepeatWrapping

grassTextures.grassColorTexture = grassColorTexture
grassTextures.grassAmbientOcclusionTexture = grassAmbientOcclusionTexture
grassTextures.grassNormalTexture = grassNormalTexture
grassTextures.grassRoughnessTexture = grassRoughnessTexture
grassTextures.grassHeightTexture = grassHeightTexture
grassTextures.grassMetalnessTexture = grassMetalnessTexture

return grassTextures
}
export default loadGrassTextures;