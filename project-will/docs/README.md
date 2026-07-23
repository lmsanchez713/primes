# Project Will - Technical Documentation

## 1. Analysis and Risk Report (Status Update)

This section tracks the identified issues and their current status within the codebase.

### 🔴 High Risk: Performance Bottlenecks

* **Uniform Location Lookup in Render Loop (`Material.apply`)**
  - **Status**: ✅ [RESOLVED]
  - **Details**: The `Shader` class now implements a caching mechanism using a `Map` for uniform locations via `getUniformLocation()`.

* **Matrix Multiplication Inconsistency (Shader vs Math)**
  - **Status**: ✅ [RESOLVED]
  - **Details**: The shader in `app.js` uses column-major multiplication (`u_modelMatrix * aVertexPosition`), aligning with the `Mat4` class implementation.

* **Redundant Matrix Allocation & GC Pressure (`Mat4`)**
  - **Status**: ✅ [RESOLVED]
  - **Details**: The API has been refactored to make the `out` parameter mandatory in all transformation and multiplication methods, eliminating implicit object creation and reducing garbage collection pressure.

### 🟡 Medium Risk: Memory and Resource Management

* **Asynchronous Texture Loading (`Texture`)**
  - **Status**: ⚠️ [STILL PRESENT]
  - **Details**: The current implementation uses an `isReady` flag to skip rendering entities with unfinished textures. This prevents crashes but lacks a robust synchronization mechanism (like Promises or an Asset Manager) to handle loading states more gracefully within the scene graph.

### 🟢 Low Risk: API Design

* **API Redundancy (`Entity.render`)**
  - **Status**: ⚠️ [STILL PRESENT]
  - **Details**: The `gl` context is passed through the hierarchy in `Entity.render(gl, ...)`, even though child components like `Geometry` and `Material` already hold a reference to it.

---

## 2. Core API Documentation

### 2.1 Lower-Level Abstractions (Core WebGL2 Wrappers)

#### `Shader`
Wraps a WebGLProgram to simplify shader compilation and linking.
* **`constructor(gl, vsSource, fsSource)`**: Initializes a new shader program using vertex and fragment shader source code.
* **`_initShader(gl, type, source)`**: Internal method to compile individual shader stages.
* **`_initProgram(vsSource, fsSource)`**: Internal method to link the vertex and fragment shaders into a program.
* **`getUniformLocation(name)`**: Retrieves/caches uniform locations.

#### `Buffer`
A wrapper for `WebGLBuffer` objects.
* **`constructor(gl, type, data)`**: Creates a buffer of a specific type (`gl.ARRAY_BUFFER`, `gl.ELEMENT_ARRAY_BUFFER`, etc.) and uploads data to the GPU.
* **`bind()`**: Binds this buffer to the WebGL context.

#### `Texture`
Handles 2D texture creation and asynchronous image loading.
* **`constructor(gl, url)`**: Starts loading a texture from a URL.
* **`_load(url)`**: Internal method to handle image loading and status management (`isReady`).
* **`bind(unit = 0)`**: Binds the texture to a specific texture unit.

#### `Geometry`
Defines mesh shape using Vertex Array Objects (VAO) and Buffers.
* **`constructor(gl, mode)`**: Initializes geometry with a draw mode (e.g., `gl.TRIANGLES`).
* **`addAttribute(buffer, location, size, type)`**: Configures a buffer as a vertex attribute within the VAO.
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
* **`apply()`**: Binds the shader, binds all textures, and uploads uniforms.
* **`isReady()`**: Returns true if all associated textures are loaded.

#### `Entity`
A high-level scene object combining geometry and material. Supports parent-child hierarchies.
* **`constructor(geometry = null, material = null)`**: Creates an entity with a specific shape and appearance.
* **`add(child)`**: Adds a child entity to the hierarchy.
* **`remove(child)``: Removes a child entity.
* **`render(gl, parentWorldMatrix)`**: Recursively renders the entity and its children.

### 2.3 High-Level Abstractions (Engine Core)

#### `Scene`
A container for all entities to be rendered in a scene.
* **`constructor(gl)`**: Initializes a scene with a default root `Entity`.
* **`add(entity)`**: Adds an entity to the root of the scene.
* **`render()`**: Triggers the recursive rendering of the scene graph.

#### `Engine`
The main controller for the WebGL2 lifecycle.
* **`constructor(canvas)`**: Initializes the engine with a canvas element and sets up the WebGL2 context.
* **`start()`**: Starts the animation loop.
* **`stop()`**: Stops the animation loop.
* **`render()``: Renders the current state of the scene.

---

## 3. Math Library API (`math.js`)

### `Vec3`
A basic 3D vector container with `x`, `y`, and `z` components.

### `Mat4`
A 4x4 Matrix class using **Column-Major** order.
* **`constructor()`**: Initializes an identity matrix.
* **`identity()`**: Resets the matrix to the identity matrix.
* **`static multiply(a, b, out)`**: Performs matrix multiplication ($A \\times B$). The `out` parameter is mandatory.
* **`static translation(x, y, z, out)`**: Returns a translation matrix. The `out` parameter is mandatory.
* **`static scale(x, y, z, out)`**: Returns a scale matrix. The `out` parameter is mandatory.
* **`static perspective(fovy, aspect, near, far, out)`**: Returns a perspective projection matrix. The `out` parameter is mandatory.
