import { Mat4 } from '../math.js';
import { Entity } from './entity.js';

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

    render(viewMatrix, projectionMatrix) {
        const gl = this.gl;
        const lights = [];
        
        // 1. First pass: Update all world matrices and collect lights
        this._updateAndCollect(this.root, this.identity, lights);

        // 2. Second pass: Render the scene with collected light info
        this.root.render(gl, this.identity, viewMatrix, projectionMatrix, lights);
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
