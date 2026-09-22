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

    fill_quad(path, texpoints) {
        const p = path.points;
        this.geometry.generate_triangle(
            p[0][0], p[0][1], p[0][2], texpoints[0][0], texpoints[0][1],
            p[1][0], p[1][1], p[1][2], texpoints[1][0], texpoints[1][1],
            p[2][0], p[2][1], p[2][2], texpoints[2][0], texpoints[2][1]);
        this.geometry.generate_triangle(
            p[0][0], p[0][1], p[0][2], texpoints[0][0], texpoints[0][1],
            p[2][0], p[2][1], p[2][2], texpoints[2][0], texpoints[2][1],
            p[3][0], p[3][1], p[3][2], texpoints[3][0], texpoints[3][1]);
    }

    fill_path(path, texpoints) {
        if (path.points.length == 4) {
            this.fill_quad(path, texpoints);
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
    }
}