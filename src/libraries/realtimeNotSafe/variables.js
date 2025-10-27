export let vertexShader, fragmentShader, program, gpuVertexShader, gpuFragmentShader;
export let gl, ext, canvas;
export let time, timeLoc, cols, rows, colorLoc, precColorLoc;
export const lastValues = [];

export function setLastValues(rtdata) {
    if(lastValues.length === 5) {
        lastValues.shift(); // Rimuove il primo elemento
    }
    lastValues.push(rtdata); // Aggiunge il nuovo valore alla fine dell'array
}
export function setRows(newRows){
    rows = newRows;
}
export function setCols(newCols){
    cols = newCols;
}
export function setTime(newTime){
    time = newTime;
}
export function setTimeLoc(newTimeLoc){
    timeLoc = newTimeLoc;
}
export function setColorLoc(newColorLoc){
    colorLoc = newColorLoc;
}
export function setPrecColorLoc(newPrecColorLoc){
    precColorLoc = newPrecColorLoc;
}
export function setWebGLContext(glNew, extNew, canvasNew){
    gl = glNew;
    ext = extNew;
    canvas = canvasNew;
}
export function setVertexShader(shaderNew){
    vertexShader = shaderNew;
}
export function setFragmentShader(shaderNew){
    fragmentShader = shaderNew;
}
export function setGPUVertexShader(shaderNew){
    gpuVertexShader = shaderNew;
}
export function setGPUFragmentShader(shaderNew){
    gpuFragmentShader = shaderNew;
}
export function setProgram(programNew){
    program = programNew;
}