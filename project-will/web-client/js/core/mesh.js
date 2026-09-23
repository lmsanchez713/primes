import { Vec3, Mat4 } from '/js/math.js';
import { Geometry } from '/js/core/geometry.js';

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

    fill_quads(points) {
        let i0 = 0, i1 = 1, i2 = 2, i3 = 3;
        while (i3 < points.length) {
            this.geometry.generate_triangle(
                points[i0][0], points[i0][1], points[i0][2], points[i0][3], points[i0][4],
                points[i1][0], points[i1][1], points[i1][2], points[i1][3], points[i1][4],
                points[i2][0], points[i2][1], points[i2][2], points[i2][3], points[i2][4]);
            this.geometry.generate_triangle(
                points[i0][0], points[i0][1], points[i0][2], points[i0][3], points[i0][4],
                points[i2][0], points[i2][1], points[i2][2], points[i2][3], points[i2][4],
                points[i3][0], points[i3][1], points[i3][2], points[i3][3], points[i3][4]);
            i0 += 4, i1 += 4, i2 += 4, i3 += 4;
        }
    }

    fill_path(points, mode) {
        const generated_object = { path: points, offset: this.geometry.get_vertex_count() };
        if (mode === "quads") {
            this.fill_quads(points);
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
        generated_object.count = this.geometry.get_vertex_count() - generated_object.offset;
        this.generated.push(generated_object);
    }
}