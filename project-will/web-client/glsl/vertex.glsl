#version 300 es

precision highp float;
precision highp int;

in vec3 aPosition;
in vec2 aTexCoord;
in vec3 aNormal;
in vec4 aTangent;

layout(std140) uniform SceneUBO {
    vec4 u_rgbaColor;
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