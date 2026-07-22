# Project Will - Technical Documentation

## 1. Analysis and Risk Report

During the review of `ogl2.js` and `math.js`, the following potential issues and risks were identified:

### 🔴 High Risk: Performance Bottleneck
In `Material.apply()`, the code calls `gl.getUniformLocation(this.shader.program, name)` for **every uniform, every frame, for every material**.
* **Problem:** `getUniformLocation` is a synchronous, expensive GPU-to-CPU call. Calling it inside the render loop will significantly drop the frame rate as the scene complexity increases.
* **Recommendation:** Cache uniform locations in a `Map` within the `Shader` class during initialization or when a uniform is first used.

### 🟡 Medium Risk: Garbage Collection (GC) Pressure
The `Mat4` class in `math.js` creates new objects (`new Mat4()`) inside static methods like `multiply`, `translation`, `scale`, and `perspective`.
* **Problem:** In a 3D engine, these functions are often called hundreds of times per frame. Constant allocation leads to frequent Garbage Collection pauses, causing "stuttering" in animations.
* **Recommendation:** Implement "out" parameters, where an existing `Mat4` instance is passed into the function to be modified, rather than returning a new one.

### 🟡 Medium Risk: Async Texture Loading
The `Texture` class uses `new Image()` and is asynchronous.
* **Problem:** If an object is drawn before the image finishes loading, `isReady` prevents a crash, but there is no mechanism for the engine to know when a texture is actually usable, which might lead to objects appearing/disappearing unexpectedly during the first few frames.

### 🟢 Low Risk: API Redundancy
In `Entity.draw(gl)`, the `gl` context is passed as an argument, even though `this.geometry` and `this.material` already store a reference to `gl`. This is redundant and slightly inconsistent with the rest of the API.

---

## 2. WebGL2 Wrapper API (`ogl2.js`)

A suite of high-level abstractions for managing WebGL2 state and objects.

### `Shader`
Wraps a WebGLProgram to simplify shader compilation and linking.
* **`constructor(gl, vsSource, fsSource)`**: Initializes a new shader program using vertex and fragment shader source code.
* **`_initShader(gl, type, source)`**: Internal method to compile individual shader stages.
* **`_initProgram(vsSource, fsSource)`**: Internal method to link the vertex and fragment shaders into a program.

### `Buffer`
A wrapper for WebGLBuffer objects.
* **`constructor(gl, type, data)`**: Creates a buffer of a specific type (`gl.ARRAY_BUFFER`, `gl.ELEMENT_ARRAY_BUFFER`, etc.) and uploads data to the GPU.
* **`bind()`**: Binds this buffer to the WebGL context.

### `Texture`
Handles 2D texture creation and asynchronous image loading.
* **`constructor(gl, url)`**: Starts loading a texture from a URL.
* **`_load(url)`**: Internal method to handle image loading, texture parameter configuration (Wrap, Filter), and status management.
* **`bind(unit = 0)`**: Binds the texture to a specific texture unit (e.g., `gl.TEXTURE0`).

### `VertexArray` (VAO)
A container for Vertex Array Object state.
* **`constructor(gl)`**: Creates a new VAO.
* **`bind()`**: Binds the VAO.
* **`unbind()`**: Binds `null` to unbind the VAO.

### `Geometry`
Defines the mesh shape using Vertex Array Objects and Buffers.
* **`constructor(gl, mode)`**: Initializes geometry with a draw mode (e.g., `gl.TRIANGLES`).
* **`addAttribute(buffer, location, size, type)`**: Configures a buffer as a vertex attribute (position, UV, normal) within the VAO.
* **`setCount(count)`**: Sets the number of vertices to be drawn.
* **`bind()`**: Binds the associated VAO.
* **`draw()`**: Executes the `gl.drawArrays` command.

### `Material`
Manages the visual appearance of an object via Shaders, Uniforms, and Textures.
* **`constructor(gl, shader)`**: Links a `Shader` instance to this material.
* **`setTexture(name, textureInstance)`**: Maps a `Texture` to a `sampler2D` uniform name.
* **`setUniform(name, value)`**: Sets a uniform value (float, vec2, vec3, vec4, or matrix).
* **`apply()`**: Binds the shader, binds all textures to correct units, and uploads all current uniform values to the GPU.

### `Entity`
A high-level scene object combining geometry and material.
* **`constructor(geometry, material)`**: Creates an entity with a specific shape and appearance.
* **`draw(gl)`**: The main render call. Applies the material, binds the geometry, and draws the object.

---

## 3. Math Library API (`math.js`)

A utility library for 3D mathematical operations.

### `Vec3`
A basic 3D vector container.
* **`constructor(x, y, z)`**: Initializes the vector with `x`, `y`, and `z` components.

### `Mat4`
A 4x4 Matrix class used for transformations (Translation, Rotation, Scale, Projection). Uses **Column-Major** order for compatibility with WebGL.
* **`constructor()`**: Initializes an identity matrix.
* **`identity()`**: Resets the matrix to the identity matrix.
* **`static multiply(a, b)`**: Multiplies two `Mat4` matrices.
* **`static translation(x, y, z)`**: Returns a translation matrix.
* **`static scale(x, y, z)`**: Returns a scale matrix.
* **`static perspective(fovy, aspect, near, far)`**: Returns a perspective projection matrix.
