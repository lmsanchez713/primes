#version 300 es

precision highp float;
precision highp int;

layout(location = 0) in vec3 aPosition;
layout(location = 1) in vec2 aTexCoord;
layout(location = 2) in vec3 aNormal;

layout(std140) uniform UBO {
    mat4 u_modelMatrix;
    mat4 u_viewMatrix;
    mat4 u_projectionMatrix;
    vec4 u_pointLight[32];
    vec4 u_pointLightPos[32];
    vec4 u_ambientLight;
    uint u_pointLightCount;
};

out vec2 vTextureCoord;
out vec3 vWorldPosition;
out vec3 vNormal;

void main() {
    vWorldPosition = aPosition;
    vTextureCoord = aTexCoord;
    vNormal = aNormal;

    gl_Position = vec4(aPosition, 1.0);
}