export const loadBaseTextures = (textureLoader) => {
  const baseColorTexture = textureLoader.load("textures\\base\\color.jpg");
  const baseNormalTexture = textureLoader.load("textures\\base\\normal.jpg");
  const baseAmbientOcclusionTexture = textureLoader.load(
    "textures\\base\\ambientOcclusion.jpg"
  );
  const baseRoughnessTexture = textureLoader.load(
    "textures\\base\\roughness.jpg"
  );
  const baseMetalnessTexture = textureLoader.load(
    "textures\\base\\metalness.jpg"
  );
  return {
    baseColorTexture,
    baseNormalTexture,
    baseAmbientOcclusionTexture,
    baseRoughnessTexture,
    baseMetalnessTexture,
  };
};
