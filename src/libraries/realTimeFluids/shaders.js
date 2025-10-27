import { gl, ext, ditheringTexture } from "./variables";
import { baseVertexShader, blurVertexShader, blurShader, copyShader, clearShader, colorShader, checkerboardShader, displayShaderSource, bloomPrefilterShader, bloomBlurShader, bloomFinalShader, sunraysMaskShader, sunraysShader, splatShader, advectionShader, divergenceShader, curlShader, vorticityShader, pressureShader, gradientSubtractShader } from "./variables";
import { setAdvectionShader, setBaseVertexShader, setBloomBlurShader, setBloomFinalShader, setBloomPrefilterShader, setBlurShader, setBlurVertexShader, setCheckerboardShader, setClearShader, setColorShader, setCopyShader, setCurlShader, setDisplayShaderSource, setDivergenceShader, setGradientSubtractShader, setPressureShader, setSplatShader, setSunraysMaskShader, setSunraysShader, setVorticityShader } from "./variables";
import { ditheringTexture, setDitheringTexture } from "./variables";
import { compileShader, createProgram, getUniforms, hashCode } from "./shaderUtils";
import { createTextureAsync } from "./textures";
import { copyProgram, setBlurProgram, setAdvectionProgram, setBloomBlurProgram, setBloomFinalProgram, setBloomPrefilterProgram, setCheckerboardProgram, setClearProgram, setColorProgram, setCopyProgram, setCurlProgram, setDivergenceProgram, setGradienSubtractProgram, setPressureProgram, setSplatProgram, setSunraysMaskProgram, setSunraysProgram, setVorticityProgram } from "./variables";
import { setDisplayMaterial } from "./variables";
import textureUrl from "url:/resources/LDR_LLL1_0.png";

/**
 * Inizializza e compila tutti gli shader necessari per il rendering.
 * 
 * Questa funzione si occupa di compilare e configurare una serie di shader per l'uso in 
 * vari passaggi di rendering, tra cui il rendering di base, l'effetto di sfocatura, il copia 
 * del framebuffer, e l'applicazione di effetti speciali come il bloom e i raggi solari.
 * Gli shader vengono compilati utilizzando il metodo `compileShader` e assegnati a variabili globali 
 * per essere utilizzati successivamente nel programma di rendering.
 * 
 * Gli shader definiti includono:
 * - `baseVertexShader`: Shader di vertice di base per la trasformazione della posizione e calcolo delle coordinate UV.
 * - `blurVertexShader`: Shader di vertice per la sfocatura con offset regolabile.
 * - `blurShader`: Shader di frammento per applicare un filtro di sfocatura.
 * - `copyShader`: Shader di frammento per copiare il contenuto di una texture.
 * - `clearShader`: Shader di frammento per cancellare o moltiplicare i colori di una texture con un valore.
 * - `colorShader`: Shader di frammento per applicare un colore uniforme.
 * - `checkerboardShader`: Shader di frammento per generare una texture a scacchiera.
 * - `displayShaderSource`: Shader di frammento per visualizzare e applicare effetti come bloom e raggi solari.
 * - `bloomPrefilterShader`: Shader di frammento per pre-filtrare l'effetto bloom.
 * - `bloomBlurShader`: Shader di frammento per sfocare l'effetto bloom.
 * - `bloomFinalShader`: Shader di frammento per applicare l'intensità finale all'effetto bloom.
 * - `sunraysMaskShader`: Shader di frammento per creare una maschera di raggi solari.
 * - `sunraysShader`: Shader di frammento per applicare l'effetto dei raggi solari.
 * - `splatShader`: Shader di frammento per aggiungere uno "splat" di colore su una texture.
 * - `advectionShader`: Shader di frammento per l'advezione delle particelle.
 * - `divergenceShader`: Shader di frammento per calcolare la divergenza del flusso di velocità.
 * - `curlShader`: Shader di frammento per calcolare la vorticità del flusso di velocità.
 * - `vorticityShader`: Shader di frammento per applicare forze basate sulla vorticità.
 * - `pressureShader`: Shader di frammento per calcolare la pressione basata sulla divergenza.
 * - `gradientSubtractShader`: Shader di frammento per sottrarre il gradiente di pressione dal flusso di velocità.
 */
export function initShaders() {
    setBaseVertexShader(compileShader(gl.VERTEX_SHADER, `
        precision highp float;
    
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform vec2 texelSize;
    
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            vL = vUv - vec2(texelSize.x, 0.0);
            vR = vUv + vec2(texelSize.x, 0.0);
            vT = vUv + vec2(0.0, texelSize.y);
            vB = vUv - vec2(0.0, texelSize.y);
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `));

    setBlurVertexShader(compileShader(gl.VERTEX_SHADER, `
        precision highp float;
    
        attribute vec2 aPosition;
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform vec2 texelSize;
    
        void main () {
            vUv = aPosition * 0.5 + 0.5;
            float offset = 1.33333333;
            vL = vUv - texelSize * offset;
            vR = vUv + texelSize * offset;
            gl_Position = vec4(aPosition, 0.0, 1.0);
        }
    `));

    setBlurShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        uniform sampler2D uTexture;
    
        void main () {
            vec4 sum = texture2D(uTexture, vUv) * 0.29411764;
            sum += texture2D(uTexture, vL) * 0.35294117;
            sum += texture2D(uTexture, vR) * 0.35294117;
            gl_FragColor = sum;
        }
    `));

    setCopyShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
    
        void main () {
            gl_FragColor = texture2D(uTexture, vUv);
        }
    `));

    setClearShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        uniform sampler2D uTexture;
        uniform float value;
    
        void main () {
            gl_FragColor = value * texture2D(uTexture, vUv);
        }
    `));

    setColorShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
    
        uniform vec4 color;
    
        void main () {
            gl_FragColor = color;
        }
    `));

    setCheckerboardShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float aspectRatio;
    
        #define SCALE 25.0
    
        void main () {
            vec2 uv = floor(vUv * SCALE * vec2(aspectRatio, 1.0));
            float v = mod(uv.x + uv.y, 2.0);
            v = v * 0.1 + 0.8;
            gl_FragColor = vec4(vec3(v), 1.0);
        }
    `));

    setDisplayShaderSource(`
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform sampler2D uBloom;
        uniform sampler2D uSunrays;
        uniform sampler2D uDithering;
        uniform vec2 ditherScale;
        uniform vec2 texelSize;
    
        vec3 linearToGamma (vec3 color) {
            color = max(color, vec3(0));
            return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
        }
    
        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
    
        #ifdef SHADING
            vec3 lc = texture2D(uTexture, vL).rgb;
            vec3 rc = texture2D(uTexture, vR).rgb;
            vec3 tc = texture2D(uTexture, vT).rgb;
            vec3 bc = texture2D(uTexture, vB).rgb;
    
            float dx = length(rc) - length(lc);
            float dy = length(tc) - length(bc);
    
            vec3 n = normalize(vec3(dx, dy, length(texelSize)));
            vec3 l = vec3(0.0, 0.0, 1.0);
    
            float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
            c *= diffuse;
        #endif
    
        #ifdef BLOOM
            vec3 bloom = texture2D(uBloom, vUv).rgb;
        #endif
    
        #ifdef SUNRAYS
            float sunrays = texture2D(uSunrays, vUv).r;
            c *= sunrays;
        #ifdef BLOOM
            bloom *= sunrays;
        #endif
        #endif
    
        #ifdef BLOOM
            float noise = texture2D(uDithering, vUv * ditherScale).r;
            noise = noise * 2.0 - 1.0;
            bloom += noise / 255.0;
            bloom = linearToGamma(bloom);
            c += bloom;
        #endif
    
            float a = max(c.r, max(c.g, c.b));
            gl_FragColor = vec4(c, a);
        }
    `);

    setBloomPrefilterShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform vec3 curve;
        uniform float threshold;
    
        void main () {
            vec3 c = texture2D(uTexture, vUv).rgb;
            float br = max(c.r, max(c.g, c.b));
            float rq = clamp(br - curve.x, 0.0, curve.y);
            rq = curve.z * rq * rq;
            c *= max(rq, br - threshold) / max(br, 0.0001);
            gl_FragColor = vec4(c, 0.0);
        }
    `));

    setBloomBlurShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
    
        void main () {
            vec4 sum = vec4(0.0);
            sum += texture2D(uTexture, vL);
            sum += texture2D(uTexture, vR);
            sum += texture2D(uTexture, vT);
            sum += texture2D(uTexture, vB);
            sum *= 0.25;
            gl_FragColor = sum;
        }
    `));

    setBloomFinalShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uTexture;
        uniform float intensity;
    
        void main () {
            vec4 sum = vec4(0.0);
            sum += texture2D(uTexture, vL);
            sum += texture2D(uTexture, vR);
            sum += texture2D(uTexture, vT);
            sum += texture2D(uTexture, vB);
            sum *= 0.25;
            gl_FragColor = sum * intensity;
        }
    `));

    setSunraysMaskShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTexture;
    
        void main () {
            vec4 c = texture2D(uTexture, vUv);
            float br = max(c.r, max(c.g, c.b));
            c.a = 1.0 - min(max(br * 20.0, 0.0), 0.8);
            gl_FragColor = c;
        }
    `));

    setSunraysShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float weight;
    
        #define ITERATIONS 16
    
        void main () {
            float Density = 0.3;
            float Decay = 0.95;
            float Exposure = 0.7;
    
            vec2 coord = vUv;
            vec2 dir = vUv - 0.5;
    
            dir *= 1.0 / float(ITERATIONS) * Density;
            float illuminationDecay = 1.0;
    
            float color = texture2D(uTexture, vUv).a;
    
            for (int i = 0; i < ITERATIONS; i++)
            {
                coord -= dir;
                float col = texture2D(uTexture, coord).a;
                color += col * illuminationDecay * weight;
                illuminationDecay *= Decay;
            }
    
            gl_FragColor = vec4(color * Exposure, 0.0, 0.0, 1.0);
        }
    `));

    setSplatShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uTarget;
        uniform float aspectRatio;
        uniform vec3 color;
        uniform vec2 point;
        uniform float radius;
    
        void main () {
            vec2 p = vUv - point.xy;
            p.x *= aspectRatio;
            vec3 splat = exp(-dot(p, p) / radius) * color;
            vec3 base = texture2D(uTarget, vUv).xyz;
            gl_FragColor = vec4(base + splat, 1.0);
        }
    `));

    setAdvectionShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        uniform sampler2D uVelocity;
        uniform sampler2D uSource;
        uniform vec2 texelSize;
        uniform vec2 dyeTexelSize;
        uniform float dt;
        uniform float dissipation;
    
        vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
            vec2 st = uv / tsize - 0.5;
    
            vec2 iuv = floor(st);
            vec2 fuv = fract(st);
    
            vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
            vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
            vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
            vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    
            return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
        }
    
        void main () {
        #ifdef MANUAL_FILTERING
            vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
            vec4 result = bilerp(uSource, coord, dyeTexelSize);
        #else
            vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
            vec4 result = texture2D(uSource, coord);
        #endif
            float decay = 1.0 + dissipation * dt;
            gl_FragColor = result / decay;
        }`,
        ext.supportLinearFiltering ? null : ['MANUAL_FILTERING']
    ));

    setDivergenceShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uVelocity, vL).x;
            float R = texture2D(uVelocity, vR).x;
            float T = texture2D(uVelocity, vT).y;
            float B = texture2D(uVelocity, vB).y;
    
            vec2 C = texture2D(uVelocity, vUv).xy;
            if (vL.x < 0.0) { L = -C.x; }
            if (vR.x > 1.0) { R = -C.x; }
            if (vT.y > 1.0) { T = -C.y; }
            if (vB.y < 0.0) { B = -C.y; }
    
            float div = 0.5 * (R - L + T - B);
            gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
        }
    `));

    setCurlShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uVelocity, vL).y;
            float R = texture2D(uVelocity, vR).y;
            float T = texture2D(uVelocity, vT).x;
            float B = texture2D(uVelocity, vB).x;
            float vorticity = R - L - T + B;
            gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
        }
    `));

    setVorticityShader(compileShader(gl.FRAGMENT_SHADER, `
        precision highp float;
        precision highp sampler2D;
    
        varying vec2 vUv;
        varying vec2 vL;
        varying vec2 vR;
        varying vec2 vT;
        varying vec2 vB;
        uniform sampler2D uVelocity;
        uniform sampler2D uCurl;
        uniform float curl;
        uniform float dt;
    
        void main () {
            float L = texture2D(uCurl, vL).x;
            float R = texture2D(uCurl, vR).x;
            float T = texture2D(uCurl, vT).x;
            float B = texture2D(uCurl, vB).x;
            float C = texture2D(uCurl, vUv).x;
    
            vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
            force /= length(force) + 0.0001;
            force *= curl * C;
            force.y *= -1.0;
    
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity += force * dt;
            velocity = min(max(velocity, -1000.0), 1000.0);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `));

    setPressureShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uDivergence;
    
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            float C = texture2D(uPressure, vUv).x;
            float divergence = texture2D(uDivergence, vUv).x;
            float pressure = (L + R + B + T - divergence) * 0.25;
            gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
        }
    `));

    setGradientSubtractShader(compileShader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        precision mediump sampler2D;
    
        varying highp vec2 vUv;
        varying highp vec2 vL;
        varying highp vec2 vR;
        varying highp vec2 vT;
        varying highp vec2 vB;
        uniform sampler2D uPressure;
        uniform sampler2D uVelocity;
    
        void main () {
            float L = texture2D(uPressure, vL).x;
            float R = texture2D(uPressure, vR).x;
            float T = texture2D(uPressure, vT).x;
            float B = texture2D(uPressure, vB).x;
            vec2 velocity = texture2D(uVelocity, vUv).xy;
            velocity.xy -= vec2(R - L, T - B);
            gl_FragColor = vec4(velocity, 0.0, 1.0);
        }
    `));
}

/**
 * Inizializza tutti i programmi di shader e carica la texture di dithering.
 * Crea programmi per varie operazioni come sfocatura, copia, pulizia, e effetti grafici.
 */
export function initPrograms() {
    setDitheringTexture(createTextureAsync(textureUrl));

    setBlurProgram(new Program(blurVertexShader, blurShader));
    setCopyProgram(new Program(baseVertexShader, copyShader));
    setClearProgram(new Program(baseVertexShader, clearShader));
    setColorProgram(new Program(baseVertexShader, colorShader));
    setCheckerboardProgram(new Program(baseVertexShader, checkerboardShader));
    setBloomPrefilterProgram(new Program(baseVertexShader, bloomPrefilterShader));
    setBloomBlurProgram(new Program(baseVertexShader, bloomBlurShader));
    setBloomFinalProgram(new Program(baseVertexShader, bloomFinalShader));
    setSunraysMaskProgram(new Program(baseVertexShader, sunraysMaskShader));
    setSunraysProgram(new Program(baseVertexShader, sunraysShader));
    setSplatProgram(new Program(baseVertexShader, splatShader));
    setAdvectionProgram(new Program(baseVertexShader, advectionShader));
    setDivergenceProgram(new Program(baseVertexShader, divergenceShader));
    setCurlProgram(new Program(baseVertexShader, curlShader));
    setVorticityProgram(new Program(baseVertexShader, vorticityShader));
    setPressureProgram(new Program(baseVertexShader, pressureShader));
    setGradienSubtractProgram(new Program(baseVertexShader, gradientSubtractShader));

    setDisplayMaterial(new Material(baseVertexShader, displayShaderSource));
}

/**
 * Rappresenta un programma di shader WebGL, composto da un vertex shader e un fragment shader.
 */
class Program {
    constructor(vertexShader, fragmentShader) {
        this.uniforms = {};
        this.program = createProgram(vertexShader, fragmentShader);
        this.uniforms = getUniforms(this.program);
        this.checkErrors();
    }

    checkErrors() {
        // Aggiungi codice per controllare errori di compilazione/linking degli shader
        const info = gl.getProgramInfoLog(this.program);
        if (info.length > 0) {
            console.error('Shader program error:', info);
        }
    }

    bind() {
        gl.useProgram(this.program);
    }
}

/**
 * Gestisce la creazione e l'uso dei programmi di shader con diverse combinazioni di parole chiave.
 */
class Material {
    constructor(vertexShader, fragmentShaderSource) {
        this.vertexShader = vertexShader;
        this.fragmentShaderSource = fragmentShaderSource;
        this.programs = [];
        this.activeProgram = null;
        this.uniforms = [];
    }

    setKeywords(keywords) {
        let hash = 0;
        for (let i = 0; i < keywords.length; i++)
            hash += hashCode(keywords[i]);

        let program = this.programs[hash];
        if (program == null) {
            let fragmentShader = compileShader(gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
            program = createProgram(this.vertexShader, fragmentShader);
            this.programs[hash] = program;
        }

        if (program == this.activeProgram) return;

        this.uniforms = getUniforms(program);
        this.activeProgram = program;
    }

    bind() {
        gl.useProgram(this.activeProgram);
    }
}