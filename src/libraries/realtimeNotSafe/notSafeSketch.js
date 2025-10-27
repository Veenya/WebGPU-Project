import { draw, initShaders } from "./shaders";
import { gl, setWebGLContext, setLastValues } from "./variables";
import { generateColorByValue, getWebGLContext, sumValues } from "./utils";

export function nebulaMeshSketchFunction(settings, rtdataParameters) {

    function nebulaMeshSketch(p) {
        let rtdata_started = false;
        let width, height;
        let rtdata_received = false;
        let color = null, sum = null, precColor = null;
        
        window.addEventListener("sketchDataUpdate", function (event) {
            const updatedParameters = event.detail.parameters;
            visualizerColor = event.detail.visual;
            updateSketchData(updatedParameters);
        });

        function updateSketchData(updatedParameters) {
            newParameters = updatedParameters;
            if (updatedParameters.ch1 != null && updatedParameters.ch2 != null && updatedParameters.ch3 != null && updatedParameters.ch4 != null) {
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
                p.createCanvas(height, height, p.WEBGL);

                const context = getWebGLContext(p.canvas);

                setWebGLContext(context.gl, context.ext, p.canvas);

                initShaders();
            }
        }

        p.draw = function () {
            if (rtdata_received) {
                color = generateColorByValue(newParameters.ch1, newParameters.ch2, newParameters.ch3, newParameters.ch4);
                color.r *= 4.0;
                color.g *= 4.0;
                color.b *= 4.0;
                sum = sumValues(newParameters.ch1, newParameters.ch2, newParameters.ch3, newParameters.ch4);
                precColor = color;
                rtdata_received = false;
            }
            if(color != null){
                draw(color, sum, precColor);
            }
        }

    }

    return nebulaMeshSketch;
}
