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
		struct VSOut { @builtin(position) pos: vec4<f32>, @location(0) uv: vec2<f32>, @location(1) t: f32 };
struct VertexUniforms { randomVec2: vec2<f32>, time: f32 };
@group(0) @binding(0) var<uniform> U: VertexUniforms;

@vertex
fn main(@builtin(vertex_index) vi: u32) -> VSOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0)
  );
  var o: VSOut;
  o.pos = vec4<f32>(p[vi], 0.0, 1.0);
  // map NDC to uv in [0,1]
  o.uv = p[vi] * 0.5 + vec2<f32>(0.5, 0.5);
  o.t = U.time;
  return o;
}
	`);

	setGPUFragmentShader(`
		struct FSIn { @location(0) uv: vec2<f32>, @location(1) t: f32 };
		
		// se la tua app si aspetta comunque @group(1) @binding(0) puoi lasciare questa struct,
		// ma NON la usiamo. In alternativa, puoi rimuoverla se la pipeline non la richiede.
		struct FragmentUniforms {
			color: vec3<f32>,
			precColor: vec3<f32>,
			transitionFactor: f32,
			};
		@group(1) @binding(0) var<uniform> fragmentUniforms: FragmentUniforms;
		fn colormap_red(x: f32) -> f32 {
			if (x < 0.0) { return 54.0 / 255.0; }
			else if (x < 20049.0 / 82979.0) { return (829.79 * x + 54.51) / 255.0; }
			else { return 1.0; }
		}

		fn colormap_green(x: f32) -> f32 {
			if (x < 20049.0 / 82979.0) {
				return 0.0;
			} else if (x < 327013.0 / 810990.0) {
				return ((8546482679670.0 / 10875673217.0) * x - (2064961390770.0 / 10875673217.0)) / 255.0;
			} else if (x <= 1.0) {
				return ((103806720.0 / 483977.0) * x + (19607415.0 / 483977.0)) / 255.0;
			} else {
				return 1.0;
			}
		}


		fn colormap_blue(x: f32) -> f32 {
		if (x < 0.0) { return 54.0 / 255.0; }
		else if (x < 7249.0 / 82979.0) { return (829.79 * x + 54.51) / 255.0; }
		else if (x < 20049.0 / 82979.0) { return 127.0 / 255.0; }
		else if (x < 327013.0 / 810990.0) { return (792.0224934136139 * x - 64.36479073560233) / 255.0; }
		else { return 1.0; }
		}	
		
		
		fn colormap(x: f32) -> vec4<f32> {
		return vec4<f32>(colormap_red(x), colormap_green(x), colormap_blue(x), 1.0);
		}

		fn rand(n: vec2<f32>) -> f32 { return fract(sin(dot(n, vec2<f32>(12.9898, 4.1414))) * 43758.5453); }
		fn noise(p: vec2<f32>) -> f32 {
		let ip = floor(p);
		var u = fract(p);
		u = u * u * (3.0 - 2.0 * u);
		let res = mix(
			mix(rand(ip), rand(ip + vec2<f32>(1.0, 0.0)), u.x),
			mix(rand(ip + vec2<f32>(0.0, 1.0)), rand(ip + vec2<f32>(1.0, 1.0)), u.x),
			u.y
		);
		return res * res;
		}
		const mtx : mat2x2<f32> = mat2x2<f32>(vec2<f32>(0.80, 0.60), vec2<f32>(-0.60, 0.80));
		fn fbm(p_in: vec2<f32>, t: f32) -> f32 {
		var p = p_in;
		var f: f32 = 0.0;
		f += 0.500000 * noise(p + vec2<f32>(t, t)); p = mtx * p * 2.02;
		f += 0.031250 * noise(p);                    p = mtx * p * 2.01;
		f += 0.250000 * noise(p);                    p = mtx * p * 2.03;
		f += 0.125000 * noise(p);                    p = mtx * p * 2.01;
		f += 0.062500 * noise(p);                    p = mtx * p * 2.04;
		f += 0.015625 * noise(p + vec2<f32>(sin(t), sin(t)));
		return f / 0.96875;
		}
		fn pattern(p: vec2<f32>, t: f32) -> f32 {
		return fbm(p + fbm(p + fbm(p, t), t), t);
		}

		@fragment
		fn main(i: FSIn) -> @location(0) vec4<f32> {
		let shade = pattern(i.uv, i.t);
		let cm = colormap(shade);
		return vec4<f32>(cm.xyz, 1.0); // opaque
		}	

		`);

	
}