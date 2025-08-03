uniform vec2 u_resolution;
uniform float u_t;
{{UNIFORM_DECLARATIONS}}

void main() {
    vec2 pixel = 1.0 / u_resolution.xy;
    vec2 uv = gl_FragCoord.xy * pixel;
    
    // TODO: Implement your shader logic here
    // Available uniforms: u_t (time){{UNIFORM_COMMENTS}}
    
    vec3 color = 0.5 + 0.5 * cos(u_t + uv.xyx + vec3(0, 2, 4));
    gl_FragColor = vec4(color, 1.0);
}