#version 300 es

precision highp float;
precision highp int;

in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;
in vec4 aTangent;

// Uniform buffer object for scene data
layout(std140) uniform SceneUBO {
    mat4 u_modelMatrix;
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
    int u_lightsCount;
    int u_lightTypes[4];
    vec3 u_lightColors[4];
    vec3 u_lightPositions[4];
    vec3 u_lightDirections[4];
    vec4 u_uvTransform;
};

out vec2 vTextureCoord;
out vec3 vWorldPosition;
out vec3 vNormal;
out mat3 vTBN;

void main() {
    vec4 worldPos = u_modelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPos.xyz;
    vTextureCoord = aTexCoord;
    
    mat3 normalMatrix = mat3(u_modelMatrix);
    vec3 N = normalize(normalMatrix * aNormal);
    vec3 T_raw = normalize(normalMatrix * aTangent.xyz);
    vec3 T = normalize(T_raw - dot(T_raw, N) * N);
    vec3 B = cross(N, T) * aTangent.w;
    
    vNormal = N;
    vTBN = mat3(T, B, N);

    //gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
    gl_Position = vec4(aPosition, 1.0);
}