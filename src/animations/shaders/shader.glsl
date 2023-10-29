uniform sampler2D u_doubleBuffer0;

uniform vec2 u_resolution;
uniform float u_t;
uniform float u_speed;

vec3 hue(float x, float r) {
    vec3 v = abs(mod(x + vec3(0.0, 1.0, 2.0) * r, 1.0) * 2.0 - 1.0);
    return v * v * (3.0 - 2.0 * v);
}

vec3 hue(float x) {
    return hue(x, 0.33333);
}

float aastep(float threshold, float value) {
    float afwidth = 0.7 * length(vec2(dFdx(value), dFdy(value)));
    return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

float circleSDF(in vec2 v) {
    v -= 0.5;
    return length(v) * 2.0;
}

float fill(float x, float size) {
    return 1.0 - aastep(size, x);
}

float circle(vec2 st, float size) {
    return fill(circleSDF(st), size);
}

void main() {
    vec3 color = vec3(0.0);
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 st = gl_FragCoord.xy * pixel;

    float t = u_t * u_speed;

#ifdef DOUBLE_BUFFER_0
    color = texture2D(u_doubleBuffer0, st).rgb * 0.998;

    vec2 sst = st;
    sst.xy += vec2(cos(t * 2.0), sin(t * 1.7)) * 0.35;
    color.rgb += hue(fract(t * 0.1)) * circle(sst, 0.1) * 0.05;

#else
    color += texture2D(u_doubleBuffer0, st).rgb;

#endif

    gl_FragColor = vec4(color, 1.0);
}
