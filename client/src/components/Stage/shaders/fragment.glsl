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

void main() {
  vec2 uv = coverUvs(vUv, uResolution, uImageSize);

  // Sample GPGPU displacement — r = strength, g = direction hint
  vec4 gpgpu    = texture2D(uGpgpu, vUv);
  float strength = gpgpu.r;

  // RGB chromatic aberration split proportional to displacement strength
  float split = strength * 0.025;

  vec4 rChannel = texture2D(uTexture, vec2(uv.x + split, uv.y));
  vec4 gChannel = texture2D(uTexture, uv);
  vec4 bChannel = texture2D(uTexture, vec2(uv.x - split, uv.y));

  gl_FragColor = vec4(rChannel.r, gChannel.g, bChannel.b, 1.0);
}
