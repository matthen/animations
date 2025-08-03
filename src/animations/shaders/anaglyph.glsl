uniform float u_redness;
uniform float u_noiseAmount;
uniform float u_contrast;
uniform float u_messageStrength;


uniform vec2 u_resolution;
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

float butterflyShapeDist(vec2 uv) {
    uv -= 0.5;
    uv *= rotationMatrix(0.3);
    uv *= 3.;
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
    int x = int(floor(uv.x * res) + 20. * sin(rowIndex * 2.) + 100.0) % 42;

    float butterflyText = texelFetch(u_tex0, ivec2(x, y), 0).r;

    vec2 uvI = floor(uv * res) / res;

    float message = 0.;

    // Add the text
    message = mix(message, 1.0, smoothstep(0., pixel.x, 1. - butterflyText));

    // Add outside of butterfly
    message = mix(message, 1.0, smoothstep(0., pixel.x, butterflyShapeDist(uvI)));

    // Subtract inside of butterfly
    message = mix(0.0, message, smoothstep(0., pixel.x, 1.6 - butterflyShapeDist(uvI)));

    // Add noise
    message = message + u_noiseAmount * hash12(uvI * u_resolution.xy);
    message /= (1.0 + u_noiseAmount);

    message = u_messageStrength * message;
    message = 1. - message;

    // Message is now 0 for butterfly and text, 1 for outside.

    // Start as noise
    vec3 colorMoreRed = hash32(uvI * u_resolution.xy);
    colorMoreRed.r = max(colorMoreRed.r, 0.5 + 0.5 * u_contrast);
    
    vec3 colorLessRed = hash32(uvI * u_resolution.xy);
    colorLessRed.r = min(colorLessRed.r, 0.5 - 0.5 * u_contrast);

    // combine random color with the message.
    vec3 color = mix(
        colorMoreRed,
        colorLessRed,
        message    
    );


    color = mix(color, vec3(1.0, 0, 0) * color, u_redness);

    color.g *= 0.5;  // Reduce green.
   

    gl_FragColor = vec4(color, 1.0);

}
