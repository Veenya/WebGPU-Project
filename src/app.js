import io from 'socket.io-client';
import p5 from 'p5';
import { sleep, findGetParameter, paramJoiner, allCodesReceived } from './libraries/utils.js';
import Environment from "./environment.json";
import { WebGPUApp } from './libraries/realtimeNotSafe/wgpuApp.js';

// GENERAL variables
window.socketAddress = Environment.SOCKET_ADDRESS;
window.socket = io(window.socketAddress);
window.visualizer_code;
window.processingCanvas = "main-canvas";

// VISUALIZE parameters
window.visualize_parameters = {};
window.visualize_parameters_1 = {};
window.visualize_parameters_2 = {};
window.wavesSettings = { oneColor: true, blur: false };
window.visualize_couple_1 = false;
window.visualize_couple_2 = false;
window.visualize_started = false;
window.visualize_ended = false;
window.rtdata_started = false;
window.rtdata_parameters = {};
window.event_name = null;
window.ticket = null;
window.counter = 0;
window.expectedCodes = [];
window.receivedCodes = [];

window.addEventListener('DOMContentLoaded', function () {
    window.visualizer_code = findGetParameter("vid");
    if (window.visualizer_code == null) {
        window.visualizer_code = "v" + Math.floor(Math.random() * 10) + '' + Math.floor(Math.random() * 10);
    }
    console.log("Visualizer startup, code: ", window.visualizer_code);
    document.getElementById('visualizer-code').textContent = window.visualizer_code;
});

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById(window.processingCanvas).innerHTML = '';
    let firstTime = true; // Variabile per controllare se è la prima esecuzione

    function generateSimulatedData() {
        return {
            "params": {
                "ch1": Math.random() * 10 + 20,
                "ch2": Math.random() * 10 + 20,
                "ch3": Math.random() * 10 + 20,
                "ch4": Math.random() * 10 + 20
            },
            "visualizer_code": "05",
            "realtime": "Fluids",
            "event": "test",
            "ticket": "00"
        };
    }
    let counter = 0;

    setInterval(() => {
        const simulatedData = generateSimulatedData();
        console.log("Simulazione dati ricevuti:", simulatedData);

        if (firstTime) {
            window.wavesSettings = {};

            //const nebulaSketch = nebulaMeshSketchFunction(window.wavesSettings, simulatedData);
            //window.cvs = new p5(nebulaSketch, window.processingCanvas);
            window.cvs = new WebGPUApp(window.processingCanvas, simulatedData);
            firstTime = false;
        } else {
                // SUCCESSIVE ESECUZIONI: Dispatch dell'evento di aggiornamento
                window.visualize_parameters = simulatedData["params"];
                const updateEvent = new CustomEvent("sketchDataUpdate", { 
                    detail: { 
                        parameters: window.visualize_parameters, 
                        visual: simulatedData["visualizer_code"] 
                    }
                });
                window.dispatchEvent(updateEvent);
        }
    }, 1500);
});


window.addEventListener('changeWavesSettings', function (event) {
    const updatedSettings = event.detail;
    window.wavesSettings = updatedSettings;
    console.log("CHANGED WAVE SETTINGS")
    console.log(window.wavesSettings)
});

window.addEventListener('downloadFrame', async function (event){
    const blob = new Blob([event.detail], { type: 'image/png' });
    //let complete_user_info = { 'visualizer_code': window.visualizer_code, 'event': window.event_name, 'ticket': window.ticket, 'imageBuffer': blob }
    const formData = new FormData();
    formData.append('file', blob, window.event_name + '_' + ticket + '_' + window.counter + '.png');
    try {
        const response = await fetch('http://localhost:5002/upload_image', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            console.log('Immagine caricata con successo!');
        } else {
            console.error('Errore durante il caricamento dell\'immagine:', response.statusText);
        }
    } catch (error) {
        console.error('Errore durante la richiesta di caricamento:', error);
    }
    window.counter++;
    /*const blob = new Blob([event.detail], { type: 'image/png' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'BrainArt_' + window.event_name + '_' + window.ticket + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);*/
})

window.socket.on('connect', (_data) => {
    console.log("CONNECTED: ", window.socketAddress);
});

window.socket.on('rtdata', (data) => {
    console.log('VISUALIZER - Real-time data ', data);
    window.visualize_ended = false;
    window.visualize_parameters = data['params'];
    //console.log(window.visualize_parameters)
    if ((data['visualizer_code'] == window.visualizer_code && (window.event_name == data['event'] || window.event_name == null ) && (window.ticket == data['ticket'] || window.ticket == null )) ||
    (
        (data['visualizer_code'].endsWith('_1') || data['visualizer_code'].endsWith('_2')) &&
        data['visualizer_code'].replace(/(_1|_2)$/, '') === window.visualizer_code
    ) || 
    (
        (data['visualizer_code'].endsWith('_b') || data['visualizer_code'].endsWith('_r') || data['visualizer_code'].endsWith('_g') || data['visualizer_code'].endsWith('_y')) &&
        data['visualizer_code'].replace(/(_b|_g|_r|_y)$/, '') === window.visualizer_code
    )) {
        let suffix = data['visualizer_code'].match(/_(b|r|g|y)$/);
        if (suffix) {
            console.log("Suffisso trovato: " + suffix[0]);  // Mostra il suffisso (ad esempio, _b, _r, etc.)
            if (!window.expectedCodes.includes(suffix[0])) {
                window.expectedCodes.push(suffix[0]);
            }
        }
        if(window.event_name != data['event'] && window.event_name == null){
            window.event_name = data['event'];
        }
        if(window.ticket != data['ticket'] && window.ticket == null){
            window.ticket = data['ticket'];
        }
        if (window.rtdata_started) {
            const updateEvent = new CustomEvent("sketchDataUpdate", { detail: { parameters: window.visualize_parameters, visual: data['visualizer_code'] }});
            window.dispatchEvent(updateEvent);
        } else {
            document.getElementById(window.processingCanvas).innerHTML = '';
            window.cvs = new WebGPUApp(window.processingCanvas, window.visualize_parameters);
            window.rtdata_started = true;
        }
    }
})

window.socket.on('event_info', (data) => {
    if (data['visualizer_code'] == window.visualizer_code) { 
        console.log('VISUALIZER - event info data ', data);
        window.event_name = data['event'];
        window.ticket = data['ticket'];
    }
})

window.socket.on('visualize', (data) => {
    console.log(data)
    if (data['visualizer_code'] == window.visualizer_code){  // ! SINGOLO
        console.log('VISUALIZER - Visualize ', data);
        document.getElementById(window.processingCanvas).innerHTML = '';
        window.visualize_ended = false;
        window.visualize_parameters = data['params'];
        if(data['ai_mode'] == "Landscapes"){
            const brainaiSketch = createBrainaiSketch(window.visualize_parameters);
            window.cvs = new p5(brainaiSketch, window.processingCanvas);
        } else {
            const brainframeSketch = createBrainframeSketch(window.visualize_parameters);
            window.cvs = new p5(brainframeSketch, window.processingCanvas);
        }
    }
    else if (data['visualizer_code'] == window.visualizer_code + '_1') {  // ! COPPIA, codice_1
        // sleep(0.5) // so brainartish
        console.log('VISUALIZER - received window.visualize_couple_1 data: ' + data);
        window.visualize_parameters_1 = data['params'];
        window.visualize_ended = false;
        window.visualize_couple_1 = true;
        sleep(250)  // così che possano completare la funzione in tempi diversi ed effettivamente non concorrersi
            .then(() => {
                if (window.visualize_couple_2 == true && window.visualize_started == false) {
                    window.visualize_started = true;
                    console.log('VISUALIZER - Visualize couple data.');
                    document.getElementById(window.processingCanvas).innerHTML = '';
                    window.visualize_parameters = paramJoiner(window.visualize_parameters_1, window.visualize_parameters_2);
                    const brainframeSketch = createBrainframeSketch(window.visualize_parameters);
                    window.cvs = new p5(brainframeSketch, window.processingCanvas);
                }
            });
    }
    else if (data['visualizer_code'] == window.visualizer_code + '_2') {  // ! COPPIA, codice_2
        console.log('VISUALIZER - received window.visualize_couple_2 data: ' + data);
        window.visualize_parameters_2 = data['params'];
        window.visualize_ended = false;
        window.visualize_couple_2 = true;
        sleep(500)  // così che possano completare la funzione in tempi diversi ed effettivamente non concorrersi
            .then(() => {
                if (window.visualize_couple_1 == true && window.visualize_started == false) {
                    window.visualize_started = true;
                    console.log('VISUALIZER - Visualize couple data.');
                    document.getElementById(window.processingCanvas).innerHTML = '';
                    window.visualize_parameters = paramJoiner(window.visualize_parameters_1, window.visualize_parameters_2);
                    const brainframeSketch = createBrainframeSketch(window.visualize_parameters);
                    window.cvs = new p5(brainframeSketch, window.processingCanvas);
                }
            });

    } else if (data['visualizer_code'] == window.visualizer_code + '_b') {  
        addParams(data['params']);
        window.receivedCodes.push('_b');
        checkIfAllReceived();
    } 
    else if (data['visualizer_code'] == window.visualizer_code + '_r') {  
        console.log('VISUALIZER - received window.visualize_r data: ', data);
        addParams(data['params'])
        window.receivedCodes.push('_r');
        checkIfAllReceived();
    } 
    else if (data['visualizer_code'] == window.visualizer_code + '_g') {  
        console.log('VISUALIZER - received window.visualize_g data: ', data);
        addParams(data['params'])
        window.receivedCodes.push('_g');
        checkIfAllReceived();
    } 
    else if (data['visualizer_code'] == window.visualizer_code + '_y') {  
        console.log('VISUALIZER - received window.visualize_y data: ', data);
        addParams(data['params'])
        window.receivedCodes.push('_y');
        checkIfAllReceived();
    }
    console.log("VISUALIZING WITH PARAMETERS: ", window.visualize_parameters);
});

window.socket.on('refresh', (data) => {
    if (data['visualizer_code'] == window.visualizer_code | data['visualizer_code'] == window.visualizer_code + '_1' | data['visualizer_code'] == window.visualizer_code + '_2') {
        console.log('RESET');
        window.visualize_started = false;
        window.rtdata_started = false;
        //window.window.visualize_ended = true;
        //document.getElementById(window.processingCanvas).innerHTML = '<img src="' + logo + '" position="center">   <label id="visualizer_code" style= "color: white"></label>';
        if(document.getElementById('visualizer_code')){
            document.getElementById('visualizer_code').textContent = window.visualizer_code;
        }

    }
})

window.socket.on('refreshPage', (data) => {
    if(data['visualizer_code'] == window.visualizer_code){
        window.location.reload();
    }
})

function checkIfAllReceived() {
    if (allCodesReceived(window.expectedCodes, window.receivedCodes)) {
        document.getElementById(window.processingCanvas).innerHTML = '';
        window.visualize_ended = false;
        console.log("All codes received");
        window.visualize_parameters['valence_min'] /= window.receivedCodes.length;
        window.visualize_parameters['valence_max'] /= window.receivedCodes.length;
        window.visualize_parameters['arousal'] /= window.receivedCodes.length;
        window.visualize_parameters['mean_rhythm'] /= window.receivedCodes.length;
        
        const brainframeSketch = createBrainframeSketch(window.visualize_parameters);
        window.cvs = new p5(brainframeSketch, window.processingCanvas);
    }
}

function addParams(newParams) {
    console.log("WindowVisualizeParamters: ", window.visualize_parameters);
    if (window.visualize_parameters.hasOwnProperty("ch1")) {
        window.visualize_parameters = newParams;
    } else {
        window.visualize_parameters['valence_min'] += newParams['valence_min'];
        window.visualize_parameters['valence_max'] += newParams['valence_max'];
        window.visualize_parameters['arousal'] += newParams['arousal']; 
        window.visualize_parameters['mean_rhythm'] += newParams['mean_rhythm']; 
    }
}