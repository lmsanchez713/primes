function InitApp() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('Unable to initialize WebGL. Your browser may not support it.');
        return;
    }

    // Set canvas size to match display size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Set clear color to light gray (e.g., rgb(211, 211, 211) which is 0.827, 0.827, 0.827)
    gl.clearColor(0.127, 0.127, 0.827, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
};

export { InitApp };