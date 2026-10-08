/* The MedGryd mark, rendered as a world: a liquid, iridescent planet, the logo's tilted orbital
   ring with a heartbeat running round it, and the logo's four-point spark. One WebGL fragment
   shader, no libraries. Falls back to the CSS gradient behind it when WebGL is unavailable, draws
   one still frame under prefers-reduced-motion, and stops drawing while off screen. */
(function () {
  const canvas = document.querySelector("[data-planet]");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { canvas.remove(); return; }

  const VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;   // -1..1, eased
uniform float uScroll; // 0 at top, 1 when the hero has scrolled away
uniform float uIntro;  // 0 -> 1 on load
uniform vec3 uBase;    // planet center (x, y) and radius, in short-side units

float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float noise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }

// MedGryd iridescence: midnight -> indigo -> sky -> ice -> violet, like oil on dark water
vec3 iri(float t){
  t=fract(t);
  vec3 c0=vec3(0.020,0.030,0.090);
  vec3 c1=vec3(0.200,0.170,0.620);
  vec3 c2=vec3(0.140,0.560,0.960);
  vec3 c3=vec3(0.620,0.930,1.000);
  vec3 c4=vec3(0.560,0.380,0.980);
  if(t<0.18) return mix(c0,c1,smoothstep(0.0,0.18,t));
  if(t<0.40) return mix(c1,c2,smoothstep(0.18,0.40,t));
  if(t<0.60) return mix(c2,c3,smoothstep(0.40,0.60,t));
  if(t<0.78) return mix(c3,c4,smoothstep(0.60,0.78,t));
  return mix(c4,c0,smoothstep(0.78,1.0,t));
}
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

// A single heartbeat, s in beats behind the pulse head (0 = head)
float ecg(float s){
  float p = 0.12*exp(-pow((s-0.62)/0.05,2.0));
  float q = -0.18*exp(-pow((s-0.40)/0.012,2.0));
  float r = 1.00*exp(-pow((s-0.37)/0.014,2.0));
  float S = -0.30*exp(-pow((s-0.34)/0.012,2.0));
  float t = 0.22*exp(-pow((s-0.18)/0.06,2.0));
  return p+q+r+S+t;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float m = min(uRes.x,uRes.y);
  vec2 uv = (frag - 0.5*uRes)/m;               // centerd, short side = 1
  float T = uTime;

  // ── background: deep space, faint mission-control grid, stars ──
  vec3 col = mix(vec3(0.012,0.014,0.035), vec3(0.030,0.032,0.080), smoothstep(-0.8,0.9,uv.y+0.3));
  vec2 par = uMouse*0.015;
  vec2 g = (frag + par*m*2.0)/ (m/7.0);
  vec2 gl2 = abs(fract(g)-0.5);
  float grid = smoothstep(0.495,0.5,max(gl2.x,gl2.y));
  col += vec3(0.22,0.74,0.97)*grid*0.035*smoothstep(1.2,0.2,length(uv));
  for(int L=0; L<3; L++){
    float fl=float(L);
    float sc = 60.0 + fl*55.0;
    vec2 sp = (uv + par*(0.4+fl*0.5))*sc;
    vec2 id = floor(sp); vec2 f = fract(sp)-0.5;
    float r = h21(id+fl*13.1);
    if(r>0.93){
      vec2 o = vec2(h21(id+3.1),h21(id+7.7))-0.5;
      float d = length(f-o*0.7);
      float tw = 0.55+0.45*sin(T*(1.0+r*3.0)+r*40.0);
      float star = smoothstep(0.06,0.0,d)*tw*(0.35+0.5*(1.0-fl*0.3));
      col += mix(vec3(0.75,0.85,1.0), vec3(0.4,0.8,1.0), step(0.985,r))*star;
    }
  }

  // ── planet placement: settles in on load, drifts up and away on scroll ──
  float R = mix(uBase.z*0.76, uBase.z, uIntro) * (1.0 - 0.18*uScroll);
  vec2 C = uBase.xy + vec2(0.0, 0.28*uScroll) + uMouse*vec2(0.018,-0.012);
  vec2 p = (uv - C)/R;
  float d = length(p);

  // light follows the cursor a little; default is the upper left, like the logo's glint
  vec3 Ld = normalize(vec3(-0.55 + uMouse.x*0.35, 0.50 - uMouse.y*0.25, 0.75));

  // atmosphere halo outside the disc
  float halo = exp(-max(d-1.0,0.0)*5.5)*smoothstep(1.0,1.01,d);
  float lit = clamp(dot(normalize(vec3(p,0.2)), Ld)*0.5+0.5, 0.0, 1.0);
  col += (vec3(0.22,0.72,1.0)*0.55 + vec3(0.45,0.35,1.0)*0.25) * halo * (0.35+0.9*lit) * uIntro;

  // ── ring geometry (shared by the back and front passes) ──
  float tilt = -0.30;
  vec2 rp = rot(tilt)*(uv - C)/R;
  vec2 e = rp/vec2(1.78, 0.40);                 // ellipse space
  float ang = atan(e.y, e.x);
  float head = mod(T*0.55, 6.2831853);
  float behind = mod(head - ang, 6.2831853);     // radians behind the pulse head
  float beat = behind < 2.0 ? ecg(behind/2.0)*0.075 : 0.0;
  float er = length(e) - beat;
  float band = exp(-pow((er-1.0)/0.012,2.0));
  float glow = exp(-pow((er-1.0)/0.06,2.0));
  float trail = exp(-behind*2.2);
  vec3 ringCol = vec3(0.22,0.74,0.97)*(0.55*band + 0.18*glow) + vec3(0.8,0.97,1.0)*band*trail*1.4 + vec3(0.3,0.8,1.0)*glow*trail*0.5;
  ringCol *= uIntro;
  bool front = rp.y < 0.0;                       // lower half of the tilted ellipse passes in front

  if(!front && d > 1.0) col += ringCol;

  // ── the planet ──
  if(d < 1.0){
    float z = sqrt(1.0-d*d);
    vec3 n = vec3(p, z);
    // rotate the sampling sphere: slow spin + a nudge from the cursor
    vec3 q = n;
    q.xz = rot(T*0.07 + uMouse.x*0.35) * q.xz;
    q.yz = rot(0.25 + uMouse.y*0.2) * q.yz;
    // Low-frequency, domain-warped flow: long liquid bands rather than weather.
    vec3 s = q*0.95;
    float w1 = fbm(s + vec3(0.0, T*0.03, 0.0));
    float w2 = fbm(s*1.15 + vec3(w1*1.8, -T*0.022, w1*1.3));
    float bands = sin(q.y*3.2 + w2*4.2 + T*0.10)*0.5+0.5;
    // thin-film shift: color slides with viewing angle, which is what reads as iridescence
    float film = (1.0 - z)*0.55;
    float t = w2*0.85 + bands*0.28 + film + T*0.010;
    vec3 surf = iri(t);
    float fold = smoothstep(0.66,0.92, fbm(s*1.7 + w2*2.2 + T*0.04));
    surf += vec3(0.55,0.9,1.0)*fold*0.18;

    float diff = clamp(dot(n, Ld), 0.0, 1.0);
    float wrap = clamp((dot(n, Ld)+0.35)/1.35, 0.0, 1.0);
    vec3 H = normalize(Ld + vec3(0,0,1));
    float spec = pow(clamp(dot(n,H),0.0,1.0), 60.0);
    float fres = pow(1.0 - z, 2.6);

    vec3 pc = surf*(0.10 + 0.95*wrap) + vec3(0.85,0.97,1.0)*spec*0.55;
    pc += (vec3(0.25,0.75,1.0)*0.9 + vec3(0.55,0.4,1.0)*0.4) * fres * (0.25 + 0.9*diff);
    // A darker core and a luminous limb: glassy, and dark enough behind the headline to read.
    pc *= 0.5 + 0.5*smoothstep(0.15, 1.0, d);
    float edge = smoothstep(1.0, 0.985, d);
    col = mix(col, pc, edge*uIntro);
  }

  if(front) col += ringCol;

  // ── the spark, upper right of the planet, as in the logo ──
  vec2 sp = (uv - (C + vec2(0.46, 0.40)*R)) / R;
  sp = rot(0.0)*sp;
  float tw = 0.75 + 0.25*sin(T*1.7);
  float cross = 0.0016/(abs(sp.x*sp.y)+0.0016);
  float star = cross*smoothstep(0.22,0.0,length(sp)) + exp(-length(sp)*38.0)*1.2;
  col += vec3(0.55,0.88,1.0)*star*tw*0.9*uIntro;

  // vignette + gentle scroll fade
  col *= mix(1.0, 0.25, uScroll);
  col *= smoothstep(1.55, 0.35, length((uv - uBase.xy*0.7)*vec2(0.8,1.0)));
  // dither
  col += (h21(frag+T)-0.5)/255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ["uRes", "uTime", "uMouse", "uScroll", "uIntro", "uBase"].forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hero = canvas.closest(".hero, .page-hero") || canvas.parentElement;
  // "hero": centerd behind the headline. "side": parked right of a sub-page title, partly off canvas.
  const mode = canvas.dataset.planet || "hero";
  function base() {
    const aspect = W / Math.max(1, H), half = Math.max(aspect, 1) * 0.5;
    if (mode === "side") return aspect > 1.2 ? [half - 0.3, 0.0, 0.36] : [0.36, 0.22, 0.3];
    return [0.0, -0.03, aspect < 1 ? 0.36 : 0.33];
  }
  let W = 0, H = 0;
  function resize() {
    // Cap the pixel count: the shader is per-pixel fbm, and a 4K retina hero does not need 4K samples.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(dpr, Math.sqrt(2400000 / Math.max(1, rect.width * rect.height)));
    W = Math.max(1, Math.round(rect.width * scale));
    H = Math.max(1, Math.round(rect.height * scale));
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
  }
  resize();
  window.addEventListener("resize", () => { resize(); if (reduce) draw(performance.now()); }, { passive: true });

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !reduce) loop(); }, { threshold: 0 }).observe(hero);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !reduce) loop(); });

  const start = performance.now();
  let raf = 0;
  function draw(now) {
    const t = (now - start) / 1000;
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    const scroll = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight || 1)));
    const intro = reduce ? 1 : 1 - Math.pow(1 - Math.min(1, t / 2.2), 4);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, reduce ? 12.0 : t + 12.0);
    gl.uniform2f(U.uMouse, mouse.x, mouse.y);
    gl.uniform1f(U.uScroll, scroll);
    gl.uniform1f(U.uIntro, intro);
    const b = base();
    gl.uniform3f(U.uBase, b[0], b[1], b[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop() {
    cancelAnimationFrame(raf);
    const step = (now) => {
      if (!visible || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  if (reduce) {
    draw(performance.now());
    window.addEventListener("scroll", () => draw(performance.now()), { passive: true });
  } else loop();
  canvas.classList.add("ready");
})();
