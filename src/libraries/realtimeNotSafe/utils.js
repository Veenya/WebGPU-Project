/**
 * Scala un valore in base al rapporto di pixel del dispositivo.
 * 
 * @param {number} input - Il valore da scalare.
 * @returns {number} Il valore scalato in base al rapporto di pixel.
 */
function scaleByPixelRatio(input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

/**
 * Ridimensiona manualmente il canvas per adattarlo alla dimensione del client.
 * Questa funzione regola le dimensioni del canvas in base alla risoluzione del client,
 * tenendo conto del pixel ratio per ottenere un rendering più accurato e dettagliato.
 * Se il canvas ha dimensioni diverse da quelle calcolate, aggiorna le dimensioni e restituisce `true`.
 * Se le dimensioni sono già corrette, non fa nulla e restituisce `false`.
 *
 * @param {HTMLCanvasElement} canvas - L'elemento canvas da ridimensionare.
 * @returns {boolean} `true` se il canvas è stato ridimensionato, `false` se le dimensioni erano già corrette.
 */
export function resizeManualCanvas(canvas) {
    let width = scaleByPixelRatio(canvas.clientWidth);
    let height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}

/**
 * Verifica il supporto di un formato di texture per il rendering. 
 * Se il formato specificato non è supportato, tenta di trovare un formato alternativo compatibile.
 * 
 * @param {WebGLRenderingContext} gl - Il contesto WebGL.
 * @param {number} internalFormat - Il formato interno della texture.
 * @param {number} format - Il formato della texture.
 * @param {number} type - Il tipo di dati della texture.
 * @returns {Object|null} Un oggetto contenente il formato interno e il formato, oppure null se nessun formato compatibile viene trovato.
 */
function getSupportedFormat(gl, internalFormat, format, type) {
    if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
        switch (internalFormat) {
            case gl.R16F:
                return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
            case gl.RG16F:
                return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
            default:
                return null;
        }
    }

    return {
        internalFormat,
        format
    }
}

/**
 * Verifica se un dato formato di texture può essere utilizzato come target di rendering (render target).
 * 
 * Questa funzione crea una texture con i parametri specificati, la lega a un framebuffer, 
 * e controlla se il framebuffer è completo. Se il framebuffer è completo, il formato di texture è supportato.
 * 
 * @param {WebGLRenderingContext} gl - Il contesto WebGL.
 * @param {number} internalFormat - Il formato interno della texture.
 * @param {number} format - Il formato della texture.
 * @param {number} type - Il tipo di dati della texture.
 * @returns {boolean} `true` se il formato della texture è supportato come render target, altrimenti `false`.
 */
function supportRenderTextureFormat(gl, internalFormat, format, type) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return status == gl.FRAMEBUFFER_COMPLETE;
}

/**
 * Controlla e logga eventuali errori WebGL.
 * 
 * Questa funzione controlla gli errori di WebGL, gli errori di compilazione degli shader e
 * gli errori di linkaggio dei programmi e stampa i dettagli nella console.
 * 
 * @param {WebGLRenderingContext} gl - Il contesto WebGL da controllare.
 * @param {WebGLShader} [shader] - (Opzionale) Shader da controllare per errori di compilazione.
 * @param {WebGLProgram} [program] - (Opzionale) Programma da controllare per errori di linkaggio.
 */
export function checkWebGLErrors(gl, shader = null, program = null) {
    // Controlla gli errori generali di WebGL
    let error;
    while ((error = gl.getError()) !== gl.NO_ERROR) {
        console.error('WebGL Error:', error);
    }

    // Controlla gli errori di compilazione dello shader
    if (shader) {
        const compileStatus = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compileStatus) {
            console.error('Shader Compile Error:', gl.getShaderInfoLog(shader));
        }
    }

    // Controlla gli errori di linkaggio del programma
    if (program) {
        const linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linkStatus) {
            console.error('Program Link Error:', gl.getProgramInfoLog(program));
        }
    }
}

export function getWebGLContext(canvas) {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!isWebGL2)
        gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    let halfFloat;
    let supportLinearFiltering;
    if (isWebGL2) {
        gl.getExtension('EXT_color_buffer_float');
        supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
    } else {
        halfFloat = gl.getExtension('OES_texture_half_float');
        supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0, 0, 0, 1.0);

    const halfFloatTexType = isWebGL2 ? gl.HALF_FLOAT : halfFloat.HALF_FLOAT_OES;
    let formatRGBA;
    let formatRG;
    let formatR;

    if (isWebGL2) {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else {
        formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
    }
    checkWebGLErrors(gl);
    return {
        gl,
        ext: {
            formatRGBA,
            formatRG,
            formatR,
            halfFloatTexType,
            supportLinearFiltering
        }
    };
}

export function random(_min = 0, _max = 1) {
    return Math.random() * (_max - _min) + _min
};


export function generateColorByValue(sx1, sx2, dx1, dx2) {
    let c;
    let hue;
    let saturation;
    let value;

    const dx = dx1 + dx2;
    const sx = sx1 + sx2;
    let imbalance = sx - dx;
    const limitSup = 30;
    const limitInf = -30;
    let mappedValue;

    console.log("IMBALANCE: ", imbalance);

    if (imbalance > limitSup) {
        mappedValue = Math.random().toFixed(2);
    } else if (imbalance < limitInf) {
        mappedValue = (Math.random() - 1).toFixed(2);
    } else {
        mappedValue = mapValue(imbalance, limitInf, limitSup, -1, 1);
    }

    const k = 3;
    const sigmoideValue = sigmoid(mappedValue, k);

    hue = sigmoideValue * 300 / 360;
    saturation = 1;
    const sum = sumValues(sx1 + sx2 + dx1 + dx2) <= 90 ? sumValues(sx1 + sx2 + dx1 + dx2) : 90;
    value = mapValue(sum, 0, 90, 0, 1);
    console.log("We are in default mode: ", c);

    c = HSVtoRGB(hue, saturation, value);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
}

/**
 * Converte un colore da spazio colore HSV a RGB.
 * 
 * @param {number} h - Il valore della tonalità (hue), tra 0 e 1.
 * @param {number} s - Il valore della saturazione, tra 0 e 1.
 * @param {number} v - Il valore della luminosità (value), tra 0 e 1.
 * @returns {Object} Un oggetto con proprietà `r`, `g`, e `b`, ognuna con valori tra 0 e 1.
 */
function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {
        r,
        g,
        b
    };
}

export function sigmoid(x, k) {
    return 1 / (1 + Math.exp(-k * x));
}

export function sumValues(...values) {
    return values.reduce((acc, curr) => acc + curr, 0);
}

export function getLastValuesMean() {
    if (lastValues.length !== 5) {
        return null;
    }

    let total = 0;

    lastValues.forEach(value => {
        total += value.ch1;
        total += value.ch2;
        total += value.ch3;
        total += value.ch4;
    });

    const mean = total / 5;

    return mean;
}

export function mapValue(value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}