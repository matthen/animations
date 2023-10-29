uniform vec2 u_resolution;
uniform float u_t;
uniform float u_speed;

void main() {
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 uv = gl_FragCoord.xy * pixel;
    float t = u_t * u_speed;
    vec3 color = 0.5 + 0.5 * cos(t + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(color, 1.0);
}
