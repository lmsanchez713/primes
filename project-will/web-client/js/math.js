/**
 * A simple math library for 3D transformations.
 */
export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        if (len > 0) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        }
        return this;
    }

    static sub(a, b, out) {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        out.z = a.z - b.z;
        return out;
    }

    static cross(a, b, out) {
        const ax = a.x, ay = a.y, az = a.z;
        const bx = b.x, by = b.y, bz = b.z;
        out.x = ay * bz - az * by;
        out.y = az * bx - ax * bz;
        out.z = ax * by - ay * bx;
        return out;
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
}

export class Mat4 {
    constructor() {
        this.data = new Float32Array(16);
        this.identity();
    }

    identity() {
        this.data.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        return this;
    }

    static multiply(a, b, out) {
        if (!out) throw new Error("Mat4.multiply: 'out' parameter is mandatory to prevent object creation.");
        const aD = a.data;
        const bD = b.data;
        const oD = out.data;

        for (let i = 0; i < 4; i++) { // column
            for (let j = 0; j < 4; j++) { // row
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += aD[k * 4 + j] * bD[i * 4 + k];
                }
                oD[i * 4 + j] = sum;
            }
        }
        return out;
    }

    static translation(x, y, z, out) {
        if (!out) throw new Error("Mat4.translation: 'out' parameter is mandatory to prevent object creation.");
        out.identity();
        out.data[12] = x;
        out.data[13] = y;
        out.data[14] = z;
        return out;
    }

    static scale(x, y, z, out) {
        if (!out) throw new Error("Mat4.scale: 'out' parameter is mandatory to prevent object creation.");
        out.identity();
        out.data[0] = x;
        out.data[5] = y;
        out.data[10] = z;
        return out;
    }

    static perspective(fovy, aspect, near, far, out) {
        if (!out) throw new Error("Mat4.perspective: 'out' parameter is mandatory to prevent object creation.");
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        out.identity();
        out.data[0] = f / aspect;
        out.data[5] = f;
        out.data[10] = (far + near) * nf;
        out.data[11] = -1;
        out.data[14] = (2 * far * near) * nf;
        out.data[15] = 0;

        return out;
    }

    static lookAt(eye, target, up, out) {
        if (!out) throw new Error("Mat4.lookAt: 'out' parameter is mandatory to prevent object creation.");
        const z = new Vec3();
        Vec3.sub(target, eye, z); // forward = target - eye
        z.normalize();

        const x = new Vec3();
        Vec3.cross(up, z, x); // right = cross(up, forward)
        x.normalize();

        const y = new Vec3();
        Vec3.cross(z, x, y); // up_actual = cross(forward, right) - wait, order matters for handedness

        // Let's use standard: 
        // z axis is -forward (pointing towards camera)
        // x axis is right
        // y axis is up
        // Matrix = [x.x, y.x, z.x, 0, x.y, y.y, z.y, 0, x.z, y.z, z.z, 0, -dot(x,eye), -dot(y,eye), -dot(z,eye), 1]
        // Wait, that's for row-major or column-major?

        // Standard OpenGL LookAt:
        // z = normalize(eye - target) (points away from scene)
        // x = normalize(cross(up, z))
        // y = cross(z, x)
        // Matrix is [x.x, y.x, z.x, 0,  x.y, y.y, z.y, 0,  x.z, y.z, z.z, 0, -dot(x,eye), -dot(y,eye), -dot(z,eye), 1]
        // Wait, column major:
        // data[0] = x.x, data[4] = x.y, data[8] = x.z, data[12] = -dot(x,e)
        // data[1] = y.x, data[5] = y.y, data[9] = y.z, data[13] = -dot(y,e)
        // data[2] = z.x, data[6] = z.y, data[10] = z.z, data[14] = -dot(z,e)
        // data[3] = 0,   data[7] = 0,  data[11] = 0,  data[15] = 1

        const ez = new Vec3();
        Vec3.sub(eye, target, ez); // z axis: eye - target
        ez.normalize();

        const ex = new Vec3();
        Vec3.cross(up, ez, ex); // x axis: cross(up, z)
        ex.normalize();

        const ey = new Vec3();
        Vec3.cross(ez, ex, ey); // y axis: cross(z, x)

        out.data[0] = ex.x; out.data[1] = ey.x; out.data[2] = ez.x; out.data[3] = 0;
        out.data[4] = ex.y; out.data[5] = ey.y; out.data[6] = ez.y; out.data[7] = 0;
        out.data[8] = ex.z; out.data[9] = ey.z; out.data[10] = ez.z; out.data[11] = 0;
        out.data[12] = -Vec3.dot(ex, eye);
        out.data[13] = -Vec3.dot(ey, eye);
        out.data[14] = -Vec3.dot(ez, eye);
        out.data[15] = 1;

        return out;
    }
}
