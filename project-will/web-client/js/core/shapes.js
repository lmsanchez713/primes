import { Geometry } from '/js/core/geometry.js';

export function generateCuboidVertices(p0, p1, p2, p3, p4, p5, p6, p7) {
    const vertices = new Float32Array();
    // Front face
    vertices.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    // Back face
    vertices.push(...p4, ...p5, ...p6, ...p4, ...p6, ...p7);
    return vertices;
}

export function generate_triangle(x0, y0, z0, u0, v0, x1, y1, z1, u1, v1, x2, y2, z2, u2, v2,
    vertex_offset, position, normal, texture) {
    if (position) position.set([x0, y0, z0, x1, y1, z1, x2, y2, z2], vertex_offset * 3);
    if (texture) texture.set([u0, v0, u1, v1, u2, v2], vertex_offset * 2);
    if (normal) {
        // 1. Calcular os vetores v01 (de P0 para P1) e v02 (de P0 para P2)
        const v01x = x1 - x0;
        const v01y = y1 - y0;
        const v01z = z1 - z0;

        const v02x = x2 - x0;
        const v02y = y2 - y0;
        const v02z = z2 - z0;

        // 2. Calcular o produto cruzado (Cross Product) -> Vetor Perpendicular
        const nx = (v01y * v02z) - (v01z * v02y);
        const ny = (v01z * v02x) - (v01x * v02z);
        const nz = (v01x * v02y) - (v01y * v02x);

        // 3. Calcular o comprimento do vetor para normalizar
        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);

        // Evitar divisão por zero caso os pontos estejam alinhados ou sobrepostos
        if (length === 0) {
            normal.set([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0], vertex_offset * 3);
        }

        // 4. Retornar o vetor normal unitário
        const nlzd_x = nx / length,
            nlzd_y = ny / length,
            nlzd_z = nz / length;

        normal.set([nlzd_x, nlzd_y, nlzd_z, nlzd_x, nlzd_y, nlzd_z, nlzd_x, nlzd_y, nlzd_z], vertex_offset * 3);
    }
}

export function generate_quad() {
    //
}

export function generateSea(side_length, senoid) {
    const total_vertices = side_length * side_length * 6;
    const positions = new Float32Array(total_vertices * 3),
        normals = new Float32Array(total_vertices * 3),
        textures = new Float32Array(total_vertices * 2);

    const pos_start = -side_length / 2.0;
    for (let y = 0; y < side_length; y++) {
        for (let x = 0; x < side_length; x++) {
            let px0 = pos_start + x, pz0 = pos_start + y, px1 = pos_start + x + 1.0, pz1 = pos_start + y + 1.0;
            let v3_offset = (y * side_length + x) * 6 * 3, v2_offset = (y * side_length + x) * 6 * 2;
            positions[v3_offset];
        }
    }

    return { positions, normals, textures };
}

export function createCubeGeometry(engine, keep_on_ram = false) {
    // Vertices for two triangles forming a quad
    const vertices = new Float32Array([
        -0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        0.5, -0.5, 0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,

        -0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        -0.5, -0.5, -0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        -0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,

        -0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5
    ]);

    // Texture coordinates
    // const u0 = (1.0 / 24.0) * 14.0, v0 = (1.0 / 16.0) * 12.0, u1 = (1.0 / 24.0) * 15.0, v1 = (1.0 / 16.0) * 13.0;
    const u0 = (1.0 / 24.0) * 22.0, v0 = (1.0 / 16.0) * 12.0, u1 = (1.0 / 24.0) * 23.0, v1 = (1.0 / 16.0) * 13.0;
    const texCoords = new Float32Array([
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1,
        u0, v0, u1, v1, u0, v1, u0, v0, u1, v0, u1, v1
        //0.375, 0.5, 0.625, 0.75, 0.375, 0.75, 0.375, 0.5, 0.625, 0.5, 0.625, 0.75,
        //0.625, 0.5, 0.875, 0.75, 0.625, 0.75, 0.625, 0.5, 0.875, 0.5, 0.875, 0.75,
        //0.375, 0.75, 0.625, 1.0, 0.375, 1.0, 0.375, 0.75, 0.625, 0.75, 0.625, 1.0,
        //0.125, 0.5, 0.375, 0.75, 0.125, 0.75, 0.125, 0.5, 0.375, 0.5, 0.375, 0.75,
        //0.375, 0.25, 0.625, 0.5, 0.375, 0.5, 0.375, 0.25, 0.625, 0.25, 0.625, 0.5,
        //0.375, 0.0, 0.625, 0.25, 0.375, 0.25, 0.375, 0.0, 0.625, 0.0, 0.625, 0.25
    ]);

    // Normals (pointing towards the camera)
    const normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1
    ]);

    const geo = new Geometry(engine, keep_on_ram);
    geo.addBuffer('aPosition', vertices, 3);
    geo.addBuffer('aTexCoord', texCoords, 2);
    geo.addBuffer('aNormal', normals, 3);

    return geo;
}