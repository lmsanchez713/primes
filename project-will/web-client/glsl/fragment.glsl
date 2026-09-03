#version 300 es

precision highp float;
precision highp int;
precision highp sampler2D;

#define MAX_LIGHTS 32

in vec2 vTextureCoord;
in vec3 vWorldPosition;
in vec3 vNormal;

layout(std140) uniform UBO {
    mat4 u_modelMatrix;
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
    vec4 u_pointLight[MAX_LIGHTS];
    vec4 u_pointLightPos[MAX_LIGHTS];
    vec4 u_ambientLight;
    vec3 u_cameraPosition;
    uint u_pointLightCount;
    float u_time;
};

uniform sampler2D u_sampler2d;

out vec4 fragColor;

void main() {
    vec4 texColor = texture(u_sampler2d, vTextureCoord);
    vec3 normal = normalize(vNormal);
    vec3 diffuseAccumulation = vec3(0.0);
    
    for (int i = 0; i < MAX_LIGHTS && i < int(u_pointLightCount); i++) {
        vec3 lightVec = u_pointLightPos[i].xyz - vWorldPosition;
        float dist = length(lightVec);
        vec3 lightDir = lightVec / dist; // Normalized direction
        
        // Lambertian diffuse factor
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Point light reach (radius) stored in u_pointLight[i].a
        float lightRadius = u_pointLight[i].a; 
        
        // Smooth range attenuation (0.0 beyond lightRadius)
        float normDist = clamp(dist / lightRadius, 0.0, 1.0);
        float attenuation = (1.0 - normDist * normDist);
        attenuation *= attenuation; // Square it for natural quadratic decay
        
        // Accumulate diffuse light
        diffuseAccumulation += u_pointLight[i].rgb * diff * attenuation;
    }
    
    // Combine ambient and diffuse lights ONCE before multiplying by texture color
    vec3 totalLighting = u_ambientLight.rgb + diffuseAccumulation;
    vec3 finalColor = totalLighting * texColor.rgb;
    
    fragColor = vec4(finalColor, texColor.a);
}