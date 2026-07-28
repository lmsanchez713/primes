
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    attribute vec3 aNormal;
    attribute vec4 aTangent;

    uniform mat4 u_modelMatrix;
    uniform mat4 u_viewMatrix;
    uniform mat4 u_projectionMatrix;

    varying vec2 vTextureCoord;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    varying mat3 vTBN;

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

        gl_Position = u_projectionMatrix * u_viewMatrix * worldPos;
    }
