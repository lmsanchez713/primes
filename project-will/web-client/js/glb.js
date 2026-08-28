async function loadGLB(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    // 1. Parse Header (12 bytes)
    const headerView = new DataView(arrayBuffer, 0, 12);
    const magic = headerView.getUint32(0, true);
    const version = headerView.getUint32(4, true);
    const totalLength = headerView.getUint32(8, true);

    if (magic !== 0x46546C67) { // "glTF" in ASCII
        throw new Error("Invalid GLB file magic number.");
    }

    // 2. Parse Chunks
    let offset = 12;
    let jsonChunk = null;
    let binaryBuffer = null;

    while (offset < totalLength) {
        const chunkView = new DataView(arrayBuffer, offset, 8);
        const chunkLength = chunkView.getUint32(0, true);
        const chunkType = chunkView.getUint32(4, true);
        offset += 8;

        if (chunkType === 0x4E4F534A) { // "JSON"
            const jsonBytes = new Uint8Array(arrayBuffer, offset, chunkLength);
            const jsonText = new TextDecoder("utf-8").decode(jsonBytes);
            jsonChunk = JSON.parse(jsonText);
        } else if (chunkType === 0x004E4942) { // "BIN"
            binaryBuffer = arrayBuffer.slice(offset, offset + chunkLength);
        }

        offset += chunkLength;
    }

    return { json: jsonChunk, binary: binaryBuffer };
}

function getBufferData(json, binaryBuffer, accessorIndex) {
    const accessor = json.accessors[accessorIndex];
    const bufferView = json.bufferViews[accessor.bufferView];

    // Calculate exact byte offsets inside the binary chunk
    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
    const totalBytes = accessor.count * getComponentCount(accessor.type) * getComponentByteSize(accessor.componentType);

    // Return a typed array matching the component type (e.g., Float32Array, Uint16Array)
    const TypeConstructor = getTypedArrayConstructor(accessor.componentType);
    return new TypeConstructor(binaryBuffer, byteOffset, accessor.count * getComponentCount(accessor.type));
}

// glTF Constants Mapping Helper
function getComponentByteSize(type) {
    switch (type) {
        case 5120: case 5121: return 1; // BYTE, UNSIGNED_BYTE
        case 5122: case 5123: return 2; // SHORT, UNSIGNED_SHORT
        case 5125: case 5126: return 4; // UNSIGNED_INT, FLOAT
        default: return 0;
    }
}

function getComponentCount(type) {
    const counts = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
    return counts[type] || 0;
}

function getTypedArrayConstructor(type) {
    const constructors = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
    return constructors[type];
}

function setupWebGLBuffers(gl, json, binaryBuffer, meshIndex) {
    const mesh = json.meshes[meshIndex];
    const primitive = mesh.primitives[0]; // Access the first geometric primitive

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // 1. Bind Vertex Positions
    const posData = getBufferData(json, binaryBuffer, primitive.attributes.POSITION);
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // Assuming location = 0 in GLSL
    gl.enableVertexAttribArray(0);

    // 2. Bind Element Indices
    const indicesData = getBufferData(json, binaryBuffer, primitive.indices);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesData, gl.STATIC_DRAW);

    // Unbind VAO safely
    gl.bindVertexArray(null);

    return {
        vao: vao,
        indexCount: json.accessors[primitive.indices].count,
        indexType: json.accessors[primitive.indices].componentType
    };
}

function render(gl, renderData) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Bind the parsed mesh data
    gl.bindVertexArray(renderData.vao);

    // Draw elements matching types specified in the GLB (e.g., gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, renderData.indexCount, renderData.indexType, 0);
}

// Orchestrating setup
async function init() {
    const gl = document.createElement("canvas").getContext("webgl2");
    document.body.appendChild(gl.canvas);

    const { json, binary } = await loadGLB("assets/model.glb");
    const renderData = setupWebGLBuffers(gl, json, binary, 0);

    // Invoke your rendering shader loop passing renderData ...
}
