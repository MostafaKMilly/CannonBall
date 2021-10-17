export const loadTargetTextues = (textureLoader) => {
  const targetColorTexture = textureLoader.load(
    "textures/target/Target_baseColor.png"
  );
  return {
    targetColorTexture,
  };
};
