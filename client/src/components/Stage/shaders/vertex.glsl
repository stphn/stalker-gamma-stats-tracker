uniform sampler2D uGpgpu;

varying vec2 vUv;
varying float vStrength;

void main() {
  vUv = uv;

  // Sample displacement strength at this vertex's UV
  float strength = texture2D(uGpgpu, uv).r;
  vStrength = strength;

  // Displace the vertex — push it toward the camera (Z axis)
  // and add a slight XY ripple so the grid visibly warps
  vec3 displaced = position;
  displaced.z += strength * 0.08;
  displaced.x += sin(uv.y * 3.14159) * strength * 0.015;
  displaced.y += sin(uv.x * 3.14159) * strength * 0.015;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
