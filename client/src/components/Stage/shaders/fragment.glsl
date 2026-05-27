uniform sampler2D uTexture;
uniform sampler2D uGrid;
uniform vec2 uContainerResolution;
uniform vec2 uImageResolution;

varying vec2 vUv;

vec2 coverUvs(vec2 imageRes, vec2 containerRes) {
  float imageAspectX = imageRes.x / imageRes.y;
  float imageAspectY = imageRes.y / imageRes.x;

  float containerAspectX = containerRes.x / containerRes.y;
  float containerAspectY = containerRes.y / containerRes.x;

  vec2 ratio = vec2(
    min(containerAspectX / imageAspectX, 1.0),
    min(containerAspectY / imageAspectY, 1.0)
  );

  return vec2(
    vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
    vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
  );
}

void main() {
  vec2 newUvs = coverUvs(uImageResolution, uContainerResolution);
  vec2 squareUvs = coverUvs(vec2(1.0), uContainerResolution);

  vec4 displacement = texture2D(uGrid, squareUvs);

  // Displace the UVs by the grid direction vector
  vec2 finalUvs = newUvs - displacement.rg * 0.01;

  // Asymmetric RGB shift — each channel offset by a different amount
  vec2 shift = displacement.rg * 0.001;

  float displacementStrength = length(displacement.rg);
  displacementStrength = clamp(displacementStrength, 0.0, 2.0);

  vec2 redUvs   = finalUvs + shift * (1.0 + displacementStrength * 0.25);
  vec2 greenUvs = finalUvs + shift * (1.0 + displacementStrength * 2.0);
  vec2 blueUvs  = finalUvs + shift * (1.0 + displacementStrength * 1.5);

  float r = texture2D(uTexture, redUvs).r;
  float g = texture2D(uTexture, greenUvs).g;
  float b = texture2D(uTexture, blueUvs).b;

  gl_FragColor = vec4(r, g, b, 1.0);
}
