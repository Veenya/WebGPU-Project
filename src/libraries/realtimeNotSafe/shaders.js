import { createProgram, createShader, setAttributeVec2 } from "./shaderUtils";
import { resizeManualCanvas, random } from "./utils";
import { canvas, fragmentShader, gl, program, setFragmentShader, setProgram, setTime, setTimeLoc, setVertexShader, vertexShader, time, timeLoc, setCols, setRows, cols, rows, colorLoc, setColorLoc, setPrecColorLoc, precColorLoc, setGPUVertexShader, setGPUFragmentShader } from "./variables";

/*export function initShaders() {
	setVertexShader(createShader(gl, gl.VERTEX_SHADER, `#version 300 es

	in vec2 aPosition;
	in vec2 aTexCoord;
	
	uniform vec2 uRandomVec2;
	uniform float uTime;
	
	${snoise4D}
	${snoise4DImage}
	${displace}
	
	vec4 noise(vec2 uv, float scal, float gain, float ofst, float expo, vec4 move) {
		vec4 noise;
		noise  =     1.*snoise4DImage((uv-vec2(421., 132))*1., scal, gain, ofst, move);
		noise +=     .5*snoise4DImage((uv-vec2(913., 687))*2., scal, gain, ofst, move);
		noise +=    .25*snoise4DImage((uv-vec2(834., 724))*4., scal, gain, ofst, move);
		noise +=   .125*snoise4DImage((uv-vec2(125., 209))*8., scal, gain, ofst, move);
		noise +=  .0625*snoise4DImage((uv-vec2(387., 99))*16., scal, gain, ofst, move);
		noise /= 1.9375;
		return noise;
	}

	out vec2 vTexCoord;
	out vec2 vCol;
	void main() {
		vTexCoord = aTexCoord;
		vec2 pos = aPosition;
		float circle = smoothstep(1., .0, length(0.-aPosition));
		vec2 n = noise(pos, 2., 5., .5, 1., vec4(vec2(0.), vec2(cos(uTime*.5), sin(uTime*.5))+uRandomVec2)).rg*circle;
		vec2 dpos = displace(pos, n, .5, .2*circle);
		vCol = n.rg*noise(pos*1000., 1., 1., .5, 1., vec4(0.)).r;
		gl_Position = vec4(dpos, 0., 1.);
		gl_PointSize = 1.;
	}`));


	setFragmentShader(createShader(gl, gl.FRAGMENT_SHADER, `#version 300 es
		precision mediump float;

		in vec2 vTexCoord;
		uniform vec3 vColor;
		uniform vec3 vPrecColor;
		in vec2 vCol;

		out vec4 fragColor;
		void main() {
			vec2 uv = vTexCoord;

			float intensity = length(vCol);  

			float thresholdMin = 0.1;
			float thresholdMax = 0.5;

			float alpha = smoothstep(thresholdMin, thresholdMax, intensity);

			fragColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(vColor, 1.0), alpha);
		}`));

	setProgram(createProgram(gl, vertexShader, fragmentShader));
	gl.useProgram(program);
	const randomVec2 = [random(0, 300), random(0, 300)];
	const randomVec2Loc = gl.getUniformLocation(program, "uRandomVec2");

	gl.uniform2fv(randomVec2Loc, randomVec2);

	let positionData = [];
	let offsetData = [];
	let texCoordData = [];

	setCols(canvas.width / 2);
	setRows(canvas.height / 2);
	const [xOff, yOff] = [2 / cols, 2 / rows];
	const [uOff, vOff] = [1 / cols, 1 / rows];
	// noprotect
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {
			positionData.push(-1 + xOff * col + 1 / cols);
			positionData.push(1 - yOff * row - 1 / rows);
			texCoordData.push((col + 1 / cols) * uOff);
			texCoordData.push((row + 1 / rows) * vOff);
		}
	}

	setAttributeVec2(gl, program, "aPosition", positionData)
	setAttributeVec2(gl, program, "aTexCoord", texCoordData)

	setTime(0);
	setTimeLoc(gl.getUniformLocation(program, "uTime"));
	setColorLoc(gl.getUniformLocation(program, "vColor"));
	setPrecColorLoc(gl.getUniformLocation(program, "vPrecColor"));

	resizeManualCanvas(canvas);

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

export function draw(color, sum, precColor) {
	//console.log(color);
	gl.clearColor(0, 0, 0, 0.1);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.uniform1f(timeLoc, time);
	gl.uniform3f(colorLoc, color.r, color.g, color.b);
	if (precColor != null) {
		gl.uniform3f(precColorLoc, precColor.r, precColor.g, precColor.b);
	}
	setTime(time + 0.02);
	gl.drawArrays(gl.POINTS, 0, cols * rows);
}

const snoise4D = `
	
		Description : Array and textureless GLSL 4D simplex 
					  noise functions.
			 Author : Ian McEwan, Ashima Arts.
		 Maintainer : stegu
			Lastmod : 20110822 (ijm)
			License : Copyright (C) 2011 Ashima Arts. All rights reserved.
					  Distributed under the MIT License. See LICENSE file.
					  https://github.com/ashima/webgl-noise
					  https://github.com/stegu/webgl-noise

		Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
		The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
		THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.	
	

	vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
	vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
	float permute(float x) { return mod289(((x*34.0)+10.0)*x); }
	vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
	float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }

	vec4 grad4(float j, vec4 ip) {
		const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
		vec4 p,s;

		p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
		p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
		s = vec4(lessThan(p, vec4(0.0)));
		p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; 

		return p;
	}

	#define F4 0.309016994374947451

	float snoise(vec4 v) {
		const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
													0.276393202250021,  // 2 * G4
													0.414589803375032,  // 3 * G4
												-0.447213595499958);  // -1 + 4 * G4

		vec4 i  = floor(v + dot(v, vec4(F4)) );
		vec4 x0 = v -   i + dot(i, C.xxxx);

		vec4 i0;
		vec3 isX = step( x0.yzw, x0.xxx );
		vec3 isYZ = step( x0.zww, x0.yyz );
		
		i0.x = isX.x + isX.y + isX.z;
		i0.yzw = 1.0 - isX;

		i0.y += isYZ.x + isYZ.y;
		i0.zw += 1.0 - isYZ.xy;
		i0.z += isYZ.z;
		i0.w += 1.0 - isYZ.z;

		vec4 i3 = clamp( i0, 0.0, 1.0 );
		vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
		vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

		vec4 x1 = x0 - i1 + C.xxxx;
		vec4 x2 = x0 - i2 + C.yyyy;
		vec4 x3 = x0 - i3 + C.zzzz;
		vec4 x4 = x0 + C.wwww;

		i = mod289(i); 
		float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
		vec4 j1 = permute( permute( permute( permute (
							i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
						+ i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
						+ i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
						+ i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

		vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

		vec4 p0 = grad4(j0,   ip);
		vec4 p1 = grad4(j1.x, ip);
		vec4 p2 = grad4(j1.y, ip);
		vec4 p3 = grad4(j1.z, ip);
		vec4 p4 = grad4(j1.w, ip);

		vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
		p0 *= norm.x;
		p1 *= norm.y;
		p2 *= norm.z;
		p3 *= norm.w;
		p4 *= taylorInvSqrt(dot(p4,p4));

		vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
		vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);
		m0 = m0 * m0;
		m1 = m1 * m1;
		return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))
								+ dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
	}
`;

const snoise4DImage = `
	// MIT License
	// Copyright © 2023 Zaron
	// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
	// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	vec4 snoise4DImage(vec2 uv, float scal, float gain, float ofst, vec4 move) {
		uv *= scal;
		float R = snoise(vec4(uv, 100., 200.)+move);
		float G = snoise(vec4(uv, 300., 400.)+move);
		float B = snoise(vec4(uv, 500., 600.)+move);
		vec3 color = ofst+gain*vec3(R, G, B);
		return vec4(color, 1.);
	}

	vec4 snoise4DImage(vec2 uv, float scal, float gain, float ofst, float expo, vec4 move) {
		uv *= scal;
		float R = snoise(vec4(uv, 100., 200.)+move);
		float G = snoise(vec4(uv, 300., 400.)+move);
		float B = snoise(vec4(uv, 500., 600.)+move);
		vec3 col;
		col.r = pow(abs(R), expo)*(step(0., R)*2.-1.);
		col.g = pow(abs(G), expo)*(step(0., G)*2.-1.);
		col.b = pow(abs(B), expo)*(step(0., B)*2.-1.);
		return vec4(ofst+gain*col, 1.);
	}
`;

const displace = `
	// MIT License
	// Copyright © 2023 Zaron
	// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
	// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	vec2 displace(vec2 uv, vec2 duv, float off, float wei) {
		//uv.x *= iResolution.x/iResolution.y; // square
		duv -= off;
		return uv-duv*wei;
	}

	vec4 displace(vec2 uv, sampler2D img, vec2 duv, float off, float wei) {
		duv -= off;
		return texture(img, uv-duv*wei);
	}
`;*/
export function initShaders() {
	setGPUVertexShader(`
		struct VertexInput {
			@location(0) position: vec2<f32>,
			@location(1) texCoord: vec2<f32>,
		};
		struct VertexOutput {
			@builtin(position) position: vec4<f32>,
			@location(0) texCoord: vec2<f32>,
			@location(1) color: vec2<f32>,
		};
		struct VertexUniforms {
			randomVec2: vec2<f32>,
			time: f32,
		};
		fn mod289(x: vec4<f32>) -> vec4<f32> {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}
		fn mod289_f(x: f32) -> f32 {
			return x - floor(x * (1.0 / 289.0)) * 289.0;
		}
		fn permute(x: vec4<f32>) -> vec4<f32> {
			return mod289(((x * 34.0) + 10.0) * x);
		}
		fn permute_f(x: f32) -> f32 {
			return mod289_f(((x * 34.0) + 10.0) * x);
		}
		fn taylorInvSqrt(r: vec4<f32>) -> vec4<f32> {
			return 1.79284291400159 - 0.85373472095314 * r;
		}
		fn taylorInvSqrt_f(r: f32) -> f32 {
			return 1.79284291400159 - 0.85373472095314 * r;
		}
		fn grad4(j: f32, ip: vec4<f32>) -> vec4<f32> {
			let ones: vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, -1.0);
			var p: vec4<f32> = vec4<f32>(0.0);
			var s: vec4<f32>;

			var p_xyz: vec3<f32> = floor(fract(vec3<f32>(j) * ip.xyz) * 7.0) * ip.z - 1.0;
			p.w = 1.5 - dot(abs(p_xyz), ones.xyz);
			s = vec4<f32>(select(vec3<f32>(0.0), vec3<f32>(1.0), p_xyz < vec3<f32>(0.0)), 0.0);
			
			p_xyz = p_xyz + (s.xyz * 2.0 - 1.0) * s.www;
			p = vec4<f32>(p_xyz, p.w); // Assegna di nuovo a p

			return p;
		}
		const F4: f32 = 0.309016994374947451;
		fn snoise(v: vec4<f32>) -> f32 {
			let C: vec4<f32> = vec4<f32>(
				0.138196601125011,  // (5 - sqrt(5)) / 20
				0.276393202250021,  // 2 * G4
				0.414589803375032,  // 3 * G4
				-0.447213595499958  // -1 + 4 * G4
			);
	
			var i: vec4<f32> = floor(v + dot(v, vec4<f32>(F4)));
			var x0: vec4<f32> = v - i + dot(i, C.xxxx);
	
			var i0: vec4<f32>;
			let isX: vec3<f32> = step(x0.yzw, x0.xxx);
			let isYZ: vec3<f32> = step(x0.zww, x0.yyz);
	
			i0.x = isX.x + isX.y + isX.z;
			var temp_yzw: vec3<f32> = vec3<f32>(1.0) - isX;
			i0.y = temp_yzw.x;
			i0.z = temp_yzw.y;
			i0.w = temp_yzw.z;
			i0.y += isYZ.x + isYZ.y;
			var temp_zw: vec2<f32> = vec2<f32>(1.0) - isYZ.xy;
			i0.z += temp_zw.x;
			i0.w += temp_zw.y;
			i0.z += isYZ.z;
			i0.w += 1.0 - isYZ.z;
	
			let i3: vec4<f32> = clamp(i0, vec4<f32>(0.0), vec4<f32>(1.0));
			let i2: vec4<f32> = clamp(i0 - vec4<f32>(1.0), vec4<f32>(0.0), vec4<f32>(1.0));
			let i1: vec4<f32> = clamp(i0 - vec4<f32>(2.0), vec4<f32>(0.0), vec4<f32>(1.0));
	
			let x1: vec4<f32> = x0 - i1 + C.xxxx;
			let x2: vec4<f32> = x0 - i2 + C.yyyy;
			let x3: vec4<f32> = x0 - i3 + C.zzzz;
			let x4: vec4<f32> = x0 + C.wwww;
	
			i = mod289(i);
			let j0: f32 = permute_f(permute_f(permute_f(permute_f(i.w) + i.z) + i.y) + i.x);
			let j1: vec4<f32> = permute(
				permute(
					permute(
						permute(
							i.w + vec4<f32>(i1.w, i2.w, i3.w, 1.0)
						) + i.z + vec4<f32>(i1.z, i2.z, i3.z, 1.0)
					) + i.y + vec4<f32>(i1.y, i2.y, i3.y, 1.0)
				) + i.x + vec4<f32>(i1.x, i2.x, i3.x, 1.0)
			);
	
			let ip: vec4<f32> = vec4<f32>(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
	
			var p0: vec4<f32> = grad4(j0, ip);
			var p1: vec4<f32> = grad4(j1.x, ip);
			var p2: vec4<f32> = grad4(j1.y, ip);
			var p3: vec4<f32> = grad4(j1.z, ip);
			var p4: vec4<f32> = grad4(j1.w, ip);
	
			let norm: vec4<f32> = taylorInvSqrt(vec4<f32>(
				dot(p0, p0),
				dot(p1, p1),
				dot(p2, p2),
				dot(p3, p3)
			));
			
			p0 *= norm.x;
			p1 *= norm.y;
			p2 *= norm.z;
			p3 *= norm.w;
			p4 *= taylorInvSqrt_f(dot(p4, p4));
	
			let m0: vec3<f32> = max(vec3<f32>(0.6) - vec3<f32>(dot(x0, x0), dot(x1, x1), dot(x2, x2)), vec3<f32>(0.0));
			let m1: vec2<f32> = max(vec2<f32>(0.6) - vec2<f32>(dot(x3, x3), dot(x4, x4)), vec2<f32>(0.0));
			
			let m0_2: vec3<f32> = m0 * m0;
			let m1_2: vec2<f32> = m1 * m1;
			
			return 49.0 * (
				dot(m0_2 * m0_2, vec3<f32>(dot(p0, x0), dot(p1, x1), dot(p2, x2))) +
				dot(m1_2 * m1_2, vec2<f32>(dot(p3, x3), dot(p4, x4)))
			);
		}
		fn snoise4DImage(uv: vec2<f32>, scal: f32, gain: f32, ofst: f32, moveSnoise: vec4<f32>) -> vec4<f32> {
			let uv_scaled = uv * scal;
			
			let R: f32 = snoise(vec4<f32>(uv_scaled, 100.0, 200.0) + moveSnoise);
			let G: f32 = snoise(vec4<f32>(uv_scaled, 300.0, 400.0) + moveSnoise);
			let B: f32 = snoise(vec4<f32>(uv_scaled, 500.0, 600.0) + moveSnoise);
			
			let color: vec3<f32> = ofst + gain * vec3<f32>(R, G, B);
			return vec4<f32>(color, 1.0);
		}
		fn snoise4DImageExpo(uv: vec2<f32>, scal: f32, gain: f32, ofst: f32, expo: f32, moveSnoise: vec4<f32>) -> vec4<f32> {
			let uv_scaled = uv * scal;
			
			let R: f32 = snoise(vec4<f32>(uv_scaled, 100.0, 200.0) + moveSnoise);
			let G: f32 = snoise(vec4<f32>(uv_scaled, 300.0, 400.0) + moveSnoise);
			let B: f32 = snoise(vec4<f32>(uv_scaled, 500.0, 600.0) + moveSnoise);
			
			var col: vec3<f32>;
			col.r = pow(abs(R), expo) * (select(-1.0, 1.0, R > 0.0));
			col.g = pow(abs(G), expo) * (select(-1.0, 1.0, G > 0.0));
			col.b = pow(abs(B), expo) * (select(-1.0, 1.0, B > 0.0));
			
			return vec4<f32>(ofst + gain * col, 1.0);
		}
		fn displace(uv: vec2<f32>, duv: vec2<f32>, off: f32, wei: f32) -> vec2<f32> {
			let displaced_duv = duv - off;
			return uv - displaced_duv * wei;
		}
		@group(0) @binding(1) var img: texture_2d<f32>;
		@group(0) @binding(2) var imgSampler: sampler;
		fn displaceTexture(uv: vec2<f32>, duv: vec2<f32>, off: f32, wei: f32) -> vec4<f32> {
			let displaced_duv = duv - off;
			return textureSample(img, imgSampler, uv - displaced_duv * wei);
		}
		fn noise(uv: vec2<f32>, scal: f32, gain: f32, ofst: f32, expo: f32, moveSnoise: vec4<f32>) -> vec4<f32> {
			var noise: vec4<f32>;
	
			noise  =     1.0 * snoise4DImage((uv - vec2<f32>(421.0, 132.0)) * 1.0, scal, gain, ofst, moveSnoise);
			noise +=     0.5 * snoise4DImage((uv - vec2<f32>(913.0, 687.0)) * 2.0, scal, gain, ofst, moveSnoise);
			noise +=    0.25 * snoise4DImage((uv - vec2<f32>(834.0, 724.0)) * 4.0, scal, gain, ofst, moveSnoise);
			noise +=   0.125 * snoise4DImage((uv - vec2<f32>(125.0, 209.0)) * 8.0, scal, gain, ofst, moveSnoise);
			noise +=  0.0625 * snoise4DImage((uv - vec2<f32>(387.0, 99.0)) * 16.0, scal, gain, ofst, moveSnoise);
			
			noise = noise / 1.9375;
			
			return noise;
		}
	
		@group(0) @binding(0)var<uniform> vertexUniforms: VertexUniforms;
		@vertex
		fn main(input: VertexInput) -> VertexOutput {
			var output: VertexOutput;
			output.texCoord = input.texCoord;
			var pos: vec2<f32> = input.position;
			let circle: f32 = smoothstep(1.0, 0.0, length(vec2<f32>(0.0) - input.position));
			let noiseValue: vec2<f32> = noise(pos, 2.0, 5.0, 0.5, 0.1, vec4<f32>(vec2<f32>(0.0), vec2<f32>(cos(vertexUniforms.time * 0.5), sin(vertexUniforms.time * 0.5)) + vertexUniforms.randomVec2)).rg * circle;
			let dpos: vec2<f32> = displace(pos, noiseValue, 0.5, 0.2 * circle);
			output.color = noiseValue.rg * noise(pos * 1000.0, 1.0, 1.0, 0.5, 1.0, vec4<f32>(0.0)).r;
			output.position = vec4<f32>(dpos, 0.0, 1.0);
			
			return output;
		}`);

	setGPUFragmentShader(`
		struct FragmentInput {
			@location(0) texCoord: vec2<f32>,
			@location(1) color: vec2<f32>,
		};
	
		struct FragmentUniforms {
			color: vec3<f32>,
			precColor: vec3<f32>,
			transitionFactor: f32,
		};
	
		@group(1) @binding(0) var<uniform> fragmentUniforms: FragmentUniforms;
		@fragment
		fn main(input: FragmentInput) -> @location(0) vec4<f32> {
			let uv: vec2<f32> = input.texCoord;
	
			let intensity: f32 = length(input.color);
	
			let thresholdMin: f32 = 0.;
			let thresholdMax: f32 = 0.5;
	
			let alpha: f32 = smoothstep(thresholdMin, thresholdMax, intensity);
	
			let blendedColor: vec3<f32> = mix(fragmentUniforms.precColor, fragmentUniforms.color, fragmentUniforms.transitionFactor);
	
			return mix(vec4<f32>(0.0, 0.0, 0.0, 1.0), vec4<f32>(blendedColor, 1.0), alpha);
		}`);
}