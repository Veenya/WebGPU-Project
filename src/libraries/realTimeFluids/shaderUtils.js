import { gl, config, displayMaterial } from "./variables";

/**
 * Calcola un hash numerico per una stringa utilizzando un algoritmo semplice.
 * Questo hash può essere utilizzato per identificare in modo univoco una stringa
 * in contesti come la gestione delle parole chiave per gli shader.
 * 
 * @param {string} s - La stringa da cui calcolare l'hash.
 * @returns {number} - L'hash numerico della stringa.
 */
export function hashCode (s) {
    if (s.length == 0) return 0;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

/**
 * Compila uno shader WebGL dal codice sorgente fornito, applicando le parole chiave se necessario.
 * 
 * @param {number} type - Il tipo di shader (gl.VERTEX_SHADER o gl.FRAGMENT_SHADER).
 * @param {string} source - Il codice sorgente dello shader.
 * @param {Array<string>} keywords - Array di parole chiave da aggiungere al codice sorgente.
 * @returns {WebGLShader} - Lo shader compilato.
 */
export function compileShader (type, source, keywords) {
    source = addKeywords(source, keywords);

    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.trace(gl.getShaderInfoLog(shader));

    return shader;
};

/**
 * Crea un programma WebGL combinando un vertex shader e un fragment shader.
 * 
 * @param {WebGLShader} vertexShader - Il vertex shader da allegare al programma.
 * @param {WebGLShader} fragmentShader - Il fragment shader da allegare al programma.
 * @returns {WebGLProgram} - Il programma WebGL creato e collegato.
 */
export function createProgram (vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        console.trace(gl.getProgramInfoLog(program));

    return program;
}

/**
 * Aggiunge definizioni di parole chiave al codice sorgente dello shader.
 * Questo è utile per attivare o disattivare specifiche funzionalità nel codice GLSL
 * a seconda delle parole chiave fornite. Ogni parola chiave viene inserita come 
 * direttiva `#define` all'inizio del codice sorgente dello shader.
 *
 * @param {string} source - Il codice sorgente dello shader in formato stringa.
 * @param {Array<string>} keywords - Un array di parole chiave da aggiungere al codice sorgente.
 * @returns {string} - Il codice sorgente aggiornato con le parole chiave aggiunte.
 */
function addKeywords (source, keywords) {
    if (keywords == null) return source;
    let keywordsString = '';
    keywords.forEach(keyword => {
        keywordsString += '#define ' + keyword + '\n';
    });
    return keywordsString + source;
}

/**
 * Aggiorna le parole chiave attive per il materiale di visualizzazione
 * in base alla configurazione corrente. Questo metodo verifica le impostazioni
 * della configurazione globale e costruisce un array di parole chiave che
 * vengono poi applicate al materiale tramite `displayMaterial.setKeywords`.
 *
 * Le parole chiave gestite includono:
 * - "SHADING" se l'effetto di shading è abilitato
 * - "BLOOM" se l'effetto bloom è abilitato
 * - "SUNRAYS" se l'effetto sunrays è abilitato
 */
export function updateKeywords () {
    let displayKeywords = [];
    if (config.SHADING) displayKeywords.push("SHADING");
    if (config.BLOOM) displayKeywords.push("BLOOM");
    if (config.SUNRAYS) displayKeywords.push("SUNRAYS");
    displayMaterial.setKeywords(displayKeywords);
}

/**
 * Recupera tutte le variabili uniformi di un programma shader WebGL.
 * 
 * Questa funzione restituisce un oggetto dove le chiavi sono i nomi delle variabili uniformi
 * e i valori sono le posizioni degli uniformi (location) nel programma shader specificato.
 * 
 * @param {WebGLProgram} program - Il programma shader WebGL da cui recuperare le variabili uniformi.
 * 
 * @returns {Object} - Un oggetto che mappa i nomi delle variabili uniformi alle loro posizioni nel programma shader.
 */
export function getUniforms (program) {
    let uniforms = [];
    let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
        let uniformName = gl.getActiveUniform(program, i).name;
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
    return uniforms;
}