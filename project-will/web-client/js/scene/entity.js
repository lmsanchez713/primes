import { Mat4 } from '../math.js';

export class Entity {
    constructor(geometry = null, material = null, transform = new Mat4(), sprite = null, priority = 0) {
        this.geometry = geometry;
        this.material = material;
        this.transform = transform;
        this.worldMatrix = new Mat4();
        this.parent = null;
        this.children = [];
        // Lighting properties
        this.lightType = null; 
        this.color = [1, 1, 1];
        this.direction = [-0.5, -1.0, -0.5]; // Default direction for directional light
        
        // Sprite component
        this.sprite = sprite;
        this.priority = priority;
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

    render(gl, parentWorldMatrix, viewMatrix, projectionMatrix, lights, engine) {
        const entities = [];

        Mat4.multiply(parentWorldMatrix, this.transform, this.worldMatrix);

        if (this.geometry && this.material && this.material.isReady()) {
            entities.push(this);
        }

        for (const child of this.children) {
            const child_entities = child.render(gl, this.worldMatrix, viewMatrix, projectionMatrix, lights, engine);
            if (child_entities.length > 0) entities.push(...child_entities);
        }

        return entities;
    }
}
