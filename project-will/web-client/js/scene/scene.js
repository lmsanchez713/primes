import { Mat4 } from '../math.js';
import { Entity } from './entity.js';
import { LightType } from '../core/shader.js';

// Define the structure of our UBO data
class UBOData {
    constructor() {
        // Matrix data (model, view, projection)
        this.modelMatrix = new Float32Array(16);
        this.viewMatrix = new Float32Array(16);
        this.projectionMatrix = new Float32Array(16);
        
        // Light data (4 lights max)
        this.lightsCount = 0;
        this.lightTypes = new Int32Array(4);
        this.lightColors = new Float32Array(12); // 4 lights * 3 components
        this.lightPositions = new Float32Array(12); // 4 lights * 3 components
        this.lightDirections = new Float32Array(12); // 4 lights * 3 components
        
        // UV transform data
        this.uvTransform = new Float32Array(4); // offset_u, offset_v, scale_u, scale_v
        
        // Buffer for all data (aligned to 16-byte boundaries)
        const totalSize = 
            16*4 + // model, view, projection matrices
            4 +    // lightsCount
            4*4 +  // lightTypes array
            12*4 + // lightColors array
            12*4 + // lightPositions array  
            12*4 + // lightDirections array
            4*4;   // uvTransform
        
        this.buffer = new Float32Array(Math.ceil(totalSize / 4) * 4); // Ensure proper alignment
    }
}

function render_entity(entity, viewMatrix, projectionMatrix, lights, engine, uboManager) {
    if (entity.geometry && entity.material && entity.material.isReady()) {
        // Update UBO data for this entity
        const uboData = new UBOData();
        
        // Set matrices
        uboData.modelMatrix.set(entity.worldMatrix.data);
        uboData.viewMatrix.set(viewMatrix);
        uboData.projectionMatrix.set(projectionMatrix);
        
        // Set UV transform
        if (entity.sprite) {
            const uv = entity.sprite.getUVRect();
            uboData.uvTransform[0] = uv.u;  // offset_u
            uboData.uvTransform[1] = uv.v;  // offset_v  
            uboData.uvTransform[2] = uv.w;  // scale_u
            uboData.uvTransform[3] = uv.h;  // scale_v
        } else {
            uboData.uvTransform[0] = 0;
            uboData.uvTransform[1] = 0;
            uboData.uvTransform[2] = 1;
            uboData.uvTransform[3] = 1;
        }
        
        // Set lights
        if (!entity.lightType && lights.length > 0) {
            const count = Math.min(lights.length, 4);
            uboData.lightsCount = count;
            
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const type = light.type === LightType.AMBIENT ? 0 : (light.type === LightType.DIRECTIONAL ? 1 : 2);
                uboData.lightTypes[i] = type;
                uboData.lightColors.set(light.color, i * 3);
                
                if (light.type !== LightType.AMBIENT) {
                    const pos = [
                        light.worldMatrix.data[12],
                        light.worldMatrix.data[13],
                        light.worldMatrix.data[14]
                    ];
                    uboData.lightPositions.set(pos, i * 3);
                    if (light.type === LightType.DIRECTIONAL) {
                        uboData.lightDirections.set(light.direction, i * 3);
                    }
                }
            }
        }
        
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