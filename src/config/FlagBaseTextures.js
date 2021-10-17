export const loadFlagBaseTextures = (textureLoader) => {
  const flagBaseColorTexture = textureLoader.load(
    "textures\\flagBase\\color.jpg"
  );
  const flagBaseNormalTexture = textureLoader.load(
    "textures\\flagBase\\normal.jpg"
  );
  const flagBaseAmbientOcclusionTexture = textureLoader.load(
    "textures\\flagBase\\ambientOcclusion.jpg"
  );
  const flagBaseRoughnessTexture = textureLoader.load(
    "textures\\flagBase\\roughness.jpg"
  );
  return {
    flagBaseColorTexture,
    flagBaseNormalTexture,
    flagBaseAmbientOcclusionTexture,
    flagBaseRoughnessTexture,
  };
};
