#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

in vec2 vTextureCoord;
in vec3 vWorldPosition;
in vec3 vNormal;

layout(std140) uniform UBO {
    mat4 u_modelMatrix;
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
    vec4 u_ambientLight;
    vec4 u_pointLight[32];
    vec4 u_pointLightPos[32];
    uint u_pointLightCount;
    float u_time;
};

uniform sampler2D u_sampler2d;

out vec4 fragColor;

// Hash and noise functions for procedural generation
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 233.53));
    p += dot(p, p + 23.14);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion (fBm) for plasma granulation
float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
        value += amp * noise(p);
        p *= 2.0;
        amp *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = vTextureCoord * 4.0;
    float f_time = u_time * 5.0;

    // Animate noise layers over time to simulate boiling/convection
    vec2 shift = vec2(f_time * 0.1, f_time * -0.05);
    float n1 = fbm(uv + shift);
    float n2 = fbm(uv * 2.0 - shift);
    
    float plasma = n1 * n2 * 2.5;
    
    // Map intensity to a fiery star color ramp
    vec3 deepCore = vec3(0.8, 0.1, 0.0);   // Dark red-orange
    vec3 midSurface = vec3(1.0, 0.5, 0.0); // Bright orange
    vec3 hotFlare  = vec3(1.0, 0.9, 0.5);  // Yellow-white hot spots
    
    vec3 finalColor = mix(deepCore, midSurface, clamp(plasma, 0.0, 1.0));
    finalColor = mix(finalColor, hotFlare, smoothstep(0.7, 1.2, plasma));
    
    // Add extra self-illumination / HDR boost
    finalColor *= 1.8;
    
    //float time_test = (sin(f_time) + 1.0) / 2.0;
    fragColor = vec4(finalColor, 1.0);
    //fragColor = vec4(time_test, time_test, time_test, 1.0);

//void main() {
//    //vec4 texColor = texture(u_sampler2d, vTextureCoord);
//    //fragColor = vec4(texColor);
//    //fragColor = vec4(vTextureCoord.x, vTextureCoord.y, u_rgbaColor.y, 1.0);
//    //float c = step(abs(vWorldPosition.x) + abs(vWorldPosition.y), 0.5);
//    //fragColor = vec4(c, 0.0, 0.0, 1.0);
    //float pct = length(vWorldPosition.xy);

    // 4. Create a smooth edge (Radius: 0.25, Smoothness: 0.005)
    //float radius = 0.25;
    //float alpha = 1.0 - smoothstep(radius, radius + 0.005, pct);
//
//    // 5. Output white circle on black background
    //fragColor = vec4(finalColor * vec3(alpha), 1.0);
}