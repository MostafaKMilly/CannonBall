export const loadCannonTextures = (textureLoader) => {
  const cannonColorTexture = textureLoader.load("textures\\cannon\\color.jpg");
  const cannonNormalTexture = textureLoader.load(
    "textures\\cannon\\normal.jpg"
  );
  const cannonAmbientOcclusionTexture = textureLoader.load(
    "textures\\cannon\\ambientOcclusion.jpg"
  );
  const cannonRoughnessTexture = textureLoader.load(
    "textures\\cannon\\roughness.jpg"
  );
  const cannonMetalnessTexture = textureLoader.load(
    "textures\\cannon\\metalness.jpg"
  );
  return {
    cannonColorTexture,
    cannonNormalTexture,
    cannonAmbientOcclusionTexture,
    cannonRoughnessTexture,
    cannonMetalnessTexture,
  };
};
