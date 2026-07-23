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
