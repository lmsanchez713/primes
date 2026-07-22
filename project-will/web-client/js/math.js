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

    static multiply(a, b, out = new Mat4()) {
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

    static translation(x, y, z, out = new Mat4()) {
        out.identity();
        out.data[12] = x;
        out.data[13] = y;
        out.data[14] = z;
        return out;
    }

    static scale(x, y, z, out = new Mat4()) {
        out.identity();
        out.data[0] = x;
        out.data[5] = y;
        out.data[10] = z;
        return out;
    }

    static perspective(fovy, aspect, near, far, out = new Mat4()) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);

        out.data[0] = f / aspect;
        out.data[1] = 0;
        out.data[2] = 0;
        out.data[3] = 0;

        out.data[4] = 0;
        out.data[5] = f;
        out.data[6] = 0;
        out.data[7] = 0;

        out.data[8] = 0;
        out.data[9] = 0;
        out.data[10] = (far + near) * nf;
        out.data[11] = -1;

        out.data[12] = 0;
        out.data[13] = 0;
        out.data[14] = (2 * far * near) * nf;
        out.data[15] = 0;

        return out;
    }
}
