import { Mat4 } from '../math.js';
import { Entity } from './entity.js';
import { LightType } from '../core/shader.js';

// Define the structure of our UBO data properly aligned for std140 layout
class UBOData {
    constructor() {
        // Create a single buffer that matches std140 layout exactly
        this.buffer = new Float32Array(256); // 1KB buffer - enough for all data
        
        // Initialize with zeros to prevent garbage data
        this.buffer.fill(0);
        
        // Store references to different sections of the buffer for easy access
        this.modelMatrix = this.buffer.subarray(0, 16);
        this.viewMatrix = this.buffer.subarray(16, 32);
        this.projectionMatrix = this.buffer.subarray(32, 48);
        this.lightsCount = this.buffer[48];
        this.lightTypes = this.buffer.subarray(49, 53); // 4 ints
        this.lightColors = this.buffer.subarray(53, 65); // 12 floats (4 lights * 3 components)
        this.lightPositions = this.buffer.subarray(65, 77); // 12 floats (4 lights * 3 components)  
        this.lightDirections = this.buffer.subarray(77, 89); // 12 floats (4 lights * 3 components)
        this.uvTransform = this.buffer.subarray(89, 93); // 4 floats
    }
    
    // Update the UBO data for a specific entity
    updateForEntity(entity, viewMatrix, projectionMatrix, lights) {
        // Set matrices
        this.modelMatrix.set(entity.worldMatrix.data);
        this.viewMatrix.set(viewMatrix);
        this.projectionMatrix.set(projectionMatrix);
        
        // Set UV transform
        if (entity.sprite) {
            const uv = entity.sprite.getUVRect();
            this.uvTransform[0] = uv.u;  // offset_u
            this.uvTransform[1] = uv.v;  // offset_v  
            this.uvTransform[2] = uv.w;  // scale_u
            this.uvTransform[3] = uv.h;  // scale_v
        } else {
            this.uvTransform[0] = 0;
            this.uvTransform[1] = 0;
            this.uvTransform[2] = 1;
            this.uvTransform[3] = 1;
        }
        
        // Set lights
        if (lights.length > 0) {
            const count = Math.min(lights.length, 4);
            this.lightsCount = count;
            
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const type = light.type === LightType.AMBIENT ? 0 : (light.type === LightType.DIRECTIONAL ? 1 : 2);
                this.lightTypes[i] = type;
                this.lightColors.set(light.color, i * 3);
                
                if (light.type !== LightType.AMBIENT) {
                    const pos = [
                        light.worldMatrix.data[12],
                        light.worldMatrix.data[13],
                        light.worldMatrix.data[14]
                    ];
                    this.lightPositions.set(pos, i * 3);
                    if (light.type === LightType.DIRECTIONAL) {
                        this.lightDirections.set(light.direction, i * 3);
                    }
                }
            }
        }
    }
}

function render_entity(entity, viewMatrix, projectionMatrix, lights, engine, uboManager) {
    if (entity.geometry && entity.material && entity.material.isReady()) {
        // Create and update UBO data for this entity
        const uboData = new UBOData();
        uboData.updateForEntity(entity, viewMatrix, projectionMatrix, lights);
        
        // Set UBO data in material
        entity.material.setUBOData('SceneUBO', uboData.buffer);
        
        // Apply the material with UBO support
        entity.material.applyWithUBOs(engine, uboManager);
        
        entity.geometry.bind(engine);
        entity.geometry.draw();
    }
}

export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.root = new Entity();
        this.identity = new Mat4();
        this.uboManager = null; // Will be initialized in render
    }

    add(entity) {
        this.root.add(entity);
    }

    update(deltaTime) {
        this.root.update(deltaTime);
    }

    async render(viewMatrix, projectionMatrix, engine) {
        const gl = this.gl;
        const lights = [];
        
        // 1. First pass: Update all world matrices and collect lights
        this._updateAndCollect(this.root, this.identity, lights);

        // 2. Second pass: Render the scene with collected light info
        const entities = this.root.render(gl, this.identity, viewMatrix, projectionMatrix, lights, engine);

        if (engine.sort_function) {
            entities.sort(engine.sort_function);
        }

        // Initialize UBO manager if needed
        if (!this.uboManager) {
            const { UBOManager } = await import('../core/ubo.js');
            this.uboManager = new UBOManager(gl);
            
            // Create the main scene UBO with enough space for all data
            const uboData = new Float32Array(1024); // 1KB buffer - adjust as needed
            uboData.fill(0); // Initialize to prevent garbage data
            this.uboManager.createUBO('SceneUBO', uboData);
        }
        
        // Bind all UBOs before rendering
        if (this.uboManager) {
            this.uboManager.bindAll();
        }

        for (const entity of entities) {
            render_entity(entity, viewMatrix, projectionMatrix, lights, engine, this.uboManager);
        }
    }

    _updateAndCollect(entity, parentWorldMatrix, lights) {
        Mat4.multiply(parentWorldMatrix, entity.transform, entity.worldMatrix);

        if (entity.lightType) {
            const lightObj = {
                type: entity.lightType,
                color: entity.color,
                direction: entity.direction || [0, -1, 0], // Fallback direction
                worldMatrix: new Mat4() 
            };
            // Copy world matrix to the light's local copy for use in the second pass
            for(let i=0; i<16; i++) lightObj.worldMatrix.data[i] = entity.worldMatrix.data[i];
            lights.push(lightObj);
        }

        for (const child of entity.children) {
            this._updateAndCollect(child, entity.worldMatrix, lights);
        }
    }
}