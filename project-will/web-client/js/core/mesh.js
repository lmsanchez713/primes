import { Vec3, Mat4 } from '/js/math.js';
import { Geometry } from '/js/core/geometry.js';

export class Path {
    constructor(points = [], closed = false) {
        this.points = points;
        this.closed = closed;
    }

    add(point) {
        this.points.push(point);
    }

    close() {
        this.closed = true;
    }
}

export class Mesh {
    constructor(engine, geometry_name) {
        this.engine = engine;
        if (geometry_name in engine.geometries) {
            this.geometry = engine.geometries[geometry_name];
        }
        else {
            this.geometry = engine.geometries[geometry_name] = new Geometry(engine, true);
        }
    }

    generate_quad(path) {
        misc_geo.generate_triangle(
            -2.0, -2.0, 0.0, u0, v0,
            2.0, -2.0, 0.0, u1, v0,
            2.0, 2.0, 0.0, u1, v1, true);
    }
}