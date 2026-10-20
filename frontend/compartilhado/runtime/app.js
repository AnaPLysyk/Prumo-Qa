'use strict';
// Camada de apresentação. Não calcula métricas nem classifica resultados: só exibe o que o núcleo devolve.
// Todo texto entra no DOM por textContent (nunca innerHTML).
const api = window.prumo;
const $ = (s) => document.querySelector(s);
const estado = { aba: 'inicio', root: null, timer: null, jobId: undefined, ajudaAlvo: null, aviso: null, prefs: null };

// No DOM, append(null) escreve o texto "null". Nas telas, null/undefined/false sempre significam "nada a mostrar".
for (const P of [Element.prototype, DocumentFragment.prototype]) for (const m of ['append', 'prepend', 'replaceChildren']) { const original = P[m]; P[m] = function (...nos) { return original.apply(this, nos.filter((n) => n != null && n !== false)); }; }
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
  return el;
}
const rotulosSelo = { VALIDO: 'VÁLIDO', NAO_CONFIGURADO: 'NÃO CONFIGURADO', NAO_APLICAVEL: 'NÃO APLICÁVEL', ERRO_INFRA: 'ERRO DE INFRAESTRUTURA', EXECUTANDO: 'EXECUTANDO', INDISPONIVEL: 'CONSULTA NÃO CONCLUÍDA', LIMITE_DE_TAXA: 'LIMITE DE CONSULTAS', RESPOSTA_INVALIDA: 'RESPOSTA INVÁLIDA', SEM_RELEASE: 'SEM RELEASE', ATUALIZADO: 'ATUALIZADO', ATUALIZACAO_DISPONIVEL: 'ATUALIZAÇÃO DISPONÍVEL' };
const selo = (s) => h('span', { class: 'estado ' + s }, rotulosSelo[s] || s.replaceAll('_', ' '));
const hora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
const ms = (n) => (n === null || n === undefined ? 'indisponível' : Math.round(n * 10) / 10 + ' ms');
// Nome, título ou código que não deve ser traduzido para o inglês.
const semTraducao = (texto) => h('span', { 'data-i18n-ignore': '' }, texto);
// Texto sem acentos e em minúsculas, para comparar buscas.
const paraBusca = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// Estado da tela que sobrevive à troca de aba (aba interna, filtros), por tela e projeto.
// Duração de uma execução (Testes › Runs e histórico das rotinas em Agendamentos).
const duracaoDaExecucao = (n) => (n === null || n === undefined ? '—' : n < 1000 ? n + ' ms' : Math.round(n / 100) / 10 + ' s');
const memoriaDaTela = (tela, id) => ((estado.ds ||= {})[tela + ':' + id] ||= {});

/**
 * 2.11: o aviso aparece embaixo, centralizado na área de conteúdo, e some sozinho (4 s; erro 8 s; clique fecha antes).
 * Não cobre nada fixo: desvia do robô e do painel do chat, reserva espaço no fim da página e, com um modal aberto,
 * entra no fim do próprio modal (no fluxo, empurrando o conteúdo) em vez de flutuar por cima dele.
 */
function avisar(msg, erro) {
  const el = $('#aviso'); clearTimeout(avisar.t);
  el.textContent = msg; el.className = erro ? 'erro' : ''; el.hidden = false; el.onclick = () => esconderAviso(el);
  posicionarAviso(el);
  avisar.t = setTimeout(() => esconderAviso(el), erro ? 8000 : 4000);
}
function esconderAviso(el) {
  clearTimeout(avisar.t); el.hidden = true; document.body.classList.remove('com-aviso');
  if (el.parentElement !== document.body) document.body.append(el);
}
function posicionarAviso(el) {
  const visivel = (n) => !!n && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden';
  const modal = [...document.querySelectorAll('dialog[open]')].pop();
  if (modal) { modal.append(el); el.removeAttribute('style'); document.body.classList.remove('com-aviso'); return; }
  if (el.parentElement !== document.body) document.body.append(el);
  const area = $('#conteudo').getBoundingClientRect(); const esquerda = Math.max(area.left, 0); let direita = Math.min(area.right, innerWidth);
  const painel = document.querySelector('.v36f-painel'); if (visivel(painel)) direita = Math.min(direita, painel.getBoundingClientRect().left - 12);
  const centro = (esquerda + direita) / 2; let largura = Math.min(520, direita - esquerda - 24); let baixo = 16;
  const robo = document.querySelector('.v36f-botao');
  if (visivel(robo)) {
    const r = robo.getBoundingClientRect(); const livre = 2 * (r.left - 12 - centro);
    if (livre >= 220) largura = Math.min(largura, livre); else baixo = Math.max(baixo, innerHeight - r.top + 8);
  }
  Object.assign(el.style, { left: Math.round(centro) + 'px', bottom: Math.round(baixo) + 'px', maxWidth: Math.max(200, Math.floor(largura)) + 'px' });
  document.body.style.setProperty('--aviso-reserva', Math.ceil(el.getBoundingClientRect().height + baixo + 16) + 'px'); document.body.classList.add('com-aviso');
}
/** Chamada ao núcleo; erros viram aviso, nunca exceção solta. Sessão encerrada abre a tela de entrada em vez de repetir avisos. */
async function chamar(fn) {
  const r = await fn();
  if (!r.ok) { if (window.PrumoConta?.tratarErro(r.error)) return null; avisar(textoErro(r.error), true); return null; }
  return r.data;
}
/** Como chamar(), mas sem aviso: qualquer falha vira null (para painéis que mostram o próprio estado vazio). */
async function chamarSemAviso(fn) { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } }
/** 2.10.2: explicação primeiro, código técnico só como detalhe no fim ("CODIGO: texto" → "Texto (código CODIGO)"). */
function textoErro(erro) {
  const m = /^([A-Z][A-Z0-9_]{2,63}):\s*([\s\S]+)$/.exec(String(erro || ''));
  if (!m) return String(erro || 'Falha sem detalhe.');
  const texto = m[2].trim(); return texto.charAt(0).toUpperCase() + texto.slice(1) + ' (código ' + m[1] + ')';
}
function semProjeto() {
  return h('div', { class: 'vazio' }, 'Nenhum projeto selecionado. Em ', h('strong', {}, 'Projetos'), ', vincule uma pasta com qa.project.json ou adicione o projeto de demonstração.');
}

const abas = {};

function salvarRaiz() { if (estado.espaco && estado.espaco.raizContextos !== estado.root) estado.espaco = null; try { if (estado.root) localStorage.setItem('raiz', estado.root); else localStorage.removeItem('raiz'); if (estado.espaco) localStorage.setItem('espaco', estado.espaco.id); else localStorage.removeItem('espaco'); } catch { /* sem armazenamento: ignora */ } }
// 2.13: Execuções e Rastreabilidade deixaram de ser telas; viram subabas de Testes (Runs e Vínculos). Os nomes antigos continuam abrindo o lugar novo.
const rotasVirtuais = { runs: ['testes', 'runs'], execucoes: ['testes', 'runs'], automacoes: ['testes', 'pipelines'], vinculos: ['testes', 'repositorio'], rastreabilidade: ['testes', 'repositorio'] };
async function mostrar(aba) {
  if (rotasVirtuais[aba]) { const [pai, sub] = rotasVirtuais[aba]; (estado.sub ||= {})[pai] = sub; aba = pai; }
  clearInterval(estado.timer); estado.aba = aba;
  for (const b of document.querySelectorAll('#nav button')) { if (b.dataset.aba === aba) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  // Corrida de navegação: cada renderização usa um token e constrói num contêiner separado; só a mais recente é anexada.
  // Sem isso, duas trocas rápidas de aba escreviam no mesmo elemento e misturavam conteúdos ou duplicavam ids.
  const token = (estado.render = (estado.render || 0) + 1); const el = document.createElement('div');
  const locais = await chamar(api.projetos); const espacos = await chamar(api.espacos);
  // Consulta que falhou não prova que o projeto sumiu: só descarta a seleção quando as duas listas vieram.
  const consultou = !!locais && !!espacos;
  if (espacos) estado.espaco = espacos.find(e => e.raizContextos === estado.root) || null;
  const nome = estado.espaco || locais?.find((p) => p.root === estado.root);
  if (token !== estado.render) return;
  if (estado.root && !nome && consultou) estado.root = null;
  // 2.10.2: um só nome de projeto atual para lateral, Suporte e Projetos (inclusive pasta com contrato local, como a demonstração).
  if (nome || consultou) { estado.projetoNome = nome ? (nome.nome || nome.name || nome.id) : null; estado.projetoLegado = !!nome && !estado.espaco; $('#projeto-atual').textContent = estado.projetoNome || 'nenhum selecionado'; }
  try { await abas[aba](el); } catch {
    if (token !== estado.render) return;
    // Uma tela parcialmente montada não deve substituir o conteúdo por uma área incompleta.
    el.replaceChildren(DS.estadoTela('erro', 'Não foi possível abrir esta tela', 'A seção falhou ao carregar. Tente novamente.',
      [DS.acao('Tentar novamente', () => mostrar(aba), { icone: 'atualizar' })], { id: 'tela-falha-carregamento' }));
    avisar('Falha ao carregar a seção.', true);
  }
  if (token !== estado.render) return;
  $('#conteudo').replaceChildren(...el.childNodes);
  if (typeof montarSeletorProjeto === 'function') montarSeletorProjeto();
}

(async () => {
  // Espera todos os scripts da página terminarem de executar antes de montar a primeira tela.
  if (document.readyState === 'loading') await new Promise((ok) => document.addEventListener('DOMContentLoaded', ok, { once: true }));
  const info = await chamar(api.info); if (info) $('#versao').textContent = 'v' + info.version;
  // 2.11: com o login ligado, nada mais carrega antes de a pessoa entrar (a tela de entrada recarrega a janela ao concluir).
  if (window.PrumoConta && !(await window.PrumoConta.iniciar())) return;
  try { estado.root = localStorage.getItem('raiz'); } catch { /* ignora */ }
  for (const b of document.querySelectorAll('#nav button')) b.addEventListener('click', () => mostrar(b.dataset.aba));
  iniciarMenu();
  await iniciarAgenda();
  // Abre diretamente uma tela permitida; não exibe Início bloqueado antes de redirecionar.
  void mostrar(window.PrumoConta?.telaInicial?.() || 'inicio');
  iniciarNotificacoes();
})();
