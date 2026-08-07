# Project Will - Technical Documentation

## 1. Class Hierarchy & Architecture

Project Will uses a hybrid architecture: a **Scene Graph** for hierarchical transformation and rendering, and a **Component-like composition** for features like animation (Sprites).

### 1.1 Inheritance Hierarchy
* **`Entity`** (The base object in the scene)
    * **`World`** (Manages a grid of tiles and actors)
    * **`AmbientLight`** (Provides global illumination)
    * **`DirectionalLight`** (Provides parallel light rays)
    * **`PointLight`** (Provides light from a specific point)

### 1.2 Composition & Relationships
* **`Entity`** $\rightarrow$ *has* $\rightarrow$ **`Sprite`** (For frame-based animation)
* **`Entity`** $\rightarrow$ *has* $\rightarrow$ **`Material`** (For visual properties)
* **`Entity`** $\rightarrow$ *has* $\rightarrow$ **`Geometry`** (For mesh data)
* **`Material`** $\rightarrow$ *uses* $\rightarrow$ **`Shader`**
* **`Engine`** $\rightarrow$ *manages* $\rightarrow$ **`Scene`**, **`Camera`**, **`AssetManager`**
* **`Scene`** $\rightarrow$ *contains* $\rightarrow$ **`Entity`** (Root)

---

## 2. API Documentation

### 2.1 Engine Core
| Class | Description | Key Methods |
|-------|-------------|-------------|
| `Engine` | Main entry point. Manages the WebGL loop. | `start()`, `stop()`, `setProjectionMode(mode)`, `setOrthographicParameters(p)` |
| `Scene` | Container for the entity hierarchy. | `add(entity)`, `render(view, projection)` |
| `Camera` | Manages view/projection matrices. | `updateView()`, `updateProjection(fovy, aspect, n, f)`, `updateOrthographic(...)`, `getViewMatrix()` |
| `AssetManager` | Handles asynchronous loading of textures. | `loadTexture(url)`, `isAllLoaded()` |

### 2.2 Graphics Core (WebGL2 Wrappers)
| Class | Description | Key Methods |
|-------|-------------|-------------|
| `Shader` | Wraps WebGLProgram. | `getUniformLocation(name)` |
| `Texture` | Manages WebGLTexture and image loading. | `bind(unit)`, `isReady()` |
| `Buffer` | Wraps `WebGLBuffer`. | `bind()` |
| `Geometry` | Manages VAOs and draw calls. | `addAttribute(buffer, loc, size)`, `setCount(c)`, `draw()` |
| `Material` | Links shaders, textures, and uniforms. | `setTexture(name, tex)`, `setUniform(name, val)`, `apply()` |

### 2.3 Scene Objects
| Class | Description | Key Methods |
|-------|-------------|-------------|
| `Entity` | A physical object in the world. | `add(child)`, `remove(child)`, `update(dt)`, `render(...)` |
| `Sprite` | Handles 2D sprite animation. | `addState(name, frames, duration)`, `setState(name)`, `getUVRect()` |
| `World` | A grid-based spatial container. | `addActor(entity, x, y)`, `moveEntity(entity, x, y)`, `setGrid(grid)` |
| `GameItem` | Data object representing a grid tile. | (Callback driven) |

---

## 3. Usage Example

Below is a standard initialization flow for a WebGL2 application using Project Will.

```javascript
import { Engine } from './engine.js';
import { Shader } from './core/shader.js';
import { Texture } from './core/texture.js';
import { Material } from './core/material.js';
import { Geometry } from './core/geometry.js';
import { Entity } from './scene/entity.js';
import { Sprite } from './scene/sprite.js';

async function init() {
    const canvas = document.getElementById('glCanvas');
    const engine = new Engine(canvas);
    const gl = engine.gl;

    // 1. Setup Assets
    const vs = await (await fetch('glsl/vertex.glsl')).text();
    const fs = await (await fetch('glsl/fragment.glsl')).text();
    const shader = new Shader(gl, vs, fs);
    const tex = new Texture(gl, 'path/to/texture.png');
    
    // 2. Setup Material & Geometry
    const material = new Material(gl, shader);
    material.setTexture('uSampler', tex);
    
    const geo = new Geometry(gl, gl.TRIANGLES);
    // ... add attributes to geo ...

    // 3. Create Animated Entity
    const sprite = new Sprite(new TextureSheet(tex, 32, 32));
    sprite.addState('idle', [0, 1, 2], 0.5);
    
    const player = new Entity(geo, material);
    player.sprite = sprite;

    // 4. Scene Setup
    engine.scene.add(player);
    engine.setProjectionMode('ortho');
    engine.start();
}
```

---

## 4. Risk Report & Improvement Opportunities

* **Resource Lifecycle Management**: The engine currently lacks explicit `dispose()` or cleanup methods for GPU-resident resources (`Buffer`, `Texture`, `Shader`). This poses a significant risk of memory leaks as the scene grows in complexity.
* **Rendering Performance (Uniforms)**: In `Material.apply()`, all uniforms are updated every frame. For complex scenes with many entities, this redundant state change will become a performance bottleneck. Transitioning to Uniform Buffer Objects (UBOs) or tracking dirty states for uniforms is recommended.
* **Error Handling & Robustness**: While texture loading uses Promises, the `Texture` class lacks robust error propagation back to the high-level engine components, which could lead to silent rendering failures if an asset fails to load.

## 5. Development Roadmap

* **Phase 1: Core Engine Foundation** (Completed)
* **Phase 2: Camera & Viewport Control** (Completed)
* **Phase 3: Advanced Rendering & Materials** (Completed)
* **Phase 4: Resource & Asset Expansion** (Planned)
    * [ ] Model Loading (.obj, .gltf)
    * [ ] Automated Geometry Generation
* **Phase 5: Engine Robustness & Interaction** (Planned)
    * [ ] Input System
    * [ ] Physics/Collision

*Last updated: 2024-05-22*
