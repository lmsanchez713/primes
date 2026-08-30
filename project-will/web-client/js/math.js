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

    copy(other) {
        this.data.set(other.data);
        return this;
    }

    multiply(other) {
        const result = new Mat4();
        Mat4.multiply(this, other, result);
        this.data.set(result.data);
        return this;
    }

    // Simple methods that modify the current matrix
    translate(x, y, z) {
        const translation = new Mat4();
        translation.data[12] = x;
        translation.data[13] = y;
        translation.data[14] = z;
        Mat4.multiply(this, translation, this);
        return this;
    }

    rotateX(angle) {
        const rotation = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        rotation.data[5] = c;
        rotation.data[6] = s;
        rotation.data[9] = -s;
        rotation.data[10] = c;
        Mat4.multiply(this, rotation, this);
        return this;
    }

    rotateY(angle) {
        const rotation = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        rotation.data[0] = c;
        rotation.data[2] = -s;
        rotation.data[8] = s;
        rotation.data[10] = c;
        Mat4.multiply(this, rotation, this);
        return this;
    }

    rotateZ(angle) {
        const rotation = new Mat4();
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        rotation.data[0] = c;
        rotation.data[1] = s;
        rotation.data[4] = -s;
        rotation.data[5] = c;
        Mat4.multiply(this, rotation, this);
        return this;
    }

    rotateAxis(axis, angle) {
        const rotation = new Mat4();
        Mat4.rotateAxis(axis, angle, rotation);
        Mat4.multiply(this, rotation, this);
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

    static ortho(left, right, bottom, top, near, far, out) {
        if (!out) throw new Error("Mat4.ortho: 'out' parameter is mandatory to prevent object creation.");
        const rl = 1 / (right - left);
        const tb = 1 / (top - bottom);
        const fn = 1 / (far - near);

        out.identity();
        out.data[0] = 2 * rl;
        out.data[5] = 2 * tb;
        out.data[10] = -2 * fn;
        out.data[12] = -(right + left) * rl;
        out.data[13] = -(top + bottom) * tb;
        out.data[14] = -(far + near) * fn;

        return out;
    }

    static lookAt(eye, target, up, out) {
        if (!out) throw new Error("Mat4.lookAt: 'out' parameter is mandatory to prevent object creation.");
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

    /**
     * Creates a rotation matrix around the X axis
     * @param {number} angle - Angle in radians
     * @param {Mat4} out - Output matrix
     * @returns {Mat4} The output matrix
     */
    static rotateX(angle, out) {
        if (!out) throw new Error("Mat4.rotateX: 'out' parameter is mandatory to prevent object creation.");
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        out.identity();
        out.data[5] = c;
        out.data[6] = s;
        out.data[9] = -s;
        out.data[10] = c;

        return out;
    }

    /**
     * Creates a rotation matrix around the Y axis
     * @param {number} angle - Angle in radians
     * @param {Mat4} out - Output matrix
     * @returns {Mat4} The output matrix
     */
    static rotateY(angle, out) {
        if (!out) throw new Error("Mat4.rotateY: 'out' parameter is mandatory to prevent object creation.");
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        out.identity();
        out.data[0] = c;
        out.data[2] = -s;
        out.data[8] = s;
        out.data[10] = c;

        return out;
    }

    /**
     * Creates a rotation matrix around the Z axis
     * @param {number} angle - Angle in radians
     * @param {Mat4} out - Output matrix
     * @returns {Mat4} The output matrix
     */
    static rotateZ(angle, out) {
        if (!out) throw new Error("Mat4.rotateZ: 'out' parameter is mandatory to prevent object creation.");
        const c = Math.cos(angle);
        const s = Math.sin(angle);

        out.identity();
        out.data[0] = c;
        out.data[1] = s;
        out.data[4] = -s;
        out.data[5] = c;

        return out;
    }

    /**
     * Creates a rotation matrix around an arbitrary axis
     * @param {Vec3} axis - The axis to rotate around
     * @param {number} angle - Angle in radians
     * @param {Mat4} out - Output matrix
     * @returns {Mat4} The output matrix
     */
    static rotateAxis(axis, angle, out) {
        if (!out) throw new Error("Mat4.rotateAxis: 'out' parameter is mandatory to prevent object creation.");

        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const t = 1 - c;

        // Normalize the axis vector
        const normalizedAxis = new Vec3(axis.x, axis.y, axis.z);
        normalizedAxis.normalize();

        const x = normalizedAxis.x;
        const y = normalizedAxis.y;
        const z = normalizedAxis.z;

        out.identity();
        out.data[0] = t * x * x + c;
        out.data[1] = t * x * y - s * z;
        out.data[2] = t * x * z + s * y;
        out.data[4] = t * x * y + s * z;
        out.data[5] = t * y * y + c;
        out.data[6] = t * y * z - s * x;
        out.data[8] = t * x * z - s * y;
        out.data[9] = t * y * z + s * x;
        out.data[10] = t * z * z + c;

        return out;
    }
}

export function OrthoMat4(x = 0, y = 0, z = 0) {
    let mat4 = new Mat4();
    Mat4.translation(x, y, z, mat4);
    return mat4;
}

export function mulberry32(a) {
    return function () {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}