import { checkWebGLErrors } from "./utils";
/**
 * alpha: true indica che il buffer di rendering deve avere un canale alfa.
 * depth: false disabilita il buffer di profondità.
 * stencil: false disabilita il buffer stencil.
 * antialias: false disabilita l'anti-aliasing.
 * preserveDrawingBuffer: false non preserva il contenuto del buffer di disegno tra i frame.
 * 
 * tenta di ottenere un contesto WebGL2. Se WebGL2 non è supportato, prova a ottenere un contesto WebGL1.
 * 
 * EXT_color_buffer_float (solo WebGL2) consente il supporto per buffer di colore a virgola mobile.
 * OES_texture_float_linear e OES_texture_half_float_linear abilitano il filtering lineare per texture float e half-float.
 * 
 * Imposta il colore di pulizia per il buffer di colore (nero opaco).
 * 
 * Determina il tipo di texture half-float da usare, a seconda che si utilizzi WebGL2 o WebGL1.
 * 
 * Determina i formati di texture supportati per vari canali (RGBA, RG, R), utilizzando la funzione getSupportedFormat
 * 
 * @param {*} canvas 
 * 
 * @returns un oggetto contenente il contesto WebGL (gl) e un oggetto ext che contiene le estensioni e i formati di texture configurati.
 */
export function getWebGLContext (canvas) {
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

    if (isWebGL2)
    {
        formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
        formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
        formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    }
    else
    {
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
function getSupportedFormat (gl, internalFormat, format, type)
{
    if (!supportRenderTextureFormat(gl, internalFormat, format, type))
    {
        switch (internalFormat)
        {
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
function supportRenderTextureFormat (gl, internalFormat, format, type) {
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
    return status == gl.FRAMEBUFFER_COMPLETE;
}