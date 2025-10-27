export let config = {
    SIM_RESOLUTION: 128,
    DYE_RESOLUTION: 1024,
    CAPTURE_RESOLUTION: 512,
    DENSITY_DISSIPATION: 1,
    VELOCITY_DISSIPATION: 0.5,
    PRESSURE: 0.8,
    PRESSURE_ITERATIONS: 20,
    CURL: 30,
    SPLAT_RADIUS: 0.25,
    SPLAT_FORCE: 6000,
    SHADING: true,
    COLORFUL: true,
    COLOR_UPDATE_SPEED: 10,
    PAUSED: false,
    BACK_COLOR: { r: 0, g: 0, b: 0 },
    TRANSPARENT: false,
    BLOOM: true,
    BLOOM_ITERATIONS: 8,
    BLOOM_RESOLUTION: 256,
    BLOOM_INTENSITY: 0.8,
    BLOOM_THRESHOLD: 0.6,
    BLOOM_SOFT_KNEE: 0.7,
    SUNRAYS: true,
    SUNRAYS_RESOLUTION: 196,
    SUNRAYS_WEIGHT: 1.0
}

export let pointers = [];
export let splatStack = [];
export let lastColors = [];

export let dye, velocity, divergence, curl, pressure, bloom, sunrays, sunraysTemp;


export function setDye(newDye) {
    dye = newDye;
}

export function setVelocity(newVelocity) {
    velocity = newVelocity;
}

export function setDivergence(newDivergence) {
    divergence = newDivergence;
}

export function setCurl(newCurl) {
    curl = newCurl;
}

export function setPressure(newPressure) {
    pressure = newPressure;
}

export function setBloom(newBloom) {
    bloom = newBloom;
}

export function setSunrays(newSunrays) {
    sunrays = newSunrays;
}

export function setSunraysTemp(newSunraysTemp) {
    sunraysTemp = newSunraysTemp;
}

export let bloomFramebuffers = [];

export function addBloomFramebuffer(newFramebuffer) {
    bloomFramebuffers.push(newFramebuffer);
}
export function clearBloomFramebuffers() {
    bloomFramebuffers.length = 0;
}

export let blurProgram, copyProgram, clearProgram, colorProgram, checkerboardProgram, mcDonaldsProgram, bloomPrefilterProgram, bloomBlurProgram, bloomFinalProgram, sunraysMaskProgram, sunraysProgram, splatProgram, advectionProgram, divergenceProgram, curlProgram, vorticityProgram, pressureProgram, gradienSubtractProgram;

export function setBlurProgram(newBlurProgram) {
    blurProgram = newBlurProgram;
}

export function setCopyProgram(newCopyProgram) {
    copyProgram = newCopyProgram;
}

export function setClearProgram(newClearProgram) {
    clearProgram = newClearProgram;
}

export function setColorProgram(newColorProgram) {
    colorProgram = newColorProgram;
}

export function setCheckerboardProgram(newCheckerboardProgram) {
    checkerboardProgram = newCheckerboardProgram;
}

export function setBloomPrefilterProgram(newBloomPrefilterProgram) {
    bloomPrefilterProgram = newBloomPrefilterProgram;
}

export function setBloomBlurProgram(newBloomBlurProgram) {
    bloomBlurProgram = newBloomBlurProgram;
}

export function setBloomFinalProgram(newBloomFinalProgram) {
    bloomFinalProgram = newBloomFinalProgram;
}

export function setSunraysMaskProgram(newSunraysMaskProgram) {
    sunraysMaskProgram = newSunraysMaskProgram;
}

export function setSunraysProgram(newSunraysProgram) {
    sunraysProgram = newSunraysProgram;
}

export function setSplatProgram(newSplatProgram) {
    splatProgram = newSplatProgram;
}

export function setAdvectionProgram(newAdvectionProgram) {
    advectionProgram = newAdvectionProgram;
}

export function setDivergenceProgram(newDivergenceProgram) {
    divergenceProgram = newDivergenceProgram;
}

export function setCurlProgram(newCurlProgram) {
    curlProgram = newCurlProgram;
}

export function setVorticityProgram(newVorticityProgram) {
    vorticityProgram = newVorticityProgram;
}

export function setPressureProgram(newPressureProgram) {
    pressureProgram = newPressureProgram;
}

export function setGradienSubtractProgram(newGradienSubtractProgram) {
    gradienSubtractProgram = newGradienSubtractProgram;
}

export let displayMaterial;

export function setDisplayMaterial(newDisplayMaterial){
    displayMaterial = newDisplayMaterial;
}

export let ditheringTexture;

export function setDitheringTexture(newDitheringTexture){
    ditheringTexture = newDitheringTexture;
}

export let blit;
export function setBlit(newBlit){
    blit = newBlit;
}

export let lastUpdateTime, colorUpdateTimer;

export function setLastUpdateTime(newUpdateTime){
    lastUpdateTime= newUpdateTime;
}

export function setColorUpdateTimer(newTimer){
    colorUpdateTimer = newTimer;
}

export function addColorUpdateTimer(newTimer){
    colorUpdateTimer += newTimer;
}

export let gl, ext;
export function setWebGLContext(newGl, newExt) {
    gl = newGl;
    ext = newExt;
}
export let baseVertexShader, blurVertexShader, blurShader, copyShader, clearShader, colorShader, checkerboardShader, displayShaderSource, bloomPrefilterShader, bloomBlurShader, bloomFinalShader, sunraysMaskShader, sunraysShader, splatShader, advectionShader, divergenceShader, curlShader, vorticityShader, pressureShader, gradientSubtractShader;

export function setBaseVertexShader(newBaseVertexShader) {
    baseVertexShader = newBaseVertexShader;
}

export function setBlurVertexShader(newBlurVertexShader) {
    blurVertexShader = newBlurVertexShader;
}

export function setBlurShader(newBlurShader) {
    blurShader = newBlurShader;
}

export function setCopyShader(newCopyShader) {
    copyShader = newCopyShader;
}

export function setClearShader(newClearShader) {
    clearShader = newClearShader;
}

export function setColorShader(newColorShader) {
    colorShader = newColorShader;
}

export function setCheckerboardShader(newCheckerboardShader) {
    checkerboardShader = newCheckerboardShader;
}

export function setDisplayShaderSource(newDisplayShaderSource) {
    displayShaderSource = newDisplayShaderSource;
}

export function setBloomPrefilterShader(newBloomPrefilterShader) {
    bloomPrefilterShader = newBloomPrefilterShader;
}

export function setBloomBlurShader(newBloomBlurShader) {
    bloomBlurShader = newBloomBlurShader;
}

export function setBloomFinalShader(newBloomFinalShader) {
    bloomFinalShader = newBloomFinalShader;
}

export function setSunraysMaskShader(newSunraysMaskShader) {
    sunraysMaskShader = newSunraysMaskShader;
}

export function setSunraysShader(newSunraysShader) {
    sunraysShader = newSunraysShader;
}

export function setSplatShader(newSplatShader) {
    splatShader = newSplatShader;
}

export function setAdvectionShader(newAdvectionShader) {
    advectionShader = newAdvectionShader;
}

export function setDivergenceShader(newDivergenceShader) {
    divergenceShader = newDivergenceShader;
}

export function setCurlShader(newCurlShader) {
    curlShader = newCurlShader;
}

export function setVorticityShader(newVorticityShader) {
    vorticityShader = newVorticityShader;
}

export function setPressureShader(newPressureShader) {
    pressureShader = newPressureShader;
}

export function setGradientSubtractShader(newGradientSubtractShader) {
    gradientSubtractShader = newGradientSubtractShader;
}

export let canvas;
export function setCanvas(newCanvas) {
    canvas = newCanvas;
}

export let simulationState = {
    activePointer: null,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0
};

export const lastValues = [];

export function setLastValues(rtdata) {
    if(lastValues.length === 5) {
        lastValues.shift(); // Rimuove il primo elemento
    }
    lastValues.push(rtdata); // Aggiunge il nuovo valore alla fine dell'array
}

export let brightness;
export function setBrightness(newBrightness){
    brightness = newBrightness;
}