# Agent Task List - Project Will

This document contains a list of identified issues and tasks to be addressed for the "Project Will" codebase, based on technical documentation and code analysis.

## 🔴 High Priority (Performance & GC)

- [x] **Optimize Math Library (`math.js`)**: Done. Refactored `Mat4` static methods to make the `out` parameter mandatory, eliminating implicit object creation and reducing GC pressure in render loops.

## 🟡 Medium Priority (Resource Management)

- [ ] **Improve Texture Loading Synchronization (`ogl2.js`)**:
    - The current implementation silently skips rendering an entity if its texture is not yet loaded (`Material.isReady()`).
    - Implement a more robust mechanism (e.g., Promises or an Asset Manager) to track loading state and allow the engine to react when resources are ready, instead of just skipping frames.

## 🟢 Low Priority (API Design)

- [ ] **Clean up Redundant API Parameters**:
    - Remove the redundant `gl` parameter from `Entity.render(gl, parentWorldMatrix)` and its recursive calls. Since `Geometry`, `Material`, and `Shader` already hold a reference to the `gl` context, passing it through every layer of the scene graph is unnecessary.

## ℹ️ Note on Resolved/Mismatched Issues
- **Uniform Cache**: The reported issue regarding `gl.getUniformLocation` in the render loop appears to be resolved as `Shader.getUniformLocation` already implements a caching mechanism using a `Map`.
- **Matrix Convention**: The shader in `app.js` currently uses `u_modelMatrix * aVertexPosition`, which is consistent with the column-major math library; hence, the reported discrepancy may have already been addressed.
- **Matrix Allocation**: Redundant matrix allocation in `Mat4` has been resolved by making the `out` parameter mandatory.
