export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};


export function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}


export function paramJoiner(visualize_parameters_1, visualize_parameters_2) {

    console.log('VISUALIZER - paramJoiner call.');

    let parameters = {};

    parameters['arousal_1'] = visualize_parameters_1['arousal'];
    parameters['mean_rhythm_1'] = visualize_parameters_1['mean_rhythm']
    parameters['val_max_1'] = visualize_parameters_1['valence_max'];
    parameters['val_min_1'] = visualize_parameters_1['valence_min'];

    parameters['arousal_2'] = visualize_parameters_2['arousal'];
    parameters['mean_rhythm_2'] = visualize_parameters_2['mean_rhythm']
    parameters['val_max_2'] = visualize_parameters_2['valence_max'];
    parameters['val_min_2'] = visualize_parameters_2['valence_min'];

    return parameters
}

export function allCodesReceived(expectedCodes, receivedCodes) {
    return expectedCodes.every(code => receivedCodes.includes(code));
}