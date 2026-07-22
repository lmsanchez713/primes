/**
 * A simple math library for 3D transformations.
 */
export class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

export class Mat4 {
    constructor() {
        this.data = new Float32Array(16).fill(0);
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

    static multiply(a, b) {
        const out = new Mat4();
        const aD = a.data;
        const bD = b.data;
        const oD = out.data;

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                let k = 0;
                for (; k < 4; k++) {
                    sum += aD[i + k * 4] * bD[k * 4 + j];
                }
                oD[i + k * 4 + j] = sum; // Note: This is a simplified conceptual version
            }
        }
        // The above is a bit messy due to row/column major confusion. 
        // Let's use a standard column-major implementation for WebGL.
        return this._columnMajorMultiply(aD, bD);
    }

    static _columnMajorMultiply(a, b) {
        const out = new Float32Array(16);
        for (let i = 0; i < 4; i++) { // column
            for (let j = 0; j < 4; j++) { // row
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += a[k * 4 + j] * b[i * 4 + k];
                }
                out[i * 4 + j] = sum;
            }
        }
        const res = new Mat4();
        res.data = out;
        return res;
    }

    static translation(x, y, z) {
        const m = new Mat4();
        m.data[12] = x;
        m.data[13] = y;
        m.data[14] = z;
        return m;
    }

    static scale(x, y, z) {
        const m = new Mat4();
        m.data[0] = x;
        m.data[5] = y;
        m.data[10] = z;
        return m;
    }

    static perspective(fovy, aspect, near, far) {
        const m = new Mat4();
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        m.data[0] = f / aspect;
        m.data[1] = 0;
        m.data[2] = 0;
        m.data[3] = 0;

        m.data[4] = 0;
        m.data[5] = f;
        m.data[6] = 0;
        m.data[7] = 0;

        m.data[8] = 0;
        m.data[9] = 0;
        m.data[10] = (far + near) * nf;
        m.data[11] = -1;

        m.data[12] = 0;
        m.data[13] = 0;
        m.data[14] = (2 * far * near) * nf;
        m.data[15] = 0;

        return m;
    }
}