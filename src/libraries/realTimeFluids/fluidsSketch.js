/*MIT License

Copyright (c) 2017 Pavel Dobryakov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

import { gl, setCanvas, ext, setWebGLContext, config, setLastUpdateTime, setLastValues } from "./variables";
import { initPrograms, initShaders } from "./shaders";
import { updateKeywords } from "./shaderUtils";
import { initFramebuffers } from "./framebuffer";
import { getWebGLContext } from "./WebGLContext";
import { update } from "./rendering";
import { setColorUpdateTimer } from "./variables";
import { generateColorByValue, generateRayBanColorByValue, generateMcDonaldsColorByValue } from "./colorUtils";
import { splat } from "./splat";
import { checkWebGLErrors, getLastValuesMean, mapValue, sumValues } from "./utils";
import { resizeManualCanvas } from "./opzioniCanvas";

export function fluidsSketchFunction(settings, rtdataParameters) {
    let parameters = rtdataParameters['params'];
    let newParameters = parameters;
    let visualizerColor;
    
    function fluidsSketch(p) {
        let rtdata_started = false;
        let width, height;
        let setupComplete = false;
        let rtdata_received = false;

        p.disableFriendlyErrors = true;

        window.addEventListener("sketchDataUpdate", function (event) {
            const updatedParameters = event.detail.parameters;
            visualizerColor = event.detail.visual;
            updateSketchData(updatedParameters);
        });

        function updateSketchData(updatedParameters) {
            newParameters = updatedParameters;
            if(updatedParameters.ch1 != null && updatedParameters.ch2 != null && updatedParameters.ch3 != null && updatedParameters.ch4 != null){
                setLastValues(newParameters);
                rtdata_received = true;
                console.log("PARAMETERS RECEIVED: ", newParameters);
            }
        }

        p.setup = async function () {
            if (!rtdata_started) {
                rtdata_started = true;

                width = p.windowWidth;
                height = p.windowHeight;
                p.createCanvas(width, height, p.WEBGL);
                setCanvas(p.canvas);
                resizeManualCanvas(p.canvas);

                const context = getWebGLContext(p.canvas);
                setWebGLContext(context.gl, context.ext);

                if (!ext.supportLinearFiltering) {
                    config.DYE_RESOLUTION = 512;
                    config.SHADING = false;
                    config.BLOOM = false;
                    config.SUNRAYS = false;
                }

                initShaders();
                initPrograms();
                updateKeywords();
                initFramebuffers();

                setColorUpdateTimer(0.0);
                setLastUpdateTime(Date.now());

                p.frameRate(60);
                setupComplete = true;
                console.log("WEBGL SETUP complete");

                checkWebGLErrors(gl);

               p.background(p.color(0, 0, 0));
            }
        }


        p.draw = function () {
            checkWebGLErrors(gl);

            if (rtdata_received) {
                let numberSplats = null;
                let colorMerge = null;
                if(visualizerColor.endsWith('_b')){
                    colorMerge = 'blue';
                } else if(visualizerColor.endsWith('_r')){
                    colorMerge = 'red';
                } else if(visualizerColor.endsWith('_g')){
                    colorMerge = 'green';
                } else if(visualizerColor.endsWith('_y')){
                    colorMerge = 'yellow';
                }
                const color = generateColorByValue(newParameters.ch1, newParameters.ch2, newParameters.ch3, newParameters.ch4, colorMerge);
                let sum = sumValues(newParameters.ch1, newParameters.ch2, newParameters.ch3, newParameters.ch4);
                if(sum > getLastValuesMean() * 2 && getLastValuesMean() !== null){
                    config.SPLAT_RADIUS = 0.9;
                } else if(sum < getLastValuesMean() / 2 && getLastValuesMean() !== null) {
                    config.SPLAT_RADIUS = 0.1;
                } else {
                    config.SPLAT_RADIUS = 0.25;
                }
                if(sum > 80){
                    sum = 80;
                } else if(sum < 0){
                    sum = 0;
                }
                if(colorMerge == null){
                    numberSplats = Math.round(mapValue(sum, 0, 80, 1, 5));
                } else {
                    numberSplats = Math.round(mapValue(sum, 0, 80, 1, 3));
                }

                color.r *= 10.0;
                color.g *= 10.0;
                color.b *= 10.0;
                for (let i = 0; i < numberSplats; i++) {
                    const x = Math.random();
                    const y = Math.random();
                    const dx = 1000 * (Math.random() - 0.5);
                    const dy = 1000 * (Math.random() - 0.5);
                    splat(x, y, dx, dy, color);
                    parameters = newParameters;
                }
                rtdata_received = false;
            }

            update(p.canvas);

            checkWebGLErrors(gl);
        }
       
    }

    return fluidsSketch;
}
