// WebGPU Rotating 3D Cube Implementation

// Vertex shader - processes each vertex of the cube
const vertexShaderCode = `
struct Uniforms {
    modelViewProjection: mat4x4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexInput {
    @location(0) position: vec3<f32>,
    @location(1) color: vec3<f32>,
}

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>,
}

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
    output.color = input.color;
    return output;
}
`;

// Fragment shader - determines the color of each pixel
const fragmentShaderCode = `
struct FragmentInput {
    @location(0) color: vec3<f32>,
}

@fragment
fn main(input: FragmentInput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.color, 1.0);
}
`;

// Cube vertices (8 corners) with positions and colors
const cubeVertices = new Float32Array([
    // Position (x, y, z)    Color (r, g, b)
    // Front face
    -1, -1,  1,              1, 0, 0,  // 0: front-bottom-left (red)
     1, -1,  1,              0, 1, 0,  // 1: front-bottom-right (green)
     1,  1,  1,              0, 0, 1,  // 2: front-top-right (blue)
    -1,  1,  1,              1, 1, 0,  // 3: front-top-left (yellow)
    // Back face
    -1, -1, -1,              1, 0, 1,  // 4: back-bottom-left (magenta)
     1, -1, -1,              0, 1, 1,  // 5: back-bottom-right (cyan)
     1,  1, -1,              1, 1, 1,  // 6: back-top-right (white)
    -1,  1, -1,              0.5, 0.5, 0.5,  // 7: back-top-left (gray)
]);

// Cube indices - define triangles for each of the 6 faces
const cubeIndices = new Uint16Array([
    // Front face
    0, 1, 2,  0, 2, 3,
    // Right face
    1, 5, 6,  1, 6, 2,
    // Back face
    5, 4, 7,  5, 7, 6,
    // Left face
    4, 0, 3,  4, 3, 7,
    // Top face
    3, 2, 6,  3, 6, 7,
    // Bottom face
    4, 5, 1,  4, 1, 0,
]);

// Matrix math utilities
class Mat4 {
    static create() {
        return new Float32Array(16);
    }

    static identity(out) {
        out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
        out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
        out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
        out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
        return out;
    }

    static perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) / (near - far);
        out[15] = 0;
        return out;
    }

    static translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[8] = a[8]; out[9] = a[9]; out[10] = a[10]; out[11] = a[11];
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
        return out;
    }

    static rotateX(out, a, angle) {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
    }

    static rotateY(out, a, angle) {
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[4] = a[4]; out[5] = a[5]; out[6] = a[6]; out[7] = a[7];
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
        return out;
    }

    static multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
        out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
        out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
        out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
        out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        return out;
    }
}

// Main application class
class CubeApp {
    constructor() {
        this.canvas = document.getElementById('webgpu-canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.rotation = 0;
    }

    async init() {
        // Check if WebGPU is supported
        if (!navigator.gpu) {
            this.showError('WebGPU is not supported in this browser. Please use Chrome or Edge with WebGPU enabled.');
            return;
        }

        try {
            // Request GPU adapter and device
            this.adapter = await navigator.gpu.requestAdapter();
            if (!this.adapter) {
                this.showError('Failed to get GPU adapter.');
                return;
            }

            this.device = await this.adapter.requestDevice();
            
            // Configure canvas context
            this.context = this.canvas.getContext('webgpu');
            this.format = navigator.gpu.getPreferredCanvasFormat();
            
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: 'opaque',
            });

            // Create shaders
            this.vertexShader = this.device.createShaderModule({
                label: 'Vertex Shader',
                code: vertexShaderCode,
            });

            this.fragmentShader = this.device.createShaderModule({
                label: 'Fragment Shader',
                code: fragmentShaderCode,
            });

            // Create vertex buffer
            this.vertexBuffer = this.device.createBuffer({
                label: 'Vertex Buffer',
                size: cubeVertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            this.device.queue.writeBuffer(this.vertexBuffer, 0, cubeVertices);

            // Create index buffer
            this.indexBuffer = this.device.createBuffer({
                label: 'Index Buffer',
                size: cubeIndices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });
            this.device.queue.writeBuffer(this.indexBuffer, 0, cubeIndices);

            // Create uniform buffer for transformation matrix
            this.uniformBuffer = this.device.createBuffer({
                label: 'Uniform Buffer',
                size: 64, // 4x4 matrix = 16 floats * 4 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // Create bind group layout
            this.bindGroupLayout = this.device.createBindGroupLayout({
                label: 'Bind Group Layout',
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' },
                }],
            });

            // Create bind group
            this.bindGroup = this.device.createBindGroup({
                label: 'Bind Group',
                layout: this.bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: { buffer: this.uniformBuffer },
                }],
            });

            // Create pipeline layout
            this.pipelineLayout = this.device.createPipelineLayout({
                label: 'Pipeline Layout',
                bindGroupLayouts: [this.bindGroupLayout],
            });

            // Create render pipeline
            this.pipeline = this.device.createRenderPipeline({
                label: 'Render Pipeline',
                layout: this.pipelineLayout,
                vertex: {
                    module: this.vertexShader,
                    entryPoint: 'main',
                    buffers: [{
                        arrayStride: 24, // 6 floats * 4 bytes (3 for position, 3 for color)
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3', // position
                            },
                            {
                                shaderLocation: 1,
                                offset: 12,
                                format: 'float32x3', // color
                            },
                        ],
                    }],
                },
                fragment: {
                    module: this.fragmentShader,
                    entryPoint: 'main',
                    targets: [{
                        format: this.format,
                    }],
                },
                primitive: {
                    topology: 'triangle-list',
                    cullMode: 'back',
                },
                depthStencil: {
                    depthWriteEnabled: true,
                    depthCompare: 'less',
                    format: 'depth24plus',
                },
            });

            // Create depth texture
            this.depthTexture = this.device.createTexture({
                size: [this.canvas.width, this.canvas.height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });

            console.log('WebGPU initialized successfully!');
            this.render();
        } catch (error) {
            this.showError(`Failed to initialize WebGPU: ${error.message}`);
            console.error(error);
        }
    }

    updateTransformationMatrix() {
        const aspect = this.canvas.width / this.canvas.height;
        
        // Create projection matrix
        const projection = Mat4.create();
        Mat4.perspective(projection, Math.PI / 4, aspect, 0.1, 100.0);
        
        // Create view matrix (camera positioned back from origin)
        const view = Mat4.create();
        Mat4.identity(view);
        Mat4.translate(view, view, [0, 0, -6]);
        
        // Create model matrix with rotation
        const model = Mat4.create();
        Mat4.identity(model);
        Mat4.rotateX(model, model, this.rotation * 0.7);
        Mat4.rotateY(model, model, this.rotation);
        
        // Combine matrices: projection * view * model
        const temp = Mat4.create();
        Mat4.multiply(temp, view, model);
        const mvp = Mat4.create();
        Mat4.multiply(mvp, projection, temp);
        
        // Update uniform buffer
        this.device.queue.writeBuffer(this.uniformBuffer, 0, mvp);
    }

    render() {
        // Update rotation
        this.rotation += 0.01;
        this.updateTransformationMatrix();

        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();
        
        // Begin render pass
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
            depthStencilAttachment: {
                view: this.depthTexture.createView(),
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        });

        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        renderPass.setIndexBuffer(this.indexBuffer, 'uint16');
        renderPass.drawIndexed(cubeIndices.length);
        renderPass.end();

        // Submit commands
        this.device.queue.submit([commandEncoder.finish()]);

        // Request next frame
        requestAnimationFrame(() => this.render());
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

// Initialize the application
const app = new CubeApp();
app.init();
