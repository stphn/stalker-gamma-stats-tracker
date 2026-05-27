uniform sampler2D uTexture;
uniform sampler2D uGpgpu;
uniform vec2 uResolution;   // canvas size in px
uniform vec2 uImageSize;    // original image natural size in px
uniform float uTime;

varying vec2 vUv;
varying float vStrength;

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

  // RGB chromatic aberration split driven by vertex displacement strength
  float split = vStrength * 0.06;

  vec4 rSample = texture2D(uTexture, vec2(uv.x + split, uv.y));
  vec4 gSample = texture2D(uTexture, uv);
  vec4 bSample = texture2D(uTexture, vec2(uv.x - split, uv.y));

  // Desaturate, blend back a touch of colour
  float rL = luma(rSample.rgb);
  float gL = luma(gSample.rgb);
  float bL = luma(bSample.rgb);

  float tint = 0.12;
  vec3 color = mix(
    vec3(rL, gL, bL),
    vec3(rSample.r, gSample.g, bSample.b),
    tint
  );

  color *= 1.2;

  gl_FragColor = vec4(color, 1.0);
}
