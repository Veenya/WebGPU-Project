/**
 * Rappresenta un puntatore (mouse o tocco) per interagire con la simulazione o l'applicazione grafica.
 * Gestisce le informazioni relative alla posizione, il movimento e lo stato del puntatore.
 */
export class pointerPrototype {
    /**
     * Crea un'istanza di pointerPrototype.
     * 
     * @param {HTMLCanvasElement} canvas - Il canvas su cui il puntatore interagisce.
     */
    constructor(canvas) {
        /**
         * Identificatore unico del puntatore.
         * @type {number}
         */
        this.id = -1;

        /**
         * Coordinata X del puntatore nella texture.
         * @type {number}
         */
        this.texcoordX = 0;

        /**
         * Coordinata Y del puntatore nella texture.
         * @type {number}
         */
        this.texcoordY = 0;

        /**
         * Coordinata X precedente del puntatore.
         * @type {number}
         */
        this.prevTexcoordX = 0;

        /**
         * Coordinata Y precedente del puntatore.
         * @type {number}
         */
        this.prevTexcoordY = 0;

        /**
         * Delta X del puntatore (cambiamento nella posizione X).
         * @type {number}
         */
        this.deltaX = 0;

        /**
         * Delta Y del puntatore (cambiamento nella posizione Y).
         * @type {number}
         */
        this.deltaY = 0;

        /**
         * Indica se il puntatore è attualmente premuto.
         * @type {boolean}
         */
        this.down = false;

        /**
         * Indica se il puntatore si è mosso.
         * @type {boolean}
         */
        this.moved = false;

        /**
         * Colore associato al puntatore.
         * @type {number[]}
         * @property {number} color[0] - Componente rossa del colore.
         * @property {number} color[1] - Componente verde del colore.
         * @property {number} color[2] - Componente blu del colore.
         */
        this.color = [30, 0, 300];
    }
}

/**
 * Aggiorna i dati del puntatore quando viene premuto.
 * 
 * @param {pointerPrototype} pointer - L'oggetto puntatore da aggiornare.
 * @param {number} id - L'identificatore del puntatore.
 * @param {number} posX - La posizione X del puntatore nel canvas.
 * @param {number} posY - La posizione Y del puntatore nel canvas.
 */
function updatePointerDownData (pointer, id, posX, posY) {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    pointer.color = generateColor();
}

/**
 * Aggiorna i dati del puntatore quando viene spostato.
 * 
 * @param {pointerPrototype} pointer - L'oggetto puntatore da aggiornare.
 * @param {number} posX - La nuova posizione X del puntatore nel canvas.
 * @param {number} posY - La nuova posizione Y del puntatore nel canvas.
 */
function updatePointerMoveData (pointer, posX, posY) {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / canvas.width;
    pointer.texcoordY = 1.0 - posY / canvas.height;
    pointer.deltaX = correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
}

/**
 * Aggiorna i dati del puntatore quando viene rilasciato.
 * 
 * @param {pointerPrototype} pointer - L'oggetto puntatore da aggiornare.
 */
function updatePointerUpData (pointer) {
    pointer.down = false;
}

/**
 * Corregge il delta X del movimento del puntatore in base all'aspect ratio del canvas.
 * 
 * @param {number} delta - Il delta X da correggere.
 * @returns {number} Il delta X corretto.
 */
function correctDeltaX(delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio < 1) delta *= aspectRatio;
    return delta;
}

/**
 * Corregge il delta Y del movimento del puntatore in base all'aspect ratio del canvas.
 * 
 * @param {number} delta - Il delta Y da correggere.
 * @returns {number} Il delta Y corretto.
 */
function correctDeltaY(delta) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1) delta /= aspectRatio;
    return delta;
}