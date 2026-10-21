'use strict';
// Robôs 3D dos agentes, gerados no próprio aplicativo com Three.js local (sem rede, sem imagens de terceiros).
// Um único renderizador WebGL desenha os robôs visíveis e copia cada quadro para o canvas do agente.
// Apresentação apenas: o movimento é visual e não indica execução. Movimento reduzido desenha um quadro parado.
const PrumoRobos = (() => {
  const T = window.THREE; if (!T) return { criar: () => null };
  // Uma identidade por especialização; prévias locais reaproveitam a lista em ciclo.
  const VARIANTES = [
    { cor: 0x6ea8ff, casco: 0xe8edf6, visor: 'faixa', orelha: 'disco', crista: false, antena: false },
    { cor: 0x52e0c4, casco: 0xd5e3ec, visor: 'olhos', orelha: 'aleta', crista: true, antena: false },
    { cor: 0xb38cff, casco: 0x2c3240, visor: 'faixa', orelha: 'disco', crista: false, antena: true },
    { cor: 0xffa055, casco: 0x3b414d, visor: 'monocular', orelha: 'aleta', crista: false, antena: false },
    { cor: 0x7ee08a, casco: 0xe2e8ee, visor: 'olhos', orelha: 'disco', crista: true, antena: true },
    { cor: 0x6fd3ff, casco: 0x1f2532, visor: 'olhos', orelha: 'nenhuma', crista: true, antena: false },
    { cor: 0xff6f9a, casco: 0xedf0f5, visor: 'faixa', orelha: 'aleta', crista: false, antena: true },
    { cor: 0xf2c95b, casco: 0x2b303b, visor: 'monocular', orelha: 'disco', crista: true, antena: false },
    { cor: 0x9e92ff, casco: 0xe9e7f4, visor: 'olhos', orelha: 'aleta', crista: false, antena: true } // UI e UX: identidade lilás, robô 3D próprio
  ];
  const ENQUADRAMENTO = { lista: { fov: 25, z: 8.4, y: .1, portal: 1 }, perfil: { fov: 25, z: 7.4, y: -.05, portal: 1.2 }, cerebro: { fov: 27, z: 9, y: .1, portal: 1.35 } };
  let renderer = null, falhou = false, ambiente = null;
  function obterRenderer() {
    if (renderer || falhou) return renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setClearColor(0x000000, 0); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
      // Ambiente de estúdio para reflexos do metal: gradiente frio com dois painéis de luz.
      const cena = new T.Scene(); const ceu = new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.MeshBasicMaterial({ side: T.BackSide, vertexColors: true }));
      const pos = ceu.geometry.attributes.position, cores = []; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 20; const c = new T.Color().setRGB(.05 + .25 * Math.max(0, y), .08 + .3 * Math.max(0, y), .16 + .45 * Math.max(0, y)); cores.push(c.r, c.g, c.b); }
      ceu.geometry.setAttribute('color', new T.Float32BufferAttribute(cores, 3)); cena.add(ceu);
      for (const [x, y, z, w, h, cor] of [[6, 5, 6, 6, 3, 0xffffff], [-7, 2, -3, 3, 6, 0x88aaff], [0, -6, 4, 8, 1, 0x553388]]) { const p = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: cor, side: T.DoubleSide })); p.position.set(x, y, z); p.lookAt(0, 0, 0); cena.add(p); }
      const pm = new T.PMREMGenerator(renderer); ambiente = pm.fromScene(cena, .04).texture; pm.dispose();
    } catch { falhou = true; renderer = null; }
    return renderer;
  }
  // Androide por raymarching: a mesma cabeça humana descrita por campo de distância, agora como casco sólido
  // (placas brilhantes, emendas, olhos/viseira acesos, LED na têmpora, pescoço segmentado). Sem fundo.
  const VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const FRAG = `
    precision highp float;
    uniform vec2 uRes, uOlhar; uniform float uTempo, uPisca, uVisor, uFov, uCamZ, uCamY; uniform mat3 uRotC, uRotT; uniform vec3 uCor, uCasco, uMetal;
    varying vec2 vUv;
    const vec3 PIVO = vec3(0.0, -0.55, 0.0);
    float sdE(vec3 p, vec3 r){ float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
    float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
    float smax(float a, float b, float k){ return -smin(-a, -b, k); }
    float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
    const vec3 OLHO = vec3(0.245, 0.162, 0.655);
    float cabeca(vec3 p){
      vec3 q = vec3(abs(p.x), p.y, p.z);
      float d = sdE(p - vec3(0.0, 0.3, -0.06), vec3(0.73, 0.86, 0.86));
      d = smin(d, sdE(q - vec3(0.33, -0.38, 0.1), vec3(0.22, 0.24, 0.32)), 0.22);
      d = smin(d, sdE(p - vec3(0.0, -0.56, 0.32), vec3(0.2, 0.15, 0.2)), 0.18);
      d = smin(d, sdE(q - vec3(0.37, -0.05, 0.43), vec3(0.2, 0.15, 0.22)), 0.16);
      d = smin(d, sdE(p - vec3(0.0, 0.34, 0.6), vec3(0.5, 0.09, 0.17)), 0.1);
      d = smax(d, -sdE(q - vec3(0.25, 0.165, 0.73), vec3(0.125, 0.07, 0.1)), 0.05);
      d = min(d, length(q - OLHO) - 0.066);
      d = smin(d, sdE(q - vec3(0.245, 0.236, 0.682), vec3(0.1, 0.03, 0.066)), 0.022);
      d = smin(d, sdE(q - vec3(0.245, 0.094, 0.686), vec3(0.09, 0.018, 0.05)), 0.018);
      d = smin(d, sdCap(p, vec3(0.0, 0.15, 0.76), vec3(0.0, -0.04, 0.86), 0.034), 0.07);
      d = smin(d, length(p - vec3(0.0, -0.075, 0.845)) - 0.05, 0.06);
      d = smin(d, sdE(p - vec3(0.0, -0.29, 0.752), vec3(0.13, 0.022, 0.05)), 0.05);
      d = smin(d, sdE(p - vec3(0.0, -0.35, 0.736), vec3(0.11, 0.026, 0.05)), 0.05);
      d = smin(d, sdE(q - vec3(0.72, 0.1, -0.03), vec3(0.05, 0.17, 0.17)), 0.04);
      return d;
    }
    float corpo(vec3 p){ float d = sdCap(p, vec3(0.0, -0.62, -0.08), vec3(0.0, -1.55, -0.14), 0.29); return smin(d, sdE(p - vec3(0.0, -1.78, -0.14), vec3(1.25, 0.36, 0.58)), 0.35); }
    vec3 localC(vec3 p){ return uRotC * (p - PIVO) + PIVO; }
    vec3 localT(vec3 p){ return uRotT * (p - PIVO) + PIVO; }
    float mapa(vec3 p){ return smin(cabeca(localC(p)), corpo(localT(p)), 0.16); }
    vec3 normal(vec3 p){ const vec2 e = vec2(0.0015, -0.0015); return normalize(e.xyy * mapa(p + e.xyy) + e.yyx * mapa(p + e.yyx) + e.yxy * mapa(p + e.yxy) + e.xxx * mapa(p + e.xxx)); }
    vec3 aces(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    void main(){
      vec2 uv = vUv * 2.0 - 1.0; uv.x *= uRes.x / uRes.y;
      vec3 ro = vec3(0.0, uCamY, uCamZ), rd = normalize(vec3(uv * tan(uFov * 0.5), -1.0));
      vec3 c = vec3(0.0, -0.45, 0.0); vec3 oc = ro - c; float b = dot(oc, rd), cc = dot(oc, oc) - 2.7 * 2.7, disc = b * b - cc;
      float brilhoOlho = 0.0; vec3 olhoE = vec3(-0.25, 0.165, 0.69), olhoD = vec3(0.25, 0.165, 0.69);
      if (disc < 0.0) { gl_FragColor = vec4(0.0); return; }
      float t = max(0.0, -b - sqrt(disc)), tMax = -b + sqrt(disc); bool achou = false; vec3 p;
      for (int i = 0; i < 90; i++) {
        p = ro + rd * t; float d = mapa(p);
        vec3 hp = localC(p); float de = min(length((hp - olhoE) * vec3(uVisor > 0.5 ? 0.45 : 1.0, 1.0, 1.0)), length((hp - olhoD) * vec3(uVisor > 0.5 ? 0.45 : 1.0, 1.0, 1.0)));
        brilhoOlho += exp(-de * 30.0) * 0.006;
        if (d < 0.0012) { achou = true; break; }
        t += d * 0.9; if (t > tMax) break;
      }
      brilhoOlho *= (1.0 - uPisca);
      if (!achou) { float a = clamp(brilhoOlho, 0.0, 0.6); gl_FragColor = vec4(uCor * a, a); return; }
      vec3 n = normal(p), v = -rd; vec3 hp = localC(p), bp = localT(p);
      bool ehCabeca = cabeca(hp) < corpo(bp) + 0.03;
      vec3 hq = vec3(abs(hp.x), hp.y, hp.z); bool ehOlho = ehCabeca && length(hq - OLHO) < 0.069;
      // Máscara facial: placa perolada na frente; crânio metálico atrás e nas laterais.
      float limite = 0.27 + 0.16 * hp.y * hp.y + 0.12 * max(0.0, hp.y - 0.45);
      float placa = ehCabeca ? smoothstep(limite - 0.03, limite + 0.03, hp.z) * (1.0 - smoothstep(0.62, 0.72, hq.x)) : 0.0;
      vec3 base = mix(uMetal, uCasco, placa); float aspereza = mix(0.42, 0.2, placa), metal = mix(0.75, 0.12, placa);
      float emenda = 0.0, circuito = 0.0;
      if (ehCabeca && !ehOlho) {
        emenda = exp(-pow((hp.z - limite) / 0.011, 2.0)) * step(-0.72, hp.y) * step(hp.y, 0.86);
        float ang = atan(hp.x, -hp.z) * 3.0, lat = hp.y * 9.0;
        circuito = (1.0 - placa) * (exp(-pow((hp.y - 0.62) / 0.008, 2.0)) + exp(-pow((hp.y - 0.2) / 0.008, 2.0)) * step(hp.z, 0.1) + exp(-pow(hp.x / 0.008, 2.0)) * step(0.55, hp.y) * step(hp.z, 0.2));
      } else if (!ehCabeca) {
        float anel = abs(fract((bp.y + 0.62) * 7.0) - 0.5); emenda = (1.0 - smoothstep(0.035, 0.06, anel)) * step(-1.45, bp.y) * step(bp.y, -0.62);
      }
      vec3 L1 = normalize(vec3(0.5, 0.7, 0.8)), L2 = normalize(vec3(-0.85, 0.25, -0.4)), L3 = normalize(vec3(0.7, -0.2, -0.6)), L4 = normalize(vec3(0.0, 1.0, 0.1));
      vec3 hv = normalize(L1 + v); float nl = dot(n, L1), nv = max(dot(n, v), 0.0);
      float dif = mix(max(nl, 0.0), clamp((nl + 0.4) / 1.4, 0.0, 1.0), placa);
      float esp = pow(max(dot(n, hv), 0.0), mix(24.0, 70.0, placa)) * mix(1.3, 0.75, placa);
      float fres = pow(1.0 - nv, 3.0); vec3 r = reflect(rd, n);
      vec3 ambiente = mix(vec3(0.03, 0.04, 0.08), vec3(0.6, 0.7, 0.92), clamp(r.y * 0.5 + 0.5, 0.0, 1.0)) + uCor * 0.3 * pow(max(dot(r, L2), 0.0), 4.0);
      float ao = 1.0; for (int i = 1; i < 5; i++) { float hh = 0.035 * float(i); ao -= (hh - mapa(p + n * hh)) * 1.7 / float(i); } ao = clamp(ao, 0.3, 1.0);
      vec3 col = base * (0.12 + 0.88 * dif) * mix(1.0, 0.4, metal) + ambiente * mix(base, vec3(1.0), 0.3) * mix(0.14, 1.0, metal) * (0.3 + 0.7 * fres);
      col += vec3(1.0) * esp + uCor * (pow(max(dot(n, L2), 0.0), 2.0) * 0.85 + fres * 0.5) + vec3(0.42, 0.36, 0.95) * max(dot(n, L3), 0.0) * 0.22 + vec3(0.9, 0.95, 1.0) * max(dot(n, L4), 0.0) * 0.12 * placa;
      col *= ao; col *= 1.0 - emenda * 0.75; col += uCor * emenda * (ehCabeca ? 0.12 : 0.45) + uCor * circuito * (0.25 + 0.2 * sin(uTempo * 1.4 + hp.y * 6.0));
      if (ehOlho) {
        // Globo escuro brilhante, íris luminosa em anel e pupila que acompanham o olhar.
        vec3 centro = vec3(sign(hp.x) * OLHO.x, OLHO.y, OLHO.z); vec3 dir = normalize(hp - centro);
        vec3 olhar = normalize(vec3(uOlhar.x * 0.45, uOlhar.y * 0.35, 1.0)); float cosA = dot(dir, olhar);
        float iris = smoothstep(cos(0.7), cos(0.58), cosA);
        float pupila = smoothstep(cos(0.2), cos(0.15), cosA); float anelIris = smoothstep(cos(0.7), cos(0.62), cosA) * (1.0 - smoothstep(cos(0.6), cos(0.52), cosA));
        vec3 globo = vec3(0.015, 0.02, 0.035) + vec3(1.0) * pow(max(dot(n, hv), 0.0), 140.0) * 1.6 + ambiente * 0.25 * fres;
        vec3 corIris = uCor * (0.55 + 0.45 * smoothstep(cos(0.2), cos(0.62), cosA)); col = mix(globo, globo * 0.3 + corIris * (0.9 + 0.15 * sin(uTempo * 3.0)), iris * (1.0 - pupila)) + uCor * anelIris * 0.8;
        col = mix(col, uCasco * 0.55 * (0.4 + 0.6 * dif), uPisca);
      } else if (ehCabeca) {
        float led = 1.0 - smoothstep(0.006, 0.016, abs(length(hq.yz - vec2(0.22, 0.05)) - 0.07)); led *= step(0.62, hq.x);
        col += uCor * led * (1.2 + 0.6 * sin(uTempo * 2.2));
      }
      col += uCor * brilhoOlho * 0.6;
      gl_FragColor = vec4(pow(aces(col * 1.05), vec3(1.0 / 2.2)), 1.0);
    }`;
  function montar(indice, modo) {
    const v = VARIANTES[indice % VARIANTES.length], cor = new T.Color(v.cor), enq = ENQUADRAMENTO[modo];
    const claro = new T.Color(v.casco).getHSL({}).l > .5;
    const mat = new T.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthTest: false, depthWrite: false,
      uniforms: { uRes: { value: new T.Vector2(1, 1) }, uTempo: { value: 0 }, uPisca: { value: 0 }, uVisor: { value: v.visor === 'faixa' ? 1 : 0 }, uFov: { value: enq.fov * Math.PI / 180 }, uCamZ: { value: enq.z }, uCamY: { value: enq.y },
        uRotC: { value: new T.Matrix3() }, uOlhar: { value: new T.Vector2() }, uRotT: { value: new T.Matrix3() }, uCor: { value: new T.Vector3(cor.r, cor.g, cor.b) },
        uCasco: { value: (() => { const c = new T.Color(v.casco).convertSRGBToLinear(); return new T.Vector3(c.r, c.g, c.b); })() },
        uMetal: { value: (() => { const c = new T.Color(claro ? 0x262c38 : 0x6b7383).convertSRGBToLinear(); return new T.Vector3(c.r, c.g, c.b); })() } } });
    const cena = new T.Scene(); cena.add(new T.Mesh(new T.PlaneGeometry(2, 2), mat));
    const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    return { cena, camera, mat, rot: { y: 0, x: 0 }, semente: indice * 1.913 + .37 };
  }
  const eulerC = new T.Euler(), eulerT = new T.Euler(), m4 = new T.Matrix4();
  // Movimento humano: olha para um lado e para o outro, acompanha o cursor, respira e pisca.
  function animar(r, t, dt, item) {
    const s = r.semente; const alvoY = item.olhar ? item.olhar.x * .55 : Math.sin(t * .29 + s) * .38 + Math.sin(t * .11 + s * 2) * .14;
    const alvoX = item.olhar ? item.olhar.y * .25 : Math.sin(t * .27 + s) * .07 + Math.sin(t * .71 + s) * .02;
    const k = 1 - Math.exp(-dt * (item.olhar ? 5 : 2)); r.rot.y += (alvoY - r.rot.y) * k; r.rot.x += (alvoX - r.rot.x) * k;
    const inclina = Math.sin(t * .19 + s) * .04 - r.rot.y * .06, respira = Math.sin(t * 1.05 + s) * .012;
    // Matrizes inversas (mundo → local) para o shader.
    eulerC.set(-r.rot.x - respira, -r.rot.y, -inclina, 'ZYX'); r.mat.uniforms.uRotC.value.setFromMatrix4(m4.makeRotationFromEuler(eulerC));
    eulerT.set(-respira * .5, -r.rot.y * .18, 0, 'ZYX'); r.mat.uniforms.uRotT.value.setFromMatrix4(m4.makeRotationFromEuler(eulerT));
    if (!r.sacada || t > r.sacada) { r.sacada = t + .9 + ((s * 53 + t * 7) % 2.2); r.alvoOlhar = { x: (((s * 31 + t * 13) % 2) - 1) * .35, y: (((s * 17 + t * 5) % 2) - 1) * .2 }; }
    const gx = item.olhar ? item.olhar.x - r.rot.y * .3 : r.alvoOlhar.x - r.rot.y * .9, gy = item.olhar ? -item.olhar.y * .8 : r.alvoOlhar.y + r.rot.x * .6;
    r.olho = r.olho || { x: 0, y: 0 }; const ko = 1 - Math.exp(-dt * 14); r.olho.x += (gx - r.olho.x) * ko; r.olho.y += (gy - r.olho.y) * ko; r.mat.uniforms.uOlhar.value.set(Math.max(-1, Math.min(1, r.olho.x)), Math.max(-1, Math.min(1, r.olho.y)));
    if (!r.piscar || t > r.piscar + 6) r.piscar = t + 2 + ((s * 97) % 4);
    const p = t - r.piscar; r.mat.uniforms.uPisca.value = p > 0 && p < .16 ? Math.sin(p / .16 * Math.PI) : 0;
    r.mat.uniforms.uTempo.value = t; r.mat.uniforms.uRes.value.set(item.canvas.width, item.canvas.height);
  }
  const itens = new Set(); let quadro = 0, ultimo = 0;
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  function desenhar(item, t, dt) {
    const rr = obterRenderer(); if (!rr) return;
    const w = Math.max(2, Math.round(item.canvas.clientWidth * item.dpr)), hh = Math.max(2, Math.round(item.canvas.clientHeight * item.dpr));
    if (item.canvas.width !== w || item.canvas.height !== hh) { item.canvas.width = w; item.canvas.height = hh; }
    const atual = rr.getSize(new T.Vector2()); if (atual.x !== w || atual.y !== hh) rr.setSize(w, hh, false);
    item.r.camera.aspect = w / hh; item.r.camera.updateProjectionMatrix(); animar(item.r, t, dt, item);
    rr.render(item.r.cena, item.r.camera); item.ctx.clearRect(0, 0, w, hh); item.ctx.drawImage(rr.domElement, 0, 0, w, hh);
  }
  function ciclo(agora) {
    quadro = 0; const t = agora / 1000, dt = Math.min(.1, t - (ultimo || t));
    if (agora - ultimo * 1000 >= 30 || !ultimo) { ultimo = t; for (const it of [...itens]) { if (!it.canvas.isConnected) { if (it.visto) itens.delete(it); continue; } it.visto = true; if (it.visivel) desenhar(it, reduzido.matches ? it.r.semente * 10 : t, reduzido.matches ? 1 : dt); } }
    if (itens.size && !document.hidden && !reduzido.matches) quadro = requestAnimationFrame(ciclo);
  }
  const iniciar = () => { if (!quadro) quadro = requestAnimationFrame(ciclo); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) iniciar(); });
  reduzido.addEventListener?.('change', () => { for (const it of itens) it.host.dataset.movimento = reduzido.matches ? 'parado' : 'vivo'; iniciar(); });
  const io = new IntersectionObserver((es) => { for (const e of es) { const it = [...itens].find((x) => x.canvas === e.target); if (it) { it.visivel = e.isIntersecting; if (it.visivel) { desenhar(it, performance.now() / 1000, .016); iniciar(); } } } });
  /** Robô 3D no elemento host. modo: 'lista' | 'perfil' | 'cerebro'. Devolve o host ou null sem WebGL. */
  function criar(host, indice, modo = 'lista', areaOlhar) {
    if (!obterRenderer()) return null;
    const canvas = document.createElement('canvas'); canvas.className = 'v36-robo-canvas'; canvas.setAttribute('aria-hidden', 'true'); host.classList.add('v36-robo'); host.append(canvas);
    host.dataset.movimento = reduzido.matches ? 'parado' : 'vivo';
    const item = { host, canvas, ctx: canvas.getContext('2d'), r: montar(indice, modo), dpr: Math.min(devicePixelRatio || 1, modo === 'lista' ? 1.25 : 1.5), visivel: true, olhar: null };
    const area = areaOlhar || host;
    area.addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); item.olhar = { x: Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width - .5) * 2)), y: Math.max(-1, Math.min(1, ((e.clientY - b.top) / b.height - .45) * 2)) }; });
    area.addEventListener('pointerleave', () => { item.olhar = null; });
    itens.add(item); io.observe(canvas); requestAnimationFrame(() => { if (canvas.isConnected) desenhar(item, reduzido.matches ? item.r.semente * 10 : performance.now() / 1000, .016); iniciar(); });
    return host;
  }
  return { criar };
})();
