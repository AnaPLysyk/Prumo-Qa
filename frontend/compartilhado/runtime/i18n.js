'use strict';
// Internacionalização (2.8): português do Brasil (fonte) e inglês. O texto-fonte é o próprio português; o inglês vem de
// i18n-en.js (dicionário exato + regras para textos com números/nomes). Termos técnicos (PASS, FAIL, BLOCKED, códigos de erro,
// nomes de ferramentas) e conteúdo do usuário NÃO são traduzidos. O que não tiver tradução continua em português: nunca há
// tradução parcial inventada.
const PrumoI18n = (() => {
  let idioma = 'pt-BR'; let observador = null;
  // Originais em português, para restaurar a página ao voltar do inglês sem recarregar (nós estáticos do HTML, como o menu).
  const originaisTexto = new Map(); const originaisAttr = new Map();
  const dic = () => window.PRUMO_EN || {}; const regras = () => window.PRUMO_EN_REGRAS || [];
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  function traduzir(s) {
    if (idioma !== 'en' || typeof s !== 'string') return s; const n = norm(s); if (!n) return s;
    let t = dic()[n];
    if (t === undefined) for (const [re, r] of regras()) if (re.test(n)) { t = typeof r === 'function' ? r(re.exec(n)) : n.replace(re, r); break; }
    if (t === undefined) return s;
    return (/^\s*/.exec(s) || [''])[0] + t + (/\s*$/.exec(s) || [''])[0];
  }
  const ATRIBUTOS = ['aria-label', 'title', 'placeholder', 'alt'];
  const ignorar = (el) => el && el.closest && el.closest('script, style, pre, code, textarea, [data-i18n-ignore]');
  function traduzirAtributos(el) { for (const a of ATRIBUTOS) { const v = el.getAttribute && el.getAttribute(a); if (v) { const t = traduzir(v); if (t !== v) { if (!originaisAttr.has(el)) originaisAttr.set(el, {}); originaisAttr.get(el)[a] ??= v; el.setAttribute(a, t); } } } }
  const trocarTexto = (no) => { const t = traduzir(no.nodeValue); if (t !== no.nodeValue) { if (originaisTexto.size > 2000) for (const n of originaisTexto.keys()) if (!n.isConnected) originaisTexto.delete(n); if (!originaisTexto.has(no)) originaisTexto.set(no, no.nodeValue); no.nodeValue = t; } };
  function traduzirArvore(raiz) {
    if (idioma !== 'en' || !raiz) return;
    if (raiz.nodeType === 3) { if (!ignorar(raiz.parentElement)) trocarTexto(raiz); return; }
    if (raiz.nodeType !== 1 || ignorar(raiz)) return; traduzirAtributos(raiz);
    const alvo = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = alvo.nextNode(); n; n = alvo.nextNode()) {
      if (n.nodeType === 3) { if (!ignorar(n.parentElement)) trocarTexto(n); } else if (!ignorar(n)) traduzirAtributos(n);
    }
  }
  function definir(i) {
    const anterior = idioma; idioma = i === 'en' ? 'en' : 'pt-BR';
    if (anterior === 'en' && idioma !== 'en') { for (const [no, original] of originaisTexto) if (no.isConnected) no.nodeValue = original; for (const [el, attrs] of originaisAttr) if (el.isConnected) for (const [a, v] of Object.entries(attrs)) el.setAttribute(a, v); originaisTexto.clear(); originaisAttr.clear(); }
    if (observador) { observador.disconnect(); observador = null; }
    if (idioma === 'en') {
      observador = new MutationObserver((muts) => { for (const m of muts) { if (m.type === 'attributes') { if (!ignorar(m.target)) traduzirAtributos(m.target); } else for (const n of m.addedNodes) traduzirArvore(n); } });
      observador.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ATRIBUTOS });
    }
  }
  const traduzirDocumento = () => { document.title = traduzir('Prumo QA'); traduzirArvore(document.body); };
  return { definir, traduzir, traduzirDocumento, get idioma() { return idioma; } };
})();
/** Texto de interface com variáveis: tr('A cada {n} min', { n: 5 }). Em português devolve a própria chave. */
function tr(pt, vars) {
  const base = PrumoI18n.idioma === 'en' ? (PrumoI18n.traduzir(pt) || pt) : pt;
  return vars ? base.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : '{' + k + '}')) : base;
}
