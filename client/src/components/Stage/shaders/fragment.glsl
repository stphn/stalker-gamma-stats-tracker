uniform sampler2D uTexture;
uniform sampler2D uNextTexture;
uniform float uTransition;
uniform float uTime;
uniform sampler2D uGrid;
uniform vec2 uContainerResolution;
uniform vec2 uImageResolution;
uniform vec2 uNextImageResolution;

varying vec2 vUv;

float hash11(float p) {
  return fract(sin(p * 12.9898) * 43758.5453);
}

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

// Sample one backdrop with the shared fluid displacement, glitch tear + RGB shift.
vec3 sampleImage(sampler2D tex, vec2 imageRes, vec2 dispRG, vec2 shift, float strength, vec2 glitch) {
  vec2 newUvs = coverUvs(imageRes, uContainerResolution);
  vec2 finalUvs = newUvs - dispRG * 0.01 + glitch;

  vec2 redUvs   = finalUvs + shift * (1.0 + strength * 0.25);
  vec2 greenUvs = finalUvs + shift * (1.0 + strength * 2.0);
  vec2 blueUvs  = finalUvs + shift * (1.0 + strength * 1.5);

  return vec3(
    texture2D(tex, redUvs).r,
    texture2D(tex, greenUvs).g,
    texture2D(tex, blueUvs).b
  );
}

void main() {
  vec2 squareUvs = coverUvs(vec2(1.0), uContainerResolution);
  vec4 displacement = texture2D(uGrid, squareUvs);

  vec2 shift = displacement.rg * 0.001;
  float displacementStrength = clamp(length(displacement.rg), 0.0, 2.0);

  // ── Analog tape tear — per-row horizontal displacement (à la the CodePen) ──
  float rows = 36.0;
  float row = floor(vUv.y * rows);
  float frame = floor(uTime * 14.0);            // ~14 glitch updates / sec
  float jitter = hash11(row * 1.7 + frame * 3.1) - 0.5;
  float burst = step(0.955, hash11(frame * 0.137)); // occasional bigger tear
  float gx = jitter * (0.0016 + burst * 0.055);
  vec2 glitch = vec2(gx, 0.0);

  // Chromatic split widens during a tear burst
  shift *= 1.0 + burst * 6.0;

  vec3 colorA = sampleImage(uTexture, uImageResolution, displacement.rg, shift, displacementStrength, glitch);
  vec3 colorB = sampleImage(uNextTexture, uNextImageResolution, displacement.rg, shift, displacementStrength, glitch);

  // Crossfade between the outgoing and incoming backdrop
  vec3 color = mix(colorA, colorB, uTransition);

  // Gamma correction — linear → sRGB so WebGL matches CSS background-image rendering
  color = pow(color, vec3(1.0 / 2.2));

  gl_FragColor = vec4(color, 1.0);
}
