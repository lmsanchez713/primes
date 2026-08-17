
    precision mediump float;
    varying vec2 vTextureCoord;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying mat3 vTBN;

    uniform sampler2D uSampler;
    uniform sampler2D uNormalMap;
    uniform bool uUseNormalMap;
    uniform vec4 u_uvTransform; // x: offset_u, y: offset_v, z: scale_u, w: scale_v

    uniform int u_lightsCount;
    uniform int u_lightTypes[4];
    uniform vec3 u_lightColors[4];
    uniform vec3 u_lightPositions[4];
    uniform vec3 u_lightDirections[4];

    void main() {
        vec2 uv = vTextureCoord * u_uvTransform.zw + u_uvTransform.xy;
        vec4 texColor = texture2D(uSampler, uv);
        vec3 normal;
        if (uUseNormalMap) {
            normal = normalize(vTBN * (texture2D(uNormalMap, uv).rgb * 2.0 - 1.0));
        } else {
            normal = normalize(vNormal);
        }

        vec3 ambient = vec3(0.1, 0.1, 0.1);
        vec3 totalLight = ambient;

        for (int i = 0; i < 4; i++) {
            if (i >= u_lightsCount) break;
            
            if (u_lightTypes[i] == 1) { // Directional
                vec3 lightDir = normalize(-u_lightDirections[i]);
                float diff = max(dot(normal, lightDir), 0.0);
                totalLight += u_lightColors[i] * diff;
            } else if (u_lightTypes[i] == 2) { // Point
                vec3 lightDir = normalize(u_lightPositions[i] - vWorldPosition);
                float diff = max(dot(normal, lightDir), 0.0);
                float dist = length(u_lightPositions[i] - vWorldPosition);
                float attenuation = 1.0 / (1.0 + 0.1 * dist + 0.01 * dist * dist);
                totalLight += u_lightColors[i] * diff * attenuation;
            } else if (u_lightTypes[i] == 0) { // Ambient light
                 totalLight += u_lightColors[i];
            }
        }
        gl_FragColor = vec4(texColor.rgb * totalLight, texColor.a);
    }
