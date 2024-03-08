uniform vec2 u_resolution;
uniform sampler2D u_tex0;
uniform float u_tt;

float hash13(vec2 uv, float t) {
    vec3 p3 = vec3(uv.x, uv.y, t);
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

void main() {
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 uv = gl_FragCoord.xy * pixel;
    float res = 256.0;
    uv = floor(uv * res) / res;

    uv *= 2.0;

    // shift the top
    uv.x -= 0.5 * floor(uv.y);

    float color = texture(u_tex0, uv).r;

    // add noise on right
    float tres = 0.01;
    float t = floor(u_tt / tres) * tres;
    float noise = hash13(vec2(uv.x, mod(uv.y, 1.0)) * u_resolution.xy, t);
    color = mix(color, color + (noise - 0.5), step(1., uv.x));
    // binarize on bottom
    color = mix(color, step(0.5, color), 1. - step(1., uv.y));

    // mask out on the top
    color = mix(color, 0., step(1.0, uv.y) * step(1.0, uv.x));
    color = mix(color, 0., step(1.0, uv.y) * step(uv.x, 0.));

    gl_FragColor = vec4(vec3(color), 1.0);

}
