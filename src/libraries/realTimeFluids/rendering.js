import { lastUpdateTime, setLastUpdateTime, colorUpdateTimer, setColorUpdateTimer } from "./variables";
import { resizeManualCanvas } from "./opzioniCanvas";
import { initFramebuffers } from "./framebuffer";
import { colorUpdateTimer, setColorUpdateTimer, addColorUpdateTimer } from "./variables";
import { pointers, splatStack } from "./variables";
import { generateColor, normalizeColor } from "./colorUtils";
import { config, gl, ext, canvas } from "./variables";
import { multipleSplats, splatPointer } from "./splat";
import { curlProgram, vorticityProgram, divergenceProgram, clearProgram, pressureProgram, gradienSubtractProgram, advectionProgram, colorProgram, checkerboardProgram, bloomPrefilterProgram, bloomBlurProgram, bloomFinalProgram, sunraysMaskProgram, sunraysProgram, blurProgram } from "./variables";
import { velocity, curl, divergence, pressure, dye, bloom, sunrays, sunraysTemp, displayMaterial, ditheringTexture, bloomFramebuffers } from "./variables";
import { getTextureScale, wrap } from "./utils";
import { blit } from "./variables";

/**
 * Funzione di aggiornamento e rendering principale dell'applicazione.
 * 
 * Calcola il delta time, aggiorna le dimensioni del canvas, applica gli input,
 * esegue i passi della simulazione se non è in pausa, e infine esegue il rendering.
 * 
 * @param {HTMLCanvasElement} canvas - Il canvas HTML su cui eseguire il rendering.
 */
export function update (canvas) {
    const dt = calcDeltaTime();
    if (resizeManualCanvas(canvas)){
        console.log("Resize");
        initFramebuffers();
    }
    updateColors(dt);
    applyInputs();
    if (!config.PAUSED)
        step(dt);
    render(null);
}

/**
 * Aggiorna i colori dei puntatori se la modalità colorata è abilitata.
 * 
 * La funzione aggiorna i colori dei puntatori in base al tempo trascorso
 * e alla velocità di aggiornamento dei colori configurata.
 * 
 * @param {number} dt - Il delta time in secondi dal frame precedente.
 */
function updateColors (dt) {
    if (!config.COLORFUL) return;

    addColorUpdateTimer(dt * config.COLOR_UPDATE_SPEED);
    if (colorUpdateTimer >= 1) {
        setColorUpdateTimer(wrap(colorUpdateTimer, 0, 1));
        pointers.forEach(p => {
            p.color = generateColor();
        });
    }
}

/**
 * Applica gli input dell'utente, inclusi i "splat" e i movimenti dei puntatori.
 * 
 * La funzione gestisce l'applicazione dei "splat" dalla pila e aggiorna i puntatori
 * se sono stati spostati dall'utente.
 */
function applyInputs () {
    if (splatStack.length > 0)
        multipleSplats(splatStack.pop());

    pointers.forEach(p => {
        if (p.moved) {
            p.moved = false;
            splatPointer(p);
        }
    });
}

/**
 * Limita un valore all'interno dell'intervallo [0, 1].
 * 
 * Questa funzione assicura che il valore fornito non superi i limiti inferiore
 * e superiore di 0 e 1 rispettivamente. Utilizzata per normalizzare valori
 * che devono essere compresi tra 0 e 1.
 * 
 * @param {number} input - Il valore da limitare.
 * 
 * @returns {number} - Il valore limitato all'interno dell'intervallo [0, 1].
 */
export function clamp01 (input) {
    return Math.min(Math.max(input, 0), 1);
}

/**
 * Avvia il download di un file utilizzando un Data URI.
 * 
 * Questa funzione crea un link temporaneo per avviare il download del file specificato
 * utilizzando un Data URI. Il link viene aggiunto al DOM, cliccato per avviare il download
 * e poi rimosso.
 * 
 * @param {string} filename - Il nome del file da salvare.
 * @param {string} uri - Il Data URI contenente i dati del file.
 */
function downloadURI (filename, uri) {
    let link = document.createElement('a');
    link.download = filename;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Calcola il tempo trascorso dall'ultimo aggiornamento.
 * 
 * Questo valore è utilizzato per determinare il delta time per aggiornamenti e simulazioni.
 * 
 * @returns {number} - Il delta time in secondi, limitato a 0.016666 secondi (60 FPS).
 */
function calcDeltaTime () {
    let now = Date.now();
    let dt = (now - lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    setLastUpdateTime(now);
    return dt;
}

/**
 * Esegue un passo della simulazione, aggiornando i vari buffer di simulazione
 * utilizzando diversi shader.
 * 
 * La funzione applica una serie di passaggi per aggiornare le variabili della simulazione,
 * tra cui la vorticità, la divergenza e la pressione, e applica la dissipazione della velocità
 * e della densità. Ogni passaggio utilizza un diverso programma shader e framebuffer
 * per ottenere il risultato desiderato.
 * 
 * @param {number} dt - Il delta time in secondi dal frame precedente.
 */
function step (dt) {
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    blit(velocity.write);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
    }

    gradienSubtractProgram.bind();
    gl.uniform2f(gradienSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradienSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradienSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    let velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    if (!ext.supportLinearFiltering)
        gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
}

/**
 * Gestisce il rendering finale della scena. Applica effetti come bloom e raggi solari
 * e disegna la scena finale in base alle impostazioni di configurazione.
 * 
 * @param {WebGLFramebuffer} [target=null] - Il framebuffer di destinazione per il rendering. Se `null`, il rendering è diretto al buffer di disegno.
 */
function render (target) {
    if (config.BLOOM)
        applyBloom(dye.read, bloom);
    if (config.SUNRAYS) {
        applySunrays(dye.read, dye.write, sunrays);
        blur(sunrays, sunraysTemp, 1);
    }

    if (target == null || !config.TRANSPARENT) {
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
    }
    else {
        gl.disable(gl.BLEND);
    }

    if (!config.TRANSPARENT)
        drawColor(target, normalizeColor(config.BACK_COLOR));
    if (target == null && config.TRANSPARENT)
        drawCheckerboard(target);
    drawDisplay(target);
}

/**
 * Disegna uno sfondo colorato.
 * 
 * @param {WebGLFramebuffer} target - Il framebuffer di destinazione per il rendering.
 * @param {Object} color - Il colore di sfondo. Deve avere proprietà `r`, `g`, `b`, e `a`.
 */
function drawColor (target, color) {
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    blit(target);
}

/**
 * Disegna uno sfondo a scacchiera.
 * 
 * @param {WebGLFramebuffer} target - Il framebuffer di destinazione per il rendering.
 */
function drawCheckerboard (target) {
    checkerboardProgram.bind();
    gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    blit(target);
}

/**
 * Disegna il contenuto finale sul framebuffer di destinazione.
 * 
 * @param {WebGLFramebuffer} target - Il framebuffer di destinazione per il rendering.
 */
function drawDisplay (target) {
    let width = target == null ? gl.drawingBufferWidth : target.width;
    let height = target == null ? gl.drawingBufferHeight : target.height;

    displayMaterial.bind();
    if (config.SHADING)
        gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
        gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
        gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
        let scale = getTextureScale(ditheringTexture, width, height);
        gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS)
        gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    blit(target);
}

/**
 * Applica l'effetto bloom al framebuffer di destinazione.
 * 
 * @param {WebGLTexture} source - La texture di origine da cui applicare il bloom.
 * @param {WebGLFramebuffer} destination - Il framebuffer di destinazione per l'effetto bloom.
 */
function applyBloom (source, destination) {
    if (bloomFramebuffers.length < 2)
        return;

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    let knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    let curve0 = config.BLOOM_THRESHOLD - knee;
    let curve1 = knee * 2;
    let curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    blit(last);

    bloomBlurProgram.bind();
    for (let i = 0; i < bloomFramebuffers.length; i++) {
        let dest = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        blit(dest);
        last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = bloomFramebuffers.length - 2; i >= 0; i--) {
        let baseTex = bloomFramebuffers[i];
        gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
        gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
        gl.viewport(0, 0, baseTex.width, baseTex.height);
        blit(baseTex);
        last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    blit(destination);
}

/**
 * Applica l'effetto dei raggi solari al framebuffer di destinazione.
 * 
 * @param {WebGLTexture} source - La texture di origine da cui applicare l'effetto dei raggi solari.
 * @param {WebGLFramebuffer} mask - Il framebuffer che funge da maschera per l'effetto dei raggi solari.
 * @param {WebGLFramebuffer} destination - Il framebuffer di destinazione per l'effetto dei raggi solari.
 */
function applySunrays (source, mask, destination) {
    gl.disable(gl.BLEND);
    sunraysMaskProgram.bind();
    gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    blit(mask);

    sunraysProgram.bind();
    gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
    gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
    blit(destination);
}


/**
 * Applica un effetto di sfocatura alla texture di destinazione.
 * Utilizza un buffer temporaneo e un programma di shader di blur per eseguire l'effetto.
 * 
 * @param {WebGLFramebuffer} target - Il framebuffer di destinazione su cui applicare la sfocatura.
 * @param {WebGLFramebuffer} temp - Il framebuffer temporaneo utilizzato per la sfocatura.
 * @param {number} iterations - Il numero di iterazioni di sfocatura da eseguire.
 */
function blur (target, temp, iterations) {
    blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
        gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
        gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
        blit(temp);

        gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
        gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
        blit(target);
    }
}