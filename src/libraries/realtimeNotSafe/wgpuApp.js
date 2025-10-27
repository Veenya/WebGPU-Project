import { initShaders } from "./shaders";
import { generateColorByValue, sumValues } from "./utils";
import { gpuFragmentShader, gpuVertexShader } from "./variables";

export class WebGPUApp {
    constructor(canvas, rtdataParameters) {
        this.container = document.getElementById(canvas);
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        //document.body.appendChild(this.canvas);

        this.parameters = rtdataParameters['params'];
        this.newParameters = this.parameters;
        this.rtdata_started = false;
        this.setupComplete = false;
        this.rtdata_received = false;
        this.lastValues = [];
        this.color = null;
        this.firstColor = true;
        this.precColor = null;

        window.addEventListener("sketchDataUpdate", (event) => {
            const updatedParameters = event.detail.parameters;
            this.updateSketchData(updatedParameters);
        });


        this.running = true;
        this.init();
    }

    updateSketchData(updatedParameters) {
        this.newParameters = updatedParameters;
        if (updatedParameters.ch1 != null && updatedParameters.ch2 != null && updatedParameters.ch3 != null && updatedParameters.ch4 != null) {
            this.setLastValues(this.newParameters);
            this.rtdata_received = true;
            console.log("PARAMETERS RECEIVED: ", this.newParameters);
        }
    }

    setLastValues(rtdata) {
        if (this.lastValues.length === 5) {
            this.lastValues.shift();
        }
        this.lastValues.push(rtdata);
    }

    async init() {
        if (!this.rtdata_started) {
            this.rtdata_started = true;

            if (!navigator.gpu) {
                console.error("WebGPU non supportato");
                return;
            }

            // Imposta dimensioni canvas
            this.resizeCanvas();
            window.addEventListener("resize", () => this.resizeCanvas());

            // Inizializza WebGPU
            this.adapter = await navigator.gpu.requestAdapter();
            this.device = await this.adapter.requestDevice();
            this.context = this.canvas.getContext("webgpu");

            const format = navigator.gpu.getPreferredCanvasFormat();
           this.context.configure({
                device: this.device,
                format: navigator.gpu.getPreferredCanvasFormat(),
                alphaMode: 'opaque'
                });

            this.createPipeline();
            this.createBuffer();
            this.start();
        }
    }

    createPipeline() {
        initShaders();
        this.vertexShader = this.device.createShaderModule({ code: gpuVertexShader });
        this.fragmentShader = this.device.createShaderModule({ code: gpuFragmentShader });

        const vertexBufferLayout = {
            arrayStride: 2 * 4,
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x2",
                },
            ],
        };

        const texCoordBufferLayout = {
            arrayStride: 2 * 4,
            attributes: [
                {
                    shaderLocation: 1,
                    offset: 0,
                    format: "float32x2",
                },
            ],
        };

        this.vertexBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0, // Corrisponde a `@group(0) @binding(0)` nello shader
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: "uniform" },
                },
            ],
        });

        this.fragmentBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: { type: "uniform" },
                }
            ],
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.vertexBindGroupLayout, this.fragmentBindGroupLayout],
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: this.vertexShader,
                entryPoint: "main",
                buffers: [vertexBufferLayout, texCoordBufferLayout],
            },
            fragment: {
                module: this.fragmentShader,
                entryPoint: "main",
                targets: [{ format: "bgra8unorm" }],
            },
            primitive: {
                topology: "triangle-list",
            },
        });
    }

    createBuffer() {
        const randomVec2 = new Float32Array([Math.random() * 300, Math.random() * 300]);
        this.vertexUniformBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.vertexUniformBuffer, 0, randomVec2);

        this.vertexBindGroup = this.device.createBindGroup({
            layout: this.vertexBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.vertexUniformBuffer },
            }],
        });

        this.fragmentUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.fragmentBindGroup = this.device.createBindGroup({
            layout: this.fragmentBindGroupLayout,
            entries: [{
                binding: 0,
                resource: { buffer: this.fragmentUniformBuffer },
            }],
        });

        this.positionData = [];
        this.texCoordData = [];

        this.cols = Math.floor(this.canvas.width / 2);
        this.rows = Math.floor(this.canvas.height / 2);
        const [xOff, yOff] = [2 / this.cols, 2 / this.rows];
        const [uOff, vOff] = [1 / this.cols, 1 / this.rows];

        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                this.positionData.push(-1 + xOff * col + 1 / this.cols);
                this.positionData.push(1 - yOff * row - 1 / this.rows);
                this.texCoordData.push((col + 1 / this.cols) * uOff);
                this.texCoordData.push((row + 1 / this.rows) * vOff);
            }
        }

        const positionBufferData = new Float32Array(this.positionData);
        const texCoordBufferData = new Float32Array(this.texCoordData);

        this.positionBuffer = this.device.createBuffer({
            size: positionBufferData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.positionBuffer, 0, positionBufferData);

        this.texCoordBuffer = this.device.createBuffer({
            size: texCoordBufferData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
        this.device.queue.writeBuffer(this.texCoordBuffer, 0, texCoordBufferData);

        this.time = 0;
        this.transitionFactor = 0;
    }

    resizeCanvas() {
        this.canvas.width = 1280;
        this.canvas.height = 1280;
    }

    start() {
        this.running = true;
        this.render();
    }

    pause() {
        this.running = false;
    }

    resume() {
        if (!this.running) {
            this.running = true;
            this.render();
        }
    }

    render = () => {
        if (!this.running) return;
        console.log("FATTORE: ", this.transitionFactor);
        if (this.rtdata_received) {
            this.transitionFactor = 0;
            if(this.color !== null){
                this.firstColor = false;
            }
            if(!this.firstColor){
                this.precColor = this.color;
            }
            this.color = generateColorByValue(this.newParameters.ch1, this.newParameters.ch2, this.newParameters.ch3, this.newParameters.ch4);
            this.color.r *= 10.0;
            this.color.g *= 10.0;
            this.color.b *= 10.0;
            this.sum = sumValues(this.newParameters.ch1, this.newParameters.ch2, this.newParameters.ch3, this.newParameters.ch4);
            const colorArray = new Float32Array([this.color.r, this.color.g, this.color.b]);
            this.device.queue.writeBuffer(this.fragmentUniformBuffer, 0, colorArray);

            if(!this.firstColor){
                const precColorArray = new Float32Array([this.precColor.r, this.precColor.g, this.precColor.b]);
                this.device.queue.writeBuffer(this.fragmentUniformBuffer, 12, precColorArray);
            }

            this.rtdata_received = false;
        }
        const timeArray = new Float32Array([this.time]);
        this.time += 0.02;
        this.device.queue.writeBuffer(this.vertexUniformBuffer, 8, timeArray);

        const transitionFactorArray = new Float32Array([this.transitionFactor]);
        this.transitionFactor += 0.0115;
        this.device.queue.writeBuffer(this.fragmentUniformBuffer, 8, transitionFactorArray);

        const commandEncoder = this.device.createCommandEncoder();

        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: this.context.getCurrentTexture().createView(),
                loadOp: "clear",
                storeOp: "store",
                clearValue: [0, 0, 0, 1],
            }]
        });

        passEncoder.setPipeline(this.pipeline);
        passEncoder.setVertexBuffer(0, this.positionBuffer);
        passEncoder.setVertexBuffer(1, this.texCoordBuffer);
        passEncoder.setBindGroup(0, this.vertexBindGroup);
        passEncoder.setBindGroup(1, this.fragmentBindGroup);
        passEncoder.draw(this.cols * this.rows);
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
        requestAnimationFrame(this.render);
    };
}
