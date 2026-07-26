import { Entity } from './entity.js';
import { LightType } from '../core/shader.js';

export class AmbientLight extends Entity {
    constructor(color = [1, 1, 1]) {
        super();
        this.lightType = LightType.AMBIENT;
        this.color = color;
    }
}

export class DirectionalLight extends Entity {
    constructor(color = [1, 1, 1], direction = [-0.5, -1.0, -0.5]) {
        super();
        this.lightType = LightType.DIRECTIONAL;
        this.color = color;
        this.direction = direction;
    }
}

export class PointLight extends Entity {
    constructor(color = [1, 1, 1]) {
        super();
        this.lightType = LightType.POINT;
        this.color = color;
    }
}
