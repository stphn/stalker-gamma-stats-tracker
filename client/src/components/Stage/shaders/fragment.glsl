uniform sampler2D uTexture;
uniform sampler2D uGpgpu;
uniform vec2 uResolution;   // canvas size in px
uniform vec2 uImageSize;    // original image natural size in px
uniform float uTime;

varying vec2 vUv;

// background-size: cover equivalent
vec2 coverUvs(vec2 uv, vec2 resolution, vec2 imageSize) {
  float aspectCanvas = resolution.x / resolution.y;
  float aspectImage  = imageSize.x  / imageSize.y;

  vec2 scale;
  if (aspectCanvas > aspectImage) {
    scale = vec2(1.0, aspectImage / aspectCanvas);
  } else {
    scale = vec2(aspectCanvas / aspectImage, 1.0);
  }

  return (uv - 0.5) * scale + 0.5;
}

// Luminance weights (Rec. 709)
float luma(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
  vec2 uv = coverUvs(vUv, uResolution, uImageSize);

  // Sample GPGPU displacement strength
  float strength = texture2D(uGpgpu, vUv).r;

  // RGB chromatic aberration split — stronger when displaced
  float split = strength * 0.06;

  vec4 rSample = texture2D(uTexture, vec2(uv.x + split,        uv.y));
  vec4 gSample = texture2D(uTexture, uv);
  vec4 bSample = texture2D(uTexture, vec2(uv.x - split,        uv.y));

  // Desaturate each channel independently, then reassemble
  // This keeps the RGB split visible as a luminance fringe rather
  // than a colour fringe that blends into the photo
  float rL = luma(rSample.rgb);
  float gL = luma(gSample.rgb);
  float bL = luma(bSample.rgb);

  // Blend: mostly greyscale, a touch of original colour for depth
  float tint = 0.12; // 0 = full B&W, 1 = full colour
  vec3 color = mix(
    vec3(rL, gL, bL),
    vec3(rSample.r, gSample.g, bSample.b),
    tint
  );

  // Slight brightness lift
  color *= 1.2;

  gl_FragColor = vec4(color, 1.0);
}
