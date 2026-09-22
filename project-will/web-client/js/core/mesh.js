import { Vec3, Mat4 } from '/js/math.js';
import { Geometry } from '/js/core/geometry.js';

export class Path {
    constructor(points = [], closed = false, attributes = {}) {
        this.points = points;
        this.closed = closed;
        this.attributes = attributes;
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
        this.generated = [];
    }

    fill_quad(path) {
        const points = path.points;
        this.geometry.generate_triangle(
            points[0][0], points[0][1], points[0][2], points[0][3], points[0][4],
            points[1][0], points[1][1], points[1][2], points[1][3], points[1][4],
            points[2][0], points[2][1], points[2][2], points[2][3], points[2][4]);
        this.geometry.generate_triangle(
            points[0][0], points[0][1], points[0][2], points[0][3], points[0][4],
            points[2][0], points[2][1], points[2][2], points[2][3], points[2][4],
            points[3][0], points[3][1], points[3][2], points[3][3], points[3][4]);
    }

    fill_path(path) {
        const generated_object = { path: path, offset: this.geometry.generated_element_count };
        if (path.points.length == 4) {
            this.fill_quad(path);
        }
        //handle other paths
        //let i0 = 0, i1 = 1, i2 = 2, i3 = 3, iq = 0;
        //while (i3 < path.length) {
        //let p0 = path[i0], p1 = path[i1], p2 = path[i2], p3 = path[i3], uv = textures[iq];
        //let u0, v0, u1, v1;
        //this.geometry.generate_triangle(
        //    p0[0], p0[1], p0[2], uv[0][0], uv[0][1],
        //    p1[0], p1[1], p1[2], uv[0][0], uv[0][1],
        //    p2[0], p2[1], p2[2], uv[0][0], uv[0][1], true);
        //
        //i0 += 2, i1 += 2, i2 += 2, i3 += 2, iq += 1;
        //}
        generated_object.count = this.geometry.generated_element_count - generated_object.offset;
        this.generated.push(generated_object);
    }
}