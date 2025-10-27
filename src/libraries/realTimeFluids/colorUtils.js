import { mapValue, sigmoid, sumValues, mapValueWeight, mapCircular } from "./utils";
import { colors, imbalances, lastColors } from "./variables";

/**
 * Genera un colore casuale in formato RGB con valori di saturazione e valore massimi.
 * 
 * @returns {{r: number, g: number, b: number}} Il colore generato, con componenti R, G e B.
 */
export function generateColor() {
    let c = HSVtoRGB(Math.random(), 1.0, 0.5);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
}

/**
 * Genera un colore casuale in formato RGB con valori di saturazione e valore massimi.
 * @param {number} parametro1 - Il parametro ottenuto dalla rilevazione.
 * @returns {{r: number, g: number, b: number}} Il colore generato, con componenti R, G e B.
 */
export function generateColorByValue(sx1, sx2, dx1, dx2, singleColor = null) {
    let c;
    let hue;
    let saturation;
    let value;
    switch(singleColor){
        case 'blue':
            hue = 240 / 360;
            saturation = 1;
            value = 1;
            break;
        case 'red':
            hue = 5 / 360;
            saturation = 1;
            value = 1;
            break;
        case 'green':
            hue = 110 / 360;
            saturation = 1;
            value = 1;
            break;
        case 'yellow':
            hue = 54 / 360;
            saturation = 1;
            value = 1;
            break;
        default:
            const dx = dx1 + dx2;
            const sx = sx1 + sx2;
            let imbalance = sx - dx;
            const limitSup = 30;
            const limitInf = -30;
            let mappedValue;

            console.log("IMBALANCE: ", imbalance);

            if (imbalance > limitSup) {
                mappedValue = Math.random().toFixed(2);
            } else if (imbalance < limitInf) {
                mappedValue = (Math.random() - 1).toFixed(2);
            } else {
                mappedValue = mapValue(imbalance, limitInf, limitSup, -1, 1);
            }

            const k = 3;
            const sigmoideValue = sigmoid(mappedValue, k);

            hue = sigmoideValue * 300 / 360;
            saturation = 1;
            const sum = sumValues(sx1 + sx2 + dx1 + dx2) <= 90 ? sumValues(sx1 + sx2 + dx1 + dx2) : 90;
            value = mapValue(sum, 0, 90, 0, 1);
            console.log("We are in default mode: ", c);
            break;
    }
    c = HSVtoRGB(hue, saturation, value);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
}

function setValueAccebtable(value, limitInf, limitSup) {
    if (value > limitSup) {
        value = Math.random() * (30 - 10) + 10;
    } else if (value < limitInf) {
        value = Math.random() * (10 - 30) - 10;
    }

    return value;
}

export function generateRayBanColorByValue(sx1, sx2, dx1, dx2) {
    let isGrey = false;
    let isWhite = false;
    let isRed = false;

    let hue;
    let saturation;
    let value;

    const limitSup = 30;
    const limitInf = -30;

    const limitSupAcc = 40;
    const limitInfAcc = -40;

    dx1 = setValueAccebtable(dx1, limitInfAcc, limitSupAcc);
    dx2 = setValueAccebtable(dx2, limitInfAcc, limitSupAcc);
    sx1 = setValueAccebtable(sx1, limitInfAcc, limitSupAcc);
    sx2 = setValueAccebtable(sx2, limitInfAcc, limitSupAcc);

    const dx = dx1 + dx2;
    const sx = sx1 + sx2;
    let imbalance = dx - sx;

    if (imbalance > limitSup) {
        imbalance = limitSup;
    } else if (imbalance < limitInf) {
        imbalance = limitInf;
    }
    /*console.log("Destra: " + dx1 + " - " + dx2);
    console.log("Sinistra: " + sx1 + " - " + sx2);
    console.log("IMBALANCE: " + imbalance);*/

    if (lastColors.includes("white") && lastColors.includes("red")) {
        if (imbalance >= 0) {
            isWhite = false;
            isGrey = false;
            isRed = true;
            lastColors.push("red");
        } else if (imbalance < 0) {
            isRed = false;
            isWhite = true;
            isGrey = false;
            lastColors.push("white");
        }
    } else if (lastColors.includes("white")) {
        isRed = true;
        isWhite = false;
        isGrey = false;
        lastColors.push("red");
    } else {
        isWhite = true;
        isGrey = false;
        isRed = false;
        lastColors.push("white");
    }
    if (lastColors.length > 5) {
        lastColors.shift();
    }

    console.log("LAST COLORS: " + lastColors);

    if (isRed) {
        hue = 3;
        saturation = 1;
        value = 1;
    } else if (isWhite) {
        hue = 0;
        saturation = 0;
        value = 1;
    } else if (isGrey) {
        hue = 240;
        saturation = 0.07;
        value = 0.13;
    }

    let c = HSVtoRGB(hue, saturation, value);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
}

export function generateMcDonaldsColorByValue(sx1, sx2, dx1, dx2) {
    let isYellow = false;
    let isGreen = false;

    let hue;
    let saturation;
    let value;

    const limitSup = 30;
    const limitInf = -30;

    const limitSupAcc = 40;
    const limitInfAcc = -40;

    dx1 = setValueAccebtable(dx1, limitInfAcc, limitSupAcc);
    dx2 = setValueAccebtable(dx2, limitInfAcc, limitSupAcc);
    sx1 = setValueAccebtable(sx1, limitInfAcc, limitSupAcc);
    sx2 = setValueAccebtable(sx2, limitInfAcc, limitSupAcc);

    const dx = dx1 + dx2;
    const sx = sx1 + sx2;
    let imbalance = dx - sx;

    if (imbalance > limitSup) {
        imbalance = limitSup;
    } else if (imbalance < limitInf) {
        imbalance = limitInf;
    }
    /*console.log("Destra: " + dx1 + " - " + dx2);
    console.log("Sinistra: " + sx1 + " - " + sx2);
    console.log("IMBALANCE: " + imbalance);*/

    if (lastColors.includes("yellow") && lastColors.includes("green")) {
        if (imbalance >= 0) {
            isGreen = false;
            isYellow = true;
            lastColors.push("yellow");
        } else if (imbalance < 0) {
            isGreen = true;
            isYellow = false;
            lastColors.push("green");
        }
    } else if (lastColors.includes("green")) {
        isYellow = true;
        isGreen = false;
        lastColors.push("yellow");
    } else {
        isGreen = true;
        isYellow = false;
        lastColors.push("green");
    }
    if (lastColors.length > 5) {
        lastColors.shift();
    }

    console.log("LAST COLORS: " + lastColors);

    if (isYellow) {
        hue = 45 / 360;
        saturation = 0.949;
        value = 1;
    } else if (isGreen) {
        /*hue = 143.41 / 360;
        saturation = 0.519;
        value = 0.3098;*/
        hue = 45 / 360;
        saturation = 0.949;
        value = 1;
    }

    let c = HSVtoRGB(hue, saturation, value);
    c.r *= 0.15;
    c.g *= 0.15;
    c.b *= 0.15;
    return c;
}

/**
 * Converte un colore da spazio colore HSV a RGB.
 * 
 * @param {number} h - Il valore della tonalità (hue), tra 0 e 1.
 * @param {number} s - Il valore della saturazione, tra 0 e 1.
 * @param {number} v - Il valore della luminosità (value), tra 0 e 1.
 * @returns {Object} Un oggetto con proprietà `r`, `g`, e `b`, ognuna con valori tra 0 e 1.
 */
function HSVtoRGB(h, s, v) {
    let r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return {
        r,
        g,
        b
    };
}

/**
 * Normalizza un colore RGB per usarlo con valori tra 0 e 1.
 * 
 * @param {Object} input - Un oggetto con proprietà `r`, `g`, e `b`, ognuna con valori tra 0 e 255.
 * @returns {Object} Un oggetto con proprietà `r`, `g`, e `b`, ognuna con valori tra 0 e 1.
 */
export function normalizeColor(input) {
    let output = {
        r: input.r / 255,
        g: input.g / 255,
        b: input.b / 255
    };
    return output;
}