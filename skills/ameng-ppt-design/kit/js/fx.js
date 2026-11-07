/* fx.js — ambient WebGL backgrounds. Runs only on the active slide, respects reduced
   motion, and keeps its last frame so the exporter can place it as one picture. */
(function () {
  "use strict";
  var VERT = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var NOISE = "precision highp float;uniform vec2 R;uniform float T;uniform vec3 A;uniform vec3 B;uniform vec3 G;" +
    "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
    "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.-15.)+10.);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}" +
    "float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.02+vec2(3.1,1.7);a*=.5;}return v;}";
  var FRAG = {
    /* a slow sunrise rising from the lower right */
    aurora: NOISE + "void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=uv*vec2(R.x/R.y,1.);float t=T*.05;" +
      "vec2 q=vec2(fbm(p*1.3+t),fbm(p*1.3-t+4.));vec2 r=vec2(fbm(p*1.7+q*2.2+vec2(1.7,9.2)+t*.7),fbm(p*1.7+q*2.2+vec2(8.3,2.8)-t*.6));" +
      "float f=fbm(p*1.1+r*2.4);float d=distance(uv,vec2(.98,-.08));float glow=smoothstep(1.12,.04,d+f*.5-.1);glow*=smoothstep(.46,.92,uv.x+(f-.5)*.34+uv.y*.05);" +
      "vec3 c=mix(G,A,smoothstep(.06,.62,glow));c=mix(c,B,smoothstep(.5,.98,glow*(.72+f*.55)));" +
      "c+=(h(gl_FragCoord.xy+T)-.5)*.035;gl_FragColor=vec4(c,1.);}",
    /* ink blooming into wet paper at the top right */
    ink: NOISE + "void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=uv*vec2(R.x/R.y,1.);float t=T*.022;" +
      "vec2 w=vec2(fbm(p*2.+t),fbm(p*2.-t+7.));float f=fbm(p*2.6+w*2.6);float d=distance(uv,vec2(.93,.98));" +
      "float m=smoothstep(.46,.06,d+(f-.5)*.5);m*=.5+.5*smoothstep(.34,.74,f);" +
      "gl_FragColor=vec4(mix(G,A,m*.86),1.);}"
  };
  function rgb(css) {
    var c = document.createElement("canvas").getContext("2d");
    c.fillStyle = css; c.fillRect(0, 0, 1, 1);
    var d = c.getImageData(0, 0, 1, 1).data;
    return [d[0] / 255, d[1] / 255, d[2] / 255];
  }
  function Layer(canvas) {
    this.canvas = canvas;
    this.kind = canvas.getAttribute("data-fx");
    var scale = 0.5;
    canvas.width = 1920 * scale; canvas.height = 1080 * scale;
    var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false, powerPreference: "low-power" });
    this.gl = gl;
    if (!gl || !FRAG[this.kind]) { canvas.style.display = "none"; return; }
    var prog = gl.createProgram();
    [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG[this.kind]]].forEach(function (s) {
      var sh = gl.createShader(s[0]); gl.shaderSource(sh, s[1]); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.warn("[fx]", gl.getShaderInfoLog(sh));
      gl.attachShader(prog, sh);
    });
    gl.linkProgram(prog); gl.useProgram(prog);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = { R: gl.getUniformLocation(prog, "R"), T: gl.getUniformLocation(prog, "T"), A: gl.getUniformLocation(prog, "A"), B: gl.getUniformLocation(prog, "B"), G: gl.getUniformLocation(prog, "G") };
    this.seed = 11.3;  /* same frame every run, so checks and exports are repeatable */
    this.palette();
  }
  Layer.prototype.palette = function () {
    var cs = getComputedStyle(this.canvas), gl = this.gl;
    if (!gl) return;
    gl.uniform3fv(this.u.A, rgb(cs.getPropertyValue("--accent").trim()));
    gl.uniform3fv(this.u.B, rgb(cs.getPropertyValue("--accent-2").trim()));
    gl.uniform3fv(this.u.G, rgb(cs.getPropertyValue("--bg").trim()));
  };
  Layer.prototype.draw = function (t) {
    var gl = this.gl; if (!gl) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.R, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.T, t + this.seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  var reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var active = [], raf = 0;
  function loop(ms) {
    active.forEach(function (l) { l.draw(ms / 1000); });
    raf = requestAnimationFrame(loop);
  }
  window.FX = {
    sync: function (root, slide) {
      cancelAnimationFrame(raf); active = [];
      Array.prototype.forEach.call(root.querySelectorAll("canvas.fx"), function (c) {
        if (!c.__layer) c.__layer = new Layer(c); else c.__layer.palette();
        c.__layer.draw(8);
        if (slide && slide.contains(c)) active.push(c.__layer);
      });
      if (active.length && !reduced && !(window.Deck && Deck.mode.static)) raf = requestAnimationFrame(loop);
    },
    stop: function () { cancelAnimationFrame(raf); }
  };
})();
