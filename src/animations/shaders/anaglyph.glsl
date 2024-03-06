uniform vec2 u_resolution;
uniform float u_redness;
uniform sampler2D u_tex0;

mat2 rotationMatrix(float angle) {
    float sine = sin(angle), cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
}

vec3 hash32(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float dist(vec2 uv) {
    uv -= 0.5;
    uv *= rotationMatrix(0.3);
    uv *= 2.;
    uv += vec2(0.2, 0.3);
    uv.x = max(uv.x, -uv.x);
    vec2 p = uv * 20.0;
    float r = length(p);
    float t = atan(p.y, p.x);
    float butterfly = 7. - 0.5 * sin(1. * t) + 2.5 * sin(3. * t) + 2.0 * sin(5. * t) - 1.7 * sin(7. * t) + 3.0 * cos(2. * t) - 2.0 * cos(4. * t) - 0.4 * cos(16. * t) - r;
    return butterfly;
}

void main() {
    vec2 pixel = 1.0 / u_resolution.xy;

    vec2 uv = gl_FragCoord.xy * pixel;

    float res = 100.0;

    // butterfly text texture is 42 by 7
    int y = int(floor(uv.y * res)) % 7;
    float rowIndex = floor(uv.y * res / 7.0);
    int x = int(floor(uv.x * res) + 10. * sin(rowIndex * 0.5) + 100.0) % 42;

    float butterflyText = texelFetch(u_tex0, ivec2(x, y), 0).r;
    // uvI = uv;

    vec2 uvI = floor(uv * res) / res;

    // Start as noise
    vec3 color = hash32(uvI * u_resolution.xy);

    float message = 0.;

    message = mix(message, 0.9, smoothstep(0., pixel.x, 1. - butterflyText));
    message = mix(message, 0.7, smoothstep(0., pixel.x, dist(uvI)));
    message = mix(0.1, message, smoothstep(0., pixel.x, 2. - dist(uvI)));
    message = mix(message, 0.8, smoothstep(0.0, 1.5, hash12(uvI * u_resolution.xy)));

    message = 1. - 0.6 * message;

    // combine random color with the message.
    color.r = mix(clamp(color.r, 0.7, 1.0), 0.2 * color.r, message);
    color = mix(color, vec3(1.0, 0, 0) * color, u_redness);
    color.g *= 0.5;

    // color = vec3(message);
    gl_FragColor = vec4(color, 1.0);

}
