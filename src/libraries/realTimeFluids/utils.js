import { canvas, gl, lastValues } from "./variables";

/**
 * Adatta il raggio di un effetto in base all'aspetto del canvas.
 * Questa funzione tiene conto del rapporto di aspetto del canvas per garantire
 * che l'effetto mantenga le proporzioni corrette.
 * 
 * @param {number} radius - Il raggio originale dell'effetto.
 * @returns {number} Il raggio corretto, adattato in base all'aspetto del canvas.
 */
export function correctRadius(radius) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1)
        radius *= aspectRatio;
    return radius;
}

/**
 * Avvolge un valore all'interno di un intervallo specificato.
 * 
 * @param {number} value - Il valore da avvolgere.
 * @param {number} min - Il limite inferiore dell'intervallo.
 * @param {number} max - Il limite superiore dell'intervallo.
 * @returns {number} Il valore avvolto all'interno dell'intervallo.
 */
export function wrap(value, min, max) {
    let range = max - min;
    if (range == 0) return min;
    return (value - min) % range + min;
}

/**
 * Calcola le dimensioni della risoluzione in base all'aspect ratio.
 * 
 * @param {number} resolution - La risoluzione desiderata.
 * @returns {Object} Un oggetto con le dimensioni `width` e `height`.
 */
export function getResolution(resolution) {
    let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
    if (aspectRatio < 1)
        aspectRatio = 1.0 / aspectRatio;

    let min = Math.round(resolution);
    let max = Math.round(resolution * aspectRatio);

    if (gl.drawingBufferWidth > gl.drawingBufferHeight)
        return { width: max, height: min };
    else
        return { width: min, height: max };
}

/**
 * Calcola la scala di una texture in base alle sue dimensioni e a quelle di un target.
 * 
 * @param {Object} texture - L'oggetto texture con proprietà `width` e `height`.
 * @param {number} width - La larghezza del target.
 * @param {number} height - L'altezza del target.
 * @returns {Object} Un oggetto con le proprietà `x` e `y` che rappresentano la scala della texture.
 */
export function getTextureScale(texture, width, height) {
    return {
        x: width / texture.width,
        y: height / texture.height
    };
}

/**
 * Scala un valore in base al rapporto di pixel del dispositivo.
 * 
 * @param {number} input - Il valore da scalare.
 * @returns {number} Il valore scalato in base al rapporto di pixel.
 */
export function scaleByPixelRatio(input) {
    let pixelRatio = window.devicePixelRatio || 1;
    return Math.floor(input * pixelRatio);
}

function getParameters() {
    parametro1 = Math.floor(Math.random() * 100) + 1;
    parametro2 = Math.floor(Math.random() * 10) + 1;
    parametro3 = Math.floor(Math.random() * 100) + 1;
    parametro4 = Math.floor(Math.random() * 100) + 1;
    parametro5 = Math.floor(Math.random() * 100) + 1;
}

function manageVorticity(parametro5) {
    let v1 = 1;
    let v2 = 50;
    let p1 = 1;
    let p2 = 100;
    let h = v1 + ((parametro5 - p1) / (p2 - p1)) * (v2 - v1);

    config.CURL = h;
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

export function mapValue(value, in_min, in_max, out_min, out_max) {
    return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

export function mapCircular(value, in_min, in_max, out_min, out_max) {
    const mapped = mapValue(value, in_min, in_max, out_min, out_max); 
    
    return mapped > 360 ? mapped - 360 : mapped;
}


export function sigmoid(x, k) {
    return 1 / (1 + Math.exp(-k * x));
}

export function mapValueWeight(value, in_min, in_max, out_min, out_max) {
    const normalizedValue = (value - in_min) / (in_max - in_min);
    const exponent = 2; 
    const distortedValue = Math.sign(normalizedValue) * Math.pow(Math.abs(normalizedValue), exponent);

    return distortedValue * (out_max - out_min) + out_min;
}

export function sumValues(...values){
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