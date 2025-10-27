// ! AVVIA PRIMA IL SERVER E POI IL VISUALIZER
// ! USA ?vid=test

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    "handlePreflightRequest": (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

const cors = require('cors');

const port = 5000;
const visualizerPath = '/app';

app.use(cors());

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const params = { "valence_min": 30, "valence_max": 0, "arousal": 1.0, "mean_rhythm": 1000 };
const params_2 = { "valence_min": 250, "valence_max": 200, "arousal": 3.5, "mean_rhythm": 2000 };
const params_rt1 = { "ch1": 45.745086669921875, "ch2": 40.715789794921875, "ch3": 54.79621887207031, "ch4": 54.24537658691406 };
const params_rt2 = { "ch1": -396.990966796875, "ch2": 472.86834716796875, "ch3": -178.8055419921875, "ch4": -395.97320556640625 };

// TEST COMPLETO
io.on('connect', async function (socket) {
    await console.log('TEST SERVER - VISUALIZER CONNECTED.');

    // REALTIME CALL
    await sleep(1000);
    await console.log('TEST SERVER - Sending realtime data calls...')
    await sleep(100);

    await console.log('Sending params.');
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt1 });
    await sleep(1000);
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt1 });
    await sleep(1000);
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt2 });
    await sleep(1000);
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt2 });
    await sleep(1000);
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test" });
    await sleep(1000);
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt1 });
    await sleep(1000);
    await io.of(visualizerPath).emit('rtdata', { "visualizer_code": "test", "params": params_rt2 });
    await sleep(1000);
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test" });

    // SINGLE CALL
    await sleep(1000);
    await console.log('TEST SERVER - Sending single calls...')
    await sleep(100);

    await console.log('Sending params.');
    await io.of(visualizerPath).emit('visualize', { "visualizer_code": "test", "params": params });
    await sleep(5000);
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test" });

    // COUPLE CALLS

    await sleep(5000);
    await console.log('TEST SERVER - Sending couple calls, CONCURRENT.')
    await sleep(100);

    // simulo invio nel caso peggiore, cioè concorrente
    await console.log('Sending params_1 and params_2.');
    await io.of(visualizerPath).emit('visualize', { "visualizer_code": "test_1", "params": params });
    await io.of(visualizerPath).emit('visualize', { "visualizer_code": "test_2", "params": params_2 });
    await sleep(5000);
    // simula session confirmed / denied nel caso peggiore, cioè concorrenti.
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test_1" });
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test_2" });

    await sleep(5000);
    await console.log('TEST SERVER - Sending couple calls, WITH SLEEP.')
    await sleep(100);

    // simulo invio nel caso sfalsato.
    await console.log('Sending params_1 and params_2.');
    await io.of(visualizerPath).emit('visualize', { "visualizer_code": "test_1", "params": params });
    await sleep(2000);
    await io.of(visualizerPath).emit('visualize', { "visualizer_code": "test_2", "params": params_2 });
    await sleep(5000);
    // simula session confirmed / denied nel caso sfalsato.
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test_1" });
    await sleep(2000);
    await io.of(visualizerPath).emit('refresh', { "visualizer_code": "test_2" });
});

server.listen(port, function () {
    console.log('TEST SERVER UP ON PORT %s', port);
});