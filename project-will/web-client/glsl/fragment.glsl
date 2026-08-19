#version 300 es

precision highp float;
precision highp int;

in vec2 vTextureCoord;
in vec3 vWorldPosition;
in vec3 vNormal;

layout(std140) uniform SceneUBO {
    vec4 u_rgbaColor;
};

out vec4 fragColor;

void main() {
    fragColor = vec4(1.0, 1.0, 1.0, 1.0);
}