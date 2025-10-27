import { splatProgram } from "./variables";
import { blit, canvas, config, gl } from "./variables";
import { dye, velocity } from "./variables";
import { correctRadius } from "./utils";
import { generateColor } from "./colorUtils";

/**
 * Applica uno "splat" basato sulle coordinate e l'input del puntatore.
 * Utilizza il colore e la forza specificati dal puntatore per influenzare la simulazione.
 * 
 * @param {Object} pointer - L'oggetto puntatore contenente le informazioni di input.
 * @param {number} pointer.deltaX - La variazione della posizione X del puntatore.
 * @param {number} pointer.deltaY - La variazione della posizione Y del puntatore.
 * @param {number} pointer.texcoordX - La coordinata X del puntatore nella texture.
 * @param {number} pointer.texcoordY - La coordinata Y del puntatore nella texture.
 * @param {Object} pointer.color - Il colore da applicare nello splat.
 */
export function splatPointer (pointer) {
    let dx = pointer.deltaX * config.SPLAT_FORCE;
    let dy = pointer.deltaY * config.SPLAT_FORCE;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
}


/**
 * Applica un numero casuale di "splat" alla simulazione.
 * Genera e applica splat con colori e direzioni casuali.
 * 
 * @param {number} amount - Il numero di splat casuali da applicare.
 */
export function multipleSplats (amount) {
    for (let i = 0; i < amount; i++) {
        const color = generateColor();
        color.r *= 10.0;
        color.g *= 10.0;
        color.b *= 10.0;
        const x = Math.random();
        const y = Math.random();
        const dx = 1000 * (Math.random() - 0.5);
        const dy = 1000 * (Math.random() - 0.5);
        splat(x, y, dx, dy, color);
    }
}

/**
 * Applica uno "splat" alla simulazione in base ai parametri specificati.
 * Modifica le texture di velocità e colore in base alla posizione e alla forza del "splat".
 * 
 * @param {number} x - La coordinata X del punto di splat nella texture.
 * @param {number} y - La coordinata Y del punto di splat nella texture.
 * @param {number} dx - La forza della componente X del "splat".
 * @param {number} dy - La forza della componente Y del "splat".
 * @param {Object} color - Il colore da applicare al "splat".
 * @param {number} color.r - La componente rossa del colore.
 * @param {number} color.g - La componente verde del colore.
 * @param {number} color.b - La componente blu del colore.
 */
export function splat (x, y, dx, dy, color) {
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
    blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
}