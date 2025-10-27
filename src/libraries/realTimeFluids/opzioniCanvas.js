import { scaleByPixelRatio } from "./utils";

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
export function resizeManualCanvas (canvas) {
    let width = scaleByPixelRatio(canvas.clientWidth);
    let height = scaleByPixelRatio(canvas.clientHeight);
    if (canvas.width != width || canvas.height != height) {
        canvas.width = width;
        canvas.height = height;
        return true;
    }
    return false;
}