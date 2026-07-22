# Project Will - Technical Documentation

## 1. Analysis and Risk Report

During the review of the core library and application code, the following issues and risks were identified:

### 🔴 High Risk: Performance Bottlenecks

* **Uniform Location Lookup in Render Loop (`Material.apply`)**:
  The `Material.apply()` method calls `gl.getUniformLocation` for every uniform, every frame, for every material. This is a synchronous and expensive CPU-GPU synchronization point that will severely impact performance as scene complexity grows.
  * **Recommendation**: Cache uniform locations in a `Map` within the `Shader` class during initialization or upon first access.

* **Matrix Multiplication Inconsistency (Shader vs Math)**:
  The `app.js` shader uses `gl_Position = aVertexPosition * u_modelMatrix;`, which implies a row-vector convention. However, the `Mat4` class implements column-major logic. This discrepancy can lead to unexpected transformations if the math library's multiplication order doesn't align with the shader's multiplication order.
  * **Recommendation**: Standardize on the WebGL/GLSL standard: `gl_Position = u_modelMatrix * aVertexPosition;`.

* **Redundant Matrix Allocation (`Mat4.multiply`)**:
  The `Mat4.multiply` method currently allocates a new `Mat4` object and then calls `_columnMajorMultiply`, which allocates *another* new `Mat4` object. This doubles the memory allocation per transformation.
  * **Recommendation**: Refactor `multiply` to avoid double allocation and use "out" parameters to minimize object creation.

### 🟡 Medium Risk: Memory and Resource Management

* **Garbage Collection (GC) Pressure (`Mat4`)**:
  The `Mat4` class methods (like `multiply`, `translation`, `scale`, `perspective`) create new objects instead of modifying existing ones. Frequent calls in the render loop will trigger frequent GC pauses, causing frame stutters.
  * **Recommendation**: Implement "out" parameter support to allow reusing existing `Mat4` instances.

* **Asynchronous Texture Loading (`Texture`)**:
  Textures are loaded asynchronously via `Image.onload`. If an entity is drawn before the texture is ready, it will be skipped or rendered incorrectly. There is no mechanism to synchronize the engine's scene graph with texture readiness.
  * **Recommendation**: Implement a callback or Promise-based system to notify the engine when a texture is fully loaded and ready for use.

### 🟢 Low Risk: API Design

* **API Redundancy (`Entity.draw`)**:
  The `gl` context is passed to `Entity.draw(gl)`, even though `this.geometry` and `this.material` already hold a reference to the `gl` context.
  * **Recommendation**: Remove `gl` from the `draw` parameter to maintain consistency.

---

## 2. Core API Documentation

### 2.1 Lower-Level Abstractions (Core WebGL2 Wrappers)

#### `Shader`
Wraps a WebGLProgram to simplify shader compilation and linking.
* **`constructor(gl, vsSource, fsSource)`**: Initializes a new shader program using vertex and fragment shader source code.
* **`_initShader(gl, type, source)`**: Internal method to compile individual shader stages.
* **`_initProgram(vsSource, fsSource)`**: Internal method to link the vertex and fragment shaders into a program.

#### `Buffer`
A wrapper for `WebGLBuffer` objects.
* **`constructor(gl, type, data)`**: Creates a buffer of a specific type (`gl.ARRAY_BUFFER`, `gl.ELEMENT_ARRAY_BUFFER`, etc.) and uploads data to the GPU.
* **`bind()`**: Binds this buffer to the WebGL context.

#### `Texture`
Handles 2D texture creation and asynchronous image loading.
* **`constructor(gl, url)`**: Starts loading a texture from a URL.
* **`_load(url)`**: Internal method to handle image loading, texture parameter configuration (Wrap, Filter), and status management.
* **`bind(unit = 0)`**: Binds the texture to a specific texture unit.

#### `Geometry`
Defines mesh shape using Vertex Array Objects (VAO) and Buffers.
* **`constructor(gl, mode)`**: Initializes geometry with a draw mode (e.g., `gl.TRIANGLES`).
* **`addAttribute(buffer, location, size, type)`**: Configures a buffer as a vertex attribute (position, UV, normal) within the VAO.
* **`setCount(count)`**: Sets the number of vertices to be drawn.
* **`bind()`**: Binds the associated VAO.
* **`draw()`**: Executes the `gl.drawArrays` command.

#### `VertexArray`
A container for WebGL Vertex Array Object (VAO) state.
* **`constructor(gl)`**: Creates a new VAO.
* **`bind()`**: Binds the VAO.
* **`unbind()`**: Binds `null` to unbind the VAO.

### 2.2 Mid-Level Abstractions (Scene Graph Components)

#### `Material`
Manages the visual appearance of an object via Shaders, Uniforms, and Textures.
* **`constructor(gl, shader)`**: Links a `Shader` instance to this material.
* **`setTexture(name, textureInstance)`**: Maps a `Texture` to a `sampler2D` uniform name.
* **`setUniform(name, value)`**: Sets a uniform value (float, vec2, vec3, vec4, or matrix).
* **`apply()`**: Binds the shader, binds all textures to correct units, and uploads all current uniform values to the GPU.

#### `Entity`
A high-level scene object combining geometry and material. Supports parent-child hierarchies.
* **`constructor(geometry, material)`**: Creates an entity with a specific shape and appearance.
* **`add(child)`**: Adds a child entity to the hierarchy.
* **`remove(child)`**: Removes a child entity.
* **`render(gl, parentWorldMatrix)`**: Recursively renders the entity and its children, applying transformations.
* **`pre_render(gl)` / `post_render(gl)`**: Lifecycle hooks for custom logic before/after rendering.

### 2.3 High-Level Abstractions (Engine Core)

#### `Scene`
A container for all entities to be rendered in a scene.
* **`constructor(gl)`**: Initializes a scene with a default root `Entity`.
* **`add(entity)`**: Adds an entity to the root of the scene.
* **`render()`**: Triggers the recursive rendering of the scene graph starting from the root.

#### `Engine`
The main controller for the WebGL2 lifecycle.
* **`constructor(canvas)`**: Initializes the engine with a canvas element and sets up the WebGL2 context.
* **`start()`**: Starts the animation loop.
* **`stop()`**: Stops the animation loop.
* **`render()`**: Renders the current state of the scene.

---

## 3. Math Library API (`math.js`)

A utility library for 3D mathematical operations, optimized for WebGL compatibility.

### `Vec3`
A basic 3D vector container with `x`, `y`, and `z` components.

### `Mat4`
A 4x4 Matrix class using **Column-Major** order.
* **`constructor()`**: Initializes an identity matrix.
* **`identity()`**: Resets the matrix to the identity matrix.
* **`static multiply(a, b)`**: Performs matrix multiplication ($A \times B$).
* **`static translation(x, y, z)`**: Returns a translation matrix.
* **`static scale(x, y, z)`**: Returns a scale matrix.
* **`static perspective(fovy, aspect, near, far)`**: Returns a perspective projection matrix.
