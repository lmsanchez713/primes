import { Mat4 } from '../math.js';
import { LightType } from '../core/shader.js';

export class Entity {
    constructor(geometry = null, material = null) {
        this.geometry = geometry;
        this.material = material;
        this.transform = new Mat4();
        this.worldMatrix = new Mat4();
        this.parent = null;
        this.children = [];
        // Lighting properties
        this.lightType = null; 
        this.color = [1, 1, 1];
        this.direction = [-0.5, -1.0, -0.5]; // Default direction for directional light
        
        // Sprite component
        this.sprite = null;
    }

    add(child) {
        if (child.parent) {
            child.parent.remove(child);
        }
        child.parent = this;
        this.children.push(child);
    }

    remove(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) {
            this.children.splice(index, 1);
            child.parent = null;
        }
    }

    isReady() {
        return true;
    }

    update(deltaTime) {
        if (this.sprite) {
            this.sprite.update(deltaTime);
        }

        for (const child of this.children) {
            child.update(deltaTime);
        }
    }

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights) {
        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        if (this.geometry && this.material && this.material.isReady()) {
            this.material.apply();
            this.material.setUniform('u_modelMatrix', this.worldMatrix);
            this.material.setUniform('u_viewMatrix', viewMatrix);
            this.material.setUniform('u_projectionMatrix', projectionMatrix);
            
            // Set default UV transform in case it's not set (for non-sprites)
            this.material.setUniform('u_uvTransform', [0, 0, 1, 1]);

            if (this.sprite) {
                const uv = this.sprite.getUVRect();
                this.material.setUniform('u_uvTransform', [uv.u, uv.v, uv.w, uv.h]);
            }

            if (!this.lightType && lights.length > 0) {
                const count = Math.min(lights.length, 4);
                this.material.setUniform('u_lightsCount', count);
                for (let i = 0; i < count; i++) {
                    const light = lights[i];
                    const prefix = `u_lights[${i}]`;
                    this.material.setUniform(`${prefix}.type`, light.type === LightType.AMBIENT ? 0 : (light.type === LightType.DIRECTIONAL ? 1 : 2));
                    this.material.setUniform(`${prefix}.color`, light.color);
                    if (light.type !== LightType.AMBIENT) {
                        const pos = [
                            light.worldMatrix.data[12],
                            light.worldMatrix.data[13],
                            light.worldMatrix.data[14]
                        ];
                        this.material.setUniform(`${prefix}.position`, pos);
                        if (light.type === LightType.DIRECTIONAL) {
                            const dir = light.direction;
                            this.material.setUniform(`${prefix}.direction`, dir);
                        }
                    }
                }
            }

            this.geometry.bind();
            this.geometry.draw();
        }

        for (const child of this.children) {
            child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights);
        }
    }
}
