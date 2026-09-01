function update_sea() {
    const cycle_time = 1.0;
    const current_cycle = Math.trunc(engine.time.current / cycle_time);
    const cycle_partial = engine.time.current % cycle_time;
    let quads = 1, side = 1, vertices_needed = 6;

    for (let c = 0; c <= current_cycle; c++) {
        const new_side = side + 2;
        const new_quads = new_side * 2 + side * 2;
        vertices_needed += new_quads * 6;
        quads += new_quads;
        side = new_side;
    }

    //if (last_report < current_cycle) {
    //    console.log(
    //        `C ${current_cycle} Q ${quads} S ${side} V ${vertices_needed} A ${scene.cameras[0].perspective.aspect}`
    //    );
    //    last_report = current_cycle;
    //}

    const geo = engine.geometries['square'];

    if (vertices_needed > vertices_generated) {
        const vertices_missing = vertices_needed - vertices_generated;
        geo.add_buffer_data({
            aPosition: new Float32Array(vertices_missing * 3),
            aNormal: new Float32Array(vertices_missing * 3),
            aTexCoord: new Float32Array(vertices_missing * 2)
        });
        vertices_generated = vertices_needed;
    }

    //y=Asin(kx−ωt+ϕ)   //   y(x,z,t) = Asin(kx+kz-wt+o)
    function y(x, z, t, a, kx, kz, w, o) {
        return a * Math.sin(kx * Math.PI * 2.0 * x + kz * Math.PI * 2.0 * z - w * t + o);
    }
    //update existent geometry
    const geo_offset = 36;
    const position = new Float32Array(vertices_generated * 3),
        normal = new Float32Array(vertices_generated * 3),
        texture = new Float32Array(vertices_generated * 2);

    const u0 = (1.0 / 24.0) * 22.0, v0 = (1.0 / 16.0) * 12.0, u1 = (1.0 / 24.0) * 23.0, v1 = (1.0 / 16.0) * 13.0;
    // const u0 = (1.0 / 24.0) * 13.0, v0 = (1.0 / 16.0) * 3.0, u1 = (1.0 / 24.0) * 14.0, v1 = (1.0 / 16.0) * 4.0;
    const factor_left = 1.0 - (cycle_partial / cycle_time);

    for (let quad_row = 0; quad_row < side; quad_row++) {
        for (let quad_col = 0; quad_col < side; quad_col++) {

            let
                x0 = -side / 2.0 + quad_col * 1.0,
                x1 = -side / 2.0 + quad_col * 1.0 + 1.0,
                z0 = side / 2.0 - quad_row * 1.0,
                z1 = side / 2.0 - quad_row * 1.0 - 1.0;

            let y0 = 0.0, y1 = 0.0, y2 = 0.0, y3 = 0.0;

            for (const wave of waves) {
                y0 += y(x0, z0, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y1 += y(x1, z0, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y2 += y(x1, z1, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
                y3 += y(x0, z1, engine.time.current, wave.a, wave.kx, wave.kz, wave.w, wave.o);
            }

            if (quad_row == 0 || quad_row == side - 1 || quad_col == 0 || quad_col == side - 1) {
                const sine_factor_left = Math.sin(Math.PI / 2.0 * factor_left);
                const xf = (Math.sin(engine.time.current + x0) + Math.cos(engine.time.current + z0)) * sine_factor_left;
                const zf = (Math.cos(engine.time.current + x0) - Math.sin(engine.time.current + z0)) * sine_factor_left;
                const yf = 2.0 * sine_factor_left;
                const sf = 0.5 * sine_factor_left;
                x0 += xf + sf, z0 += zf - sf, x1 += xf - sf, z1 += zf + sf;
                y0 += yf, y1 += yf, y2 += yf, y3 += yf;
            }

            const buffer_offset = (quad_row * side + quad_col) * 6;
            generate_triangle(
                x0, y0, z0, u0, v0,
                x1, y1, z0, u1, v0,
                x1, y2, z1, u1, v1,
                buffer_offset, position, normal, texture);
            generate_triangle(
                x0, y0, z0, u0, v0,
                x1, y2, z1, u1, v1,
                x0, y3, z1, u0, v1,
                buffer_offset + 3, position, normal, texture);
        }
    }

    geo.buffer_sub_data({
        aPosition: { data: position, offset: 36 * 3 * 4 },
        aNormal: { data: normal, offset: 36 * 3 * 4 },
        aTexCoord: { data: texture, offset: 36 * 2 * 4 }
    });
}