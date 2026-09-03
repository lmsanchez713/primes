#version 300 es

precision highp float;
precision highp int;

#define MAX_LIGHTS 32

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;

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

out vec2 vTextureCoord;
out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
    vec4 worldPosition = u_modelMatrix * vec4(aPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    vTextureCoord = aTexCoord;
    vNormal = aNormal;

    gl_Position = u_projectionMatrix * u_viewMatrix * worldPosition;
}