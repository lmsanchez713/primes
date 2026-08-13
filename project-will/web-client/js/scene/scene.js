import { Mat4 } from '../math.js';
import { Entity } from './entity.js';
import { LightType } from '../core/shader.js';

function render_entity(entity, viewMatrix, projectionMatrix, lights, engine) {
    if (entity.geometry && entity.material && entity.material.isReady()) {
        entity.material.apply(engine);
        entity.material.setUniform('u_modelMatrix', entity.worldMatrix);
        entity.material.setUniform('u_viewMatrix', viewMatrix);
        entity.material.setUniform('u_projectionMatrix', projectionMatrix);

        // Set default UV transform in case it's not set (for non-sprites)
        entity.material.setUniform('u_uvTransform', [0, 0, 1, 1]);

        if (entity.sprite) {
            const uv = entity.sprite.getUVRect();
            entity.material.setUniform('u_uvTransform', [uv.u, uv.v, uv.w, uv.h]);
        }

        if (!entity.lightType && lights.length > 0) {
            const count = Math.min(lights.length, 4);
            entity.material.setUniform('u_lightsCount', count);
            for (let i = 0; i < count; i++) {
                const light = lights[i];
                const type = light.type === LightType.AMBIENT ? 0 : (light.type === LightType.DIRECTIONAL ? 1 : 2);
                entity.material.setUniform(`u_lightTypes[${i}]`, type);
                entity.material.setUniform(`u_lightColors[${i}]`, light.color);

                if (light.type !== LightType.AMBIENT) {
                    const pos = [
                        light.worldMatrix.data[12],
                        light.worldMatrix.data[13],
                        light.worldMatrix.data[14]
                    ];
                    entity.material.setUniform(`u_lightPositions[${i}]`, pos);
                    if (light.type === LightType.DIRECTIONAL) {
                        entity.material.setUniform(`u_lightDirections[${i}]`, light.direction);
                    }
                }
            }
        }

        entity.geometry.bind(engine);
        entity.geometry.draw();
    }
}

export class Scene {
    constructor(gl) {
        this.gl = gl;
        this.root = new Entity();
        this.identity = new Mat4();
    }

    add(entity) {
        this.root.add(entity);
    }

    update(deltaTime) {
        this.root.update(deltaTime);
    }

    render(viewMatrix, projectionMatrix, engine) {
        const gl = this.gl;
        const lights = [];
        
        // 1. First pass: Update all world matrices and collect lights
        this._updateAndCollect(this.root, this.identity, lights);

        // 2. Second pass: Render the scene with collected light info
        const entities = this.root.render(gl, this.identity, viewMatrix, projectionMatrix, lights, engine);

        if (engine.sort_function) {
            entities.sort(engine.sort_function);
        }

        for (const entity of entities) {
            render_entity(entity, viewMatrix, projectionMatrix, lights, engine);
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
