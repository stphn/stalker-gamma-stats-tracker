uniform vec2  uMouse;       // mouse UV [0,1]
uniform float uMouseMoved;  // 1.0 when mouse is moving, 0.0 otherwise
uniform float uDeltaTime;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;

  vec4 current = texture2D(uCurrentPosition, uv);

  // Distance from this fragment to the mouse in UV space
  float dist = distance(uv, uMouse);

  // Wider influence radius — easier to see on a flat plane
  float radius    = 0.25;
  float influence = smoothstep(radius, 0.0, dist) * uMouseMoved;

  // Slower relaxation so the trail lingers a bit
  float relaxation = 2.0;
  float decay      = exp(-relaxation * uDeltaTime);

  float strength = current.r * decay + influence * (1.0 - decay);

  gl_FragColor = vec4(strength, 0.0, 0.0, 1.0);
}
