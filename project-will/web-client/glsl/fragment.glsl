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

void main() {
    vec4 texColor = texture(u_sampler2d, vTextureCoord);
    fragColor = vec4(texColor);
}