export const loadBallTextures = (textureLoader) => {
  const stealColor = textureLoader.load("textures\\ball\\steal\\color.jpg");
  const stealNormal = textureLoader.load("textures\\ball\\steal\\normal.jpg");
  const stealAmbientOcclusionTexture = textureLoader.load(
    "textures\\ball\\steal\\ambientOcclusion.jpg"
  );
  const stealRoughnessTexture = textureLoader.load(
    "textures\\ball\\steal\\roughness.jpg"
  );
  const stealMetalnessTexture = textureLoader.load(
    "textures\\ball\\steal\\metalness.jpg"
  );

  const woodColor = textureLoader.load("textures\\ball\\wood\\color.jpg");
  const woodNormal = textureLoader.load("textures\\ball\\wood\\normal.jpg");
  const woodAmbientOcclusionTexture = textureLoader.load(
    "textures\\ball\\wood\\ambientOcclusion.jpg"
  );
  const woodRoughnessTexture = textureLoader.load(
    "textures\\ball\\wood\\roughness.jpg"
  );

  const rubberColor = textureLoader.load("textures\\ball\\rubber\\color.jpg");
  const rubberNormal = textureLoader.load("textures\\ball\\rubber\\normal.jpg");
  const rubberAmbientOcclusionTexture = textureLoader.load(
    "textures\\ball\\rubber\\ambientOcclusion.jpg"
  );
  const rubberRoughnessTexture = textureLoader.load(
    "textures\\ball\\rubber\\roughness.jpg"
  );

  return [
    {
      color: stealColor,
      normal: stealNormal,
      ao: stealAmbientOcclusionTexture,
      roughness: stealRoughnessTexture,
      metalness: stealMetalnessTexture,
    },
    {
      color: woodColor,
      normal: woodNormal,
      ao: woodAmbientOcclusionTexture,
      roughness: woodRoughnessTexture,
    },
    {
      color: rubberColor,
      normal: rubberNormal,
      ao: rubberAmbientOcclusionTexture,
      roughness: rubberRoughnessTexture,
    },
  ];
};
