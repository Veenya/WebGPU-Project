import { config, gl, ext } from "./variables";
import { getResolution } from "./utils";
import { dye, velocity, divergence, curl, pressure, bloom, sunrays, sunraysTemp } from "./variables";
import { setDye, setVelocity, setDivergence, setCurl, setPressure, setBloom, setSunrays, setSunraysTemp } from "./variables";
import { addBloomFramebuffer, clearBloomFramebuffers } from "./variables";
import { blit, setBlit } from "./variables";
import { copyProgram } from "./variables";
/**
 * Verifica lo stato del framebuffer corrente e segnala eventuali errori.
 * Questa funzione controlla se il framebuffer è completamente configurato e pronto per l'uso
 * eseguendo il metodo `gl.checkFramebufferStatus()`. Se il framebuffer non è completo, viene
 * registrato un errore nella console con un messaggio dettagliato e una traccia dello stack.
 *
 * La funzione esegue le seguenti azioni:
 * 1. Verifica lo stato del framebuffer corrente utilizzando `gl.checkFramebufferStatus()`.
 * 2. Se lo stato del framebuffer non è `gl.FRAMEBUFFER_COMPLETE`, stampa un messaggio di errore
 *    nella console e fornisce una traccia dello stack per facilitare il debug.
 *
 * Utilizzare questa funzione per diagnosticare problemi relativi alla configurazione dei framebuffer
 * e garantire che il framebuffer sia correttamente inizializzato e pronto per il rendering.
 */
function CHECK_FRAMEBUFFER_STATUS() {
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE){
        console.error("Framebuffer error: " + status);
        console.trace();
    }
}

/**
 * Inizializza e configura gli oggetti framebuffer (FBO) per il rendering e la simulazione.
 * Questa funzione imposta i framebuffer necessari per vari compiti di simulazione e rendering
 * in base alle impostazioni di configurazione attuali. Include la configurazione dei framebuffer
 * per il colore (dye), la velocità, la divergenza, il curl e la pressione, oltre all'inizializzazione
 * dei framebuffer per effetti aggiuntivi come il bloom e i raggi del sole.
 *
 * La funzione esegue le seguenti azioni:
 * 1. Recupera le impostazioni di risoluzione per la simulazione e il colore (dye).
 * 2. Definisce il tipo e i formati delle texture in base alle estensioni WebGL e alla configurazione.
 * 3. Disabilita la miscelazione per garantire che il contenuto del framebuffer non venga miscelato durante il rendering.
 * 4. Crea o ridimensiona i framebuffer per il colore e la velocità in base alla risoluzione corrente.
 * 5. Crea framebuffer per divergenza, curl e pressione necessari per la simulazione dei fluidi.
 * 6. Inizializza i framebuffer aggiuntivi per effetti come bloom e raggi del sole se applicabile.
 *
 * Questa configurazione è cruciale per mantenere lo stato corretto di rendering e simulazione,
 * garantendo che i framebuffer siano dimensionati e configurati correttamente per le operazioni richieste.
 */
export function initFramebuffers() {
    let simRes = getResolution(config.SIM_RESOLUTION);
    let dyeRes = getResolution(config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    if (dye == null)
        setDye(createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering));
    else
        setDye(resizeDoubleFBO(dye, dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering));

    if (velocity == null)
        setVelocity(createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering));
    else
        setVelocity(resizeDoubleFBO(velocity, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering));

    setDivergence(createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST));
    setCurl(createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST));
    setPressure(createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST));

    initBloomFramebuffers();
    initSunraysFramebuffers();
    initBlit();
}

/**
 * Inizializza i framebuffer utilizzati per l'effetto Bloom.
 * Questa funzione configura il framebuffer principale per l'effetto Bloom e crea una serie di
 * framebuffer a risoluzioni decrescenti per applicare il filtro Bloom attraverso diverse iterazioni.
 *
 * La funzione esegue le seguenti azioni:
 * 1. Ottiene la risoluzione per l'effetto Bloom utilizzando `getResolution(config.BLOOM_RESOLUTION)`.
 * 2. Configura il framebuffer principale (`bloom`) con la risoluzione ottenuta e le impostazioni di formato e filtro.
 * 3. Pulisce la lista dei framebuffer per l'effetto Bloom (`bloomFramebuffers`).
 * 4. Crea e aggiunge a `bloomFramebuffers` una serie di framebuffer con risoluzioni ridotte per ogni iterazione di Bloom.
 *    - La risoluzione di ciascun framebuffer è ridotta della metà ad ogni iterazione, fino a quando la larghezza
 *      o l'altezza scende sotto un valore minimo di 2 pixel.
 *
 * Utilizzare questa funzione per inizializzare i framebuffer necessari per applicare l'effetto Bloom in rendering
 * e per gestire le diverse fasi del processo di post-elaborazione dell'immagine.
 */
function initBloomFramebuffers() {
    let res = getResolution(config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    setBloom(createFBO(res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering));

    clearBloomFramebuffers();
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
        let width = res.width >> (i + 1);
        let height = res.height >> (i + 1);

        if (width < 2 || height < 2) break;

        let fbo = createFBO(width, height, rgba.internalFormat, rgba.format, texType, filtering);
        addBloomFramebuffer(fbo);
    }

    console.log(bloom);
}

/**
 * Inizializza i framebuffer utilizzati per l'effetto Sunrays.
 * Questa funzione configura i framebuffer necessari per l'elaborazione dell'effetto Sunrays,
 * creando due framebuffer con la risoluzione specificata per l'effetto Sunrays e le impostazioni appropriate.
 *
 * La funzione esegue le seguenti azioni:
 * 1. Ottiene la risoluzione per l'effetto Sunrays utilizzando `getResolution(config.SUNRAYS_RESOLUTION)`.
 * 2. Configura due framebuffer:
 *    - `sunrays`: Il framebuffer principale utilizzato per applicare l'effetto Sunrays.
 *    - `sunraysTemp`: Un framebuffer temporaneo utilizzato come passaggio intermedio durante il processo di rendering.
 * 3. Imposta i framebuffer con il formato di texture, il tipo e il filtro specificati.
 *
 * Utilizzare questa funzione per preparare i framebuffer necessari per applicare e gestire l'effetto Sunrays
 * nel processo di rendering e nella post-elaborazione dell'immagine.
 */
function initSunraysFramebuffers() {
    let res = getResolution(config.SUNRAYS_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const r = ext.formatR;
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    setSunrays(createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering));
    setSunraysTemp(createFBO(res.width, res.height, r.internalFormat, r.format, texType, filtering));
}

/**
 * Crea e configura un framebuffer con una texture associata.
 * 
 * Questa funzione crea una texture e un framebuffer in WebGL, configura i parametri della texture e
 * associa la texture al framebuffer. Imposta anche il viewport e cancella il buffer di colore.
 * 
 * @param {number} w - La larghezza della texture e del framebuffer.
 * @param {number} h - L'altezza della texture e del framebuffer.
 * @param {number} internalFormat - Il formato interno della texture, definito da WebGL (es. `gl.RGBA`).
 * @param {number} format - Il formato della texture, definito da WebGL (es. `gl.RGBA`).
 * @param {number} type - Il tipo di dati della texture, definito da WebGL (es. `gl.FLOAT`).
 * @param {number} param - Il parametro di filtro per la texture, definito da WebGL (es. `gl.NEAREST` o `gl.LINEAR`).
 * 
 * @returns {Object} Un oggetto contenente:
 *   - `texture`: La texture WebGL creata.
 *   - `fbo`: Il framebuffer WebGL creato.
 *   - `width`: La larghezza della texture e del framebuffer.
 *   - `height`: L'altezza della texture e del framebuffer.
 *   - `texelSizeX`: La dimensione del texel in direzione X (1 / larghezza).
 *   - `texelSizeY`: La dimensione del texel in direzione Y (1 / altezza).
 *   - `attach(id)`: Una funzione che associa la texture al punto di texture specificato (`id`).
 */
function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    CHECK_FRAMEBUFFER_STATUS();
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let texelSizeX = 1.0 / w;
    let texelSizeY = 1.0 / h;

    return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX,
        texelSizeY,
        attach(id) {
            gl.activeTexture(gl.TEXTURE0 + id);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            return id;
        }
    };
}

/**
 * Crea un framebuffer a doppio buffer con due texture e framebuffers associati.
 * 
 * Questa funzione crea due framebuffers e due texture, configurati con le stesse dimensioni e formati.
 * La struttura risultante consente di alternare tra i due framebuffers per la lettura e la scrittura,
 * facilitando operazioni come il ping-pong buffering in rendering o simulazioni.
 * 
 * @param {number} w - La larghezza delle texture e dei framebuffers.
 * @param {number} h - L'altezza delle texture e dei framebuffers.
 * @param {number} internalFormat - Il formato interno delle texture, definito da WebGL (es. `gl.RGBA`).
 * @param {number} format - Il formato delle texture, definito da WebGL (es. `gl.RGBA`).
 * @param {number} type - Il tipo di dati delle texture, definito da WebGL (es. `gl.FLOAT`).
 * @param {number} param - Il parametro di filtro per le texture, definito da WebGL (es. `gl.NEAREST` o `gl.LINEAR`).
 * 
 * @returns {Object} Un oggetto contenente:
 *   - `width`: La larghezza delle texture e dei framebuffers.
 *   - `height`: L'altezza delle texture e dei framebuffers.
 *   - `texelSizeX`: La dimensione del texel in direzione X (1 / larghezza).
 *   - `texelSizeY`: La dimensione del texel in direzione Y (1 / altezza).
 *   - `read`: Una proprietà getter/setter per il framebuffer attualmente utilizzato per la lettura.
 *   - `write`: Una proprietà getter/setter per il framebuffer attualmente utilizzato per la scrittura.
 *   - `swap()`: Una funzione che scambia i framebuffers utilizzati per la lettura e la scrittura.
 */
function createDoubleFBO(w, h, internalFormat, format, type, param) {
    let fbo1 = createFBO(w, h, internalFormat, format, type, param);
    let fbo2 = createFBO(w, h, internalFormat, format, type, param);

    return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
            return fbo1;
        },
        set read(value) {
            fbo1 = value;
        },
        get write() {
            return fbo2;
        },
        set write(value) {
            fbo2 = value;
        },
        swap() {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}

/**
 * Ridimensiona un framebuffer esistente e copia il contenuto del framebuffer originale nel nuovo.
 * 
 * Questa funzione crea un nuovo framebuffer con le dimensioni specificate e copia il contenuto
 * del framebuffer esistente (`target`) nel nuovo framebuffer. Utilizza un programma di copia
 * per eseguire questa operazione.
 * 
 * @param {Object} target - Il framebuffer esistente da cui copiare i dati.
 * @param {number} w - La nuova larghezza del framebuffer.
 * @param {number} h - La nuova altezza del framebuffer.
 * @param {number} internalFormat - Il formato interno delle texture del nuovo framebuffer.
 * @param {number} format - Il formato delle texture del nuovo framebuffer.
 * @param {number} type - Il tipo di dati delle texture del nuovo framebuffer.
 * @param {number} param - Il parametro di filtro per le texture del nuovo framebuffer.
 * 
 * @returns {Object} Il nuovo framebuffer ridimensionato.
 */
function resizeFBO(target, w, h, internalFormat, format, type, param) {
    let newFBO = createFBO(w, h, internalFormat, format, type, param);
    copyProgram.bind();
    gl.uniform1i(copyProgram.uniforms.uTexture, target.attach(0));
    blit(newFBO);
    return newFBO;
}

/**
 * Ridimensiona un framebuffer a doppio buffer e aggiorna le dimensioni dei buffer di lettura e scrittura.
 * 
 * Questa funzione verifica se le dimensioni del framebuffer a doppio buffer (`target`) sono
 * già quelle richieste. Se non lo sono, ridimensiona il buffer di lettura e crea un nuovo buffer di
 * scrittura con le nuove dimensioni. Aggiorna anche le proprietà di dimensione del framebuffer.
 * 
 * @param {Object} target - Il framebuffer a doppio buffer da ridimensionare.
 * @param {number} w - La nuova larghezza del framebuffer.
 * @param {number} h - La nuova altezza del framebuffer.
 * @param {number} internalFormat - Il formato interno delle texture dei nuovi framebuffers.
 * @param {number} format - Il formato delle texture dei nuovi framebuffers.
 * @param {number} type - Il tipo di dati delle texture dei nuovi framebuffers.
 * @param {number} param - Il parametro di filtro per le texture dei nuovi framebuffers.
 * 
 * @returns {Object} Il framebuffer a doppio buffer ridimensionato.
 */
function resizeDoubleFBO(target, w, h, internalFormat, format, type, param) {
    if (target.width == w && target.height == h)
        return target;
    target.read = resizeFBO(target.read, w, h, internalFormat, format, type, param);
    target.write = createFBO(w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
}

function initBlit() {
    /**
     * Funzione per eseguire il blitting (trasferimento di pixel) da un framebuffer a un altro
     * o direttamente al buffer di disegno principale.
     * 
     * La funzione `blit` è utilizzata per copiare il contenuto di un framebuffer sorgente a un
     * framebuffer di destinazione o al buffer di disegno principale. Questa operazione è comune
     * in scenari di rendering avanzato, come il post-processing o la composizione di effetti grafici.
     * 
     * Funzionamento:
     * 1. **Configurazione dei buffer di vertici e indici**: 
     *    - Viene creato un buffer per i vertici e uno per gli indici che definiscono un quadrato
     *      che copre l'intera viewport. 
     *    - Il quadrato è composto da due triangoli e viene disegnato usando il buffer di indici.
     * 
     * 2. **Impostazione della viewport e del framebuffer**:
     *    - Se `target` è `null`, imposta la viewport per coprire l'intero buffer di disegno
     *      e disegna direttamente su di esso.
     *    - Se `target` è fornito, imposta la viewport e il framebuffer sul framebuffer specificato
     *      dal `target` per indirizzare il rendering su di esso.
     * 
     * 3. **Opzionale pulizia del buffer**:
     *    - Se il parametro `clear` è `true`, il buffer di colore del framebuffer corrente
     *      viene pulito con un colore nero (0.0, 0.0, 0.0, 1.0).
     * 
     * 4. **Rendering**:
     *    - Viene eseguito il disegno del quadrato usando il buffer di indici. Questo
     *      copia il contenuto del framebuffer sorgente nell'area della viewport attuale.
     * 
     * @param {Object} target - Oggetto framebuffer di destinazione o `null` per il buffer di disegno principale.
     * @param {boolean} [clear=false] - Se `true`, pulisce il buffer di colore con un colore nero.
     */
    setBlit((() => {
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(0);

        return (target, clear = false) => {
            if (target == null) {
                gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            }
            else {
                gl.viewport(0, 0, target.width, target.height);
                gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
            }
            if (clear) {
                gl.clearColor(0, 0, 0, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
            }
            CHECK_FRAMEBUFFER_STATUS();
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }
    })());
}

/**
 * Legge i dati dei pixel da un framebuffer e li restituisce come un array di valori `Float32Array`.
 * 
 * Questa funzione esegue il binding del framebuffer specificato, legge i dati dei pixel dalla sua
 * area di rendering, e ritorna i dati come un array di tipo `Float32Array`. I dati dei pixel sono letti
 * nel formato RGBA e nel tipo di dato `FLOAT`.
 * 
 * @param {Object} target - L'oggetto framebuffer da cui leggere i dati dei pixel.
 * @param {WebGLFramebuffer} target.fbo - Il framebuffer WebGL da cui leggere i dati.
 * @param {number} target.width - La larghezza del framebuffer.
 * @param {number} target.height - L'altezza del framebuffer.
 * 
 * @returns {Float32Array} - Un array di tipo `Float32Array` contenente i dati dei pixel letti dal framebuffer.
 */
function framebufferToTexture (target) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    let length = target.width * target.height * 4;
    let texture = new Float32Array(length);
    gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, texture);
    return texture;
}