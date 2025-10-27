import { gl } from "./variables";
import { clamp01 } from "./rendering";
/**
 * Crea una texture WebGL e la carica asincronicamente da un URL.
 * @param {string} url - L'URL dell'immagine da caricare come texture
 * @returns {Object} - Un oggetto contenente la texture e metodi per gestirla
 */
export function createTextureAsync (url) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

    let obj = {
        texture,
        width: 1,
        height: 1,
        attach (id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };

    let image = new Image();
    image.onload = () => {
        obj.width = image.width;
        obj.height = image.height;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    };
    image.src = url;

    return obj;
}

/**
 * Normalizza i dati di una texture per la visualizzazione, convertendo i valori dei pixel
 * da un intervallo di tipo `Float32Array` a un intervallo di valori `Uint8Array` compresi tra 0 e 255.
 * 
 * Questa funzione legge i dati di una texture in formato float (da 0 a 1), li normalizza,
 * e restituisce un array di tipo `Uint8Array` pronto per l'uso in un canvas o come texture 
 * per la visualizzazione. I dati della texture sono invertiti verticalmente per adattarsi
 * ai requisiti di visualizzazione della maggior parte dei sistemi di rendering.
 * 
 * @param {Float32Array} texture - L'array di dati della texture da normalizzare, nel formato float.
 * @param {number} width - La larghezza della texture.
 * @param {number} height - L'altezza della texture.
 * 
 * @returns {Uint8Array} - Un array di tipo `Uint8Array` contenente i dati normalizzati della texture.
 */
export function normalizeTexture (texture, width, height) {
    let result = new Uint8Array(texture.length);
    let id = 0;
    for (let i = height - 1; i >= 0; i--) {
        for (let j = 0; j < width; j++) {
            let nid = i * width * 4 + j * 4;
            result[nid + 0] = clamp01(texture[id + 0]) * 255;
            result[nid + 1] = clamp01(texture[id + 1]) * 255;
            result[nid + 2] = clamp01(texture[id + 2]) * 255;
            result[nid + 3] = clamp01(texture[id + 3]) * 255;
            id += 4;
        }
    }
    return result;
}

/**
 * Converte i dati di una texture in un elemento canvas HTML.
 * 
 * Questa funzione crea un nuovo canvas HTML e utilizza i dati della texture
 * per riempire l'immagine del canvas. La texture è rappresentata come un array
 * di dati di pixel, che vengono utilizzati per generare un'immagine che può essere
 * visualizzata o manipolata ulteriormente.
 * 
 * @param {Uint8Array} texture - L'array di dati della texture, nel formato `Uint8Array`, da convertire.
 * @param {number} width - La larghezza della texture.
 * @param {number} height - L'altezza della texture.
 * 
 * @returns {HTMLCanvasElement} - Il canvas HTML contenente l'immagine rappresentata dalla texture.
 */
function textureToCanvas (texture, width, height) {
    let captureCanvas = document.createElement('canvas');
    let ctx = captureCanvas.getContext('2d');
    captureCanvas.width = width;
    captureCanvas.height = height;

    let imageData = ctx.createImageData(width, height);
    imageData.data.set(texture);
    ctx.putImageData(imageData, 0, 0);

    return captureCanvas;
}