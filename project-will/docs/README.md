# Project Will - Technical Documentation & Roadmap

## 1. API Documentation

### 2.1 Lower-Level Abstractions (Core WebGL2 Wrappers)

#### `Shader`
Wraps a WebGLProgram to simplify shader compilation and linking.
* **`constructor(gl, vsSource, fsSource)`**: Initializes a new shader program using vertex and fragment shader source code.
* **`_initShader(gl, type, source)`**: Internal method to compile individual shader stages.
* **`_initProgram(vsSource, fsSource)`**: Internal method to link the vertex and fragment shaders into a program.
* `getUniformLocation(name)`: Retrieves/caches uniform locations.

#### `Buffer`
A wrapper for `WebGLBuffer` objects.
* `constructor(gl, type, data)`: Creates a buffer of a specific type (`gl.ARRAY_BUFFER`, `gl.ELEMENT_ARRAY_BUFFER`, etc.) and uploads data to the GPU.
* `bind()`: Binds this buffer to the WebGL context.

#### `Texture`
Handles 2D texture creation and asynchronous image loading.
* `constructor(gl, url)`: Starts loading a texture from a URL.
* `_load(url)`: Internal method to handle image loading and status management (`isReady`).
* `bind(unit = 0)`: Binds the texture to a specific texture unit.

#### `Geometry`
Defines mesh shape using Vertex Array Objects (VAO) and Buffers.
* `constructor(gl, mode)`: Initializes geometry with a draw mode (e.g., `gl.TRIANGLES`).
* `addAttribute(buffer, location, size, type)`: Configures a buffer as a vertex attribute within the VAO.
* `setCount(count)`: Sets the number of vertices to be drawn.
* `bind()`: Binds the associated VAO.
* `draw()`: Executes the `gl.drawArrays` command.

#### `VertexArray`
A container for WebGL Vertex Array Object (VAO) state.
* `constructor(gl)`: Creates a new VAO.
* `bind()`: Binds the associated VAO.
* `unbind()`: Binds `null` to unbind the current VAO.

### 2.2 Mid-Level Abstractions (Scene Graph Components)

#### `Material`
Manages the visual appearance of an object via Shaders, Uniforms, and Textures.
* `constructor(gl, shader)`: Links a `Shader` instance to this material.
* `setTexture(name, textureInstance)`: Maps a `sampler2D` uniform name to a texture.
* `setUniform(name, value)`: Sets a uniform value (float, vec2, vec3, vec4, or matrix).
* `apply()`: Binds the shader, binds all textures, and uploads uniforms.
* `isReady()`: Returns true if all associated textures are loaded.

#### `Entity`
A high-level scene object combining geometry and material. Supports parent-child hierarchies.
* `constructor(geometry = null, material = null)`: Creates an entity with a specific shape and appearance.
* `add(child)`: Adds a child entity to the hierarchy.
* `remove(child)`: Removes a child entity.
* `render(gl, parentWorldMatrix)`: Recursively renders the entity and its children.

#### `Scene`
A container for all entities to be rendered in a scene.
* `constructor(gl)`: Initializes a scene with a default root `Entity`.
* `add(entity)`: Adds an entity to the root of the scene.
* `render()`: Triggers the recursive rendering of the scene graph.

### 2.3 High-Level Abstractions (Engine Core)

#### `AssetManager`
A centralized manager for resource loading and lifecycle management.
* `loadTexture(gl, url)`: Asynchronously loads a texture and returns it as a Promise. Prevents duplicate downloads.
* `getProgress()`: Returns the current load progress (0 to 1).
* `isAllLoaded()`: Checks if all requested assets have finished loading.
* `waitUntilLoaded()`: A promise that resolves when all currently requested assets are loaded.

#### `Engine`
The main controller for the WebGL2 lifecycle.
* `constructor(canvas)`: Initializes the engine and creates a new `AssetManager`.
* `start()`: Starts the animation loop.
* `stop()`: Stops the animation loop.
* `render()`: Renders the current state of the scene.

### 3. Math Library API (`math.js`)

#### `Vec3`
A basic 3D vector container with `x`, `y`, and `z` components.

#### `Mat4`
A 4x4 Matrix class using **Column-Major** order.
* `constructor()`: Initializes an identity matrix.
* `identity()`: Resets the matrix to the identity matrix.
* `static multiply(a, b, out)`: Performs matrix multiplication ($A \\times B$). The `out` parameter is mandatory.
* `static translation(x, y, z, out)`: Returns a translation matrix.
* `static scale(x, y, z, out)`: Returns a scale matrix.
* `static perspective(fovy, aspect, near, far, out)`: Returns a perspective projection matrix.

---

## 2. Risk Report & Improvement Opportunities

* **Resource Lifecycle Management**: The engine currently lacks explicit `dispose()` or cleanup methods for GPU-resident resources (`Buffer`, `Texture`, `Shader`). This poses a significant risk of memory leaks as the scene grows in complexity.
* **Rendering Performance (Uniforms)**: In `Material.apply()`, all uniforms are updated every frame. For complex scenes with many entities, this redundant state change will become a performance bottleneck. Transitioning to Uniform Buffer Objects (UBOs) or tracking dirty states for uniforms is recommended.
* **Error Handling & Robustness**: While texture loading uses Promises, the `Texture` class lacks robust error propagation back to the high-level engine components, which could lead to silent rendering failures if an asset fails to load.

---

## 3. Development Roadmap (Plan)

# Project Will - Development Roadmap

This document outlines the planned development phases for the engine, transitioning from a basic WebGL2 renderer to a feature-complete rendering engine.

## Phase 1: Core Engine Foundation (Current Status)
- [x] WebGL2 Abstraction Layer (`ogl2.js`)
- [x] Basic Scene Graph (Entity/Scene hierarchy)
- [x] Asset Management (Textures)
- [x] Basic Animation Loop

## Phase 2: Camera & Viewport Control
*Goal: Implement a way to view the scene from different perspectives.*
- [ ] **Camera Class**: Implement View and Projection matrices.
- [ ] **Perspective/Orthographic Support**: Toggle between 3D perspective and 2D orthographic views.
- [ ] **Camera Controller**: Simple keyboard/mouse controls to navigate through space.

## Phase 3: Advanced Rendering & Materials
*Goal: Move beyond simple textures to realistic lighting.*
- [ ] **Lighting System**: Implement Light entities (Point, Directional, Ambient).
- [ ] **Standard Shaders**: Built-in Phong or Blinn-Phong shading models.
- [ ] **Normal Mapping**: Support for advanced surface details via normal maps.

## Phase 4: Resource & Asset Expansion
*Goal: Scale the engine to handle complex external content.*
- [ ] **Model Loading**: Implement loaders for `.obj` or `.gltf` formats.
- [ ] **Geometry Buffering**: Automated generation of normals and tangents from vertex data.
- [ ] **Extended Asset Manager**: Support for audio, JSON scene descriptions, and more.

## Phase 5: Engine Robustness & Interaction
*Goal: Prepare the engine for interactive applications/games.*
- [ ] **Input System**: Unified handler for Keyboard, Mouse, and Gamepad events.
- [ ] **Delta Time Integration**: Ensure frame-rate independent updates in `engine.update()`.
- [ ] **Physics/Collision (Optional)**: Basic AABB or Sphere collision detection between entities.

---
*Last updated: 2024-05-22*
