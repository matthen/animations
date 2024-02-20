uniform vec2 u_resolution;
uniform float u_t;
uniform float u_theta_1;
uniform float u_theta_2;
uniform float u_update;
uniform sampler2D u_doubleBuffer0;

// Tells GlslPipeline that we are using the double buffer:
#ifdef DOUBLE_BUFFER_0
#endif

#define res 128.0
#define rate 2
#define TWOPI 6.28318530718

vec3 vertices[20] = vec3[](vec3(0, 0, 1), vec3(.58, .33, .75), vec3(0, -.67, .75), vec3(-.58, .33, .75), vec3(.36, .87, .33), vec3(.93, -.13, .33), vec3(.58, -.75, .33), vec3(-.58, -.75, .33), vec3(-.93, -.13, .33), vec3(-.36, .87, .33), vec3(.58, .75, -.33), vec3(.93, .13, -.33), vec3(.36, -.87, -.33), vec3(-.36, -.87, -.33), vec3(-.93, .13, -.33), vec3(-.58, .75, -.33), vec3(0, .67, -.75), vec3(.58, -.33, -.75), vec3(-.58, -.33, -.75), vec3(0, 0, -1));

int seg[] = int[](0, 2, 6, 5, 1  // 3 bottom
, 0, 3, 8, 7, 2, 0, 1, 4, 9, 3, 2, 7, 13, 12, 6  // 6 crown
, 8, 14, 18, 13, 7, 6, 12, 17, 11, 5, 3, 9, 15, 14, 8, 1, 5, 11, 10, 4, 4, 10, 16, 15, 9, 19, 18, 14, 15, 16  // 3 top
, 19, 17, 12, 13, 18, 19, 16, 10, 11, 17);

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float sdSegment(in vec2 p, in vec2 a, in vec2 b) {
    vec2 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
}

#define rot(a) mat2(cos(a+vec4(0,33,11,0)))

vec3 T(vec3 p) {
    p.yz *= rot(TWOPI * u_theta_1 + 0.21);
    p.zx *= rot(TWOPI * u_theta_2 + 0.77);
    return p;
}

void main() {
    // out vec4 fragColor, in vec2 fragCoord

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 uvI = floor(uv * res) / res;

    vec3 col = texture(u_doubleBuffer0, uv).rgb;

    if (u_t < 0.1) {
        col = vec3(step(0.5, hash12(u_resolution.xy * uvI)));
    }

    vec3 _P, P, P0;
    float dodecCol = 0.;
    uvI -= 0.5;
    uvI *= 2.;
    for (int i; i <= seg.length(); i++) {
        _P = P;
        P = T(vertices[seg[i % 60]]);
        // P *= exp(iFloat2);
        P /= P.z - 1.7;
        if (i > 0) {
            dodecCol += .5 * smoothstep(0.01, 0., sdSegment(uvI, _P.xy, (i % 5 > 0 ? P : P0).xy) - 0.0001);
        }
        if (i % 5 < 1) {
            P0 = P;
        }
    }
    dodecCol = step(0.5, dodecCol);

    col = mix(col, 1. - col, dodecCol * u_update);

    gl_FragColor = vec4(step(0.5, col), 1.0);
}
