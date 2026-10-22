'use strict';
// Camada de apresentação. Não calcula métricas nem classifica resultados: só exibe o que o núcleo devolve.
// Todo texto entra no DOM por textContent (nunca innerHTML).
const api = window.prumo;
const $ = (s) => document.querySelector(s);
const estado = { aba: 'inicio', root: null, projetoSelecionadoId: null, timer: null, jobId: undefined, ajudaAlvo: null, aviso: null, prefs: null };

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
const TEXTO_DO_CODIGO = {
  SERVICE_NOT_FOUND: 'O serviço não achou o que foi pedido. Confira o projeto ou o repositório ligado.',
  SERVICE_PERMISSION: 'A conta conectada não tem permissão para isso.',
  CREDENTIAL_INVALID_OR_EXPIRED: 'O token não vale mais. Conecte de novo em Projetos.',
  CREDENTIAL_UNAVAILABLE: 'Não há conexão ativa para este serviço. Conecte em Projetos.',
  SERVICE_RATE_LIMIT: 'O serviço pediu uma pausa. Tente de novo em alguns minutos.',
  SERVICE_TIMEOUT: 'O serviço demorou demais para responder.',
  SERVICE_UNAVAILABLE: 'O serviço está fora do ar agora.',
  LOCAL_CASE_LIMIT: 'O Prumo guarda até 1.000 cenários por projeto. Remova algum para criar outro.',
  LOCAL_SUITE_LIMIT: 'O Prumo guarda até 100 suítes. Remova alguma para criar outra.',
  LOCAL_CASE_NOT_FOUND: 'Este cenário não existe mais (talvez já tenha sido removido).',
  MANUAL_DISABLED: 'O módulo Manual/Prumo está desligado neste projeto. Ligue em Projetos para escrever cenários.',
  // IDE e terminal: o texto vem antes do código.
  IDE_ARQUIVO_ALTERADO: 'O arquivo mudou fora do Prumo depois de aberto. Feche a aba e abra de novo antes de salvar, para não apagar a mudança.',
  IDE_ARQUIVO_EXISTENTE: 'Já existe um arquivo com esse nome. Abra-o pelo explorador para editar.',
  IDE_CAMINHO_INVALIDO: 'Esse caminho não vale: use um caminho dentro da pasta do projeto, sem "..", sem pastas internas do Git e sem arquivos de credenciais.',
  IDE_SEGREDO_PROTEGIDO: 'O arquivo parece ter um segredo e o Prumo não o edita. Mexa nele em outro editor.',
  IDE_CONTEUDO_INVALIDO: 'O conteúdo é grande demais (limite de 300 KB) ou não é texto.',
  IDE_SEM_REPOSITORIO: 'Este projeto não tem pasta local. Vincule uma pasta ou traga o repositório do GitHub.',
  IDE_ATALHO_RECUSADO: 'O caminho passa por um atalho (link simbólico), que o Prumo não segue por segurança.',
  IDE_FORA_DO_REPOSITORIO: 'Esse caminho sai da pasta do projeto, então foi recusado.',
  TERMINAL_COMANDO_VAZIO: 'Digite um comando.',
  TERMINAL_COMANDO_LONGO: 'O comando passa de 1.000 caracteres.',
  TERMINAL_COMANDO_INVALIDO: 'O comando precisa ser de uma linha só, sem caracteres de controle.',
  TERMINAL_COMANDO_DESCONHECIDO: 'Esse comando já saiu da memória do Prumo, que guarda a saída por 10 minutos.',
  CODE_SCOPE_CHANGED: 'O projeto ou a pasta mudou enquanto você confirmava. Faça de novo.',
  CODE_BUSY: 'Já há uma operação de código neste projeto. Espere terminar.'
};
function textoErro(erro) {
  const bruto = String(erro || '').trim();
  if (TEXTO_DO_CODIGO[bruto]) return TEXTO_DO_CODIGO[bruto] + ' (código ' + bruto + ')';
  const m = /^([A-Z][A-Z0-9_]{2,63}):\s*([\s\S]+)$/.exec(String(erro || ''));
  if (!m) return String(erro || 'Falha sem detalhe.');
  const texto = m[2].trim(); return texto.charAt(0).toUpperCase() + texto.slice(1) + ' (código ' + m[1] + ')';
}
function semProjeto() {
  return h('div', { class: 'vazio' }, 'Nenhum projeto selecionado. Em ', h('strong', {}, 'Projetos'), ', vincule uma pasta com qa.project.json ou adicione o projeto de demonstração.');
}

const abas = {};

function salvarRaiz() { if (estado.espaco && estado.espaco.raizContextos !== estado.root) estado.espaco = null; estado.projetoSelecionadoId = estado.espaco?.id || null; try { if (estado.root) localStorage.setItem('raiz', estado.root); else localStorage.removeItem('raiz'); if (estado.espaco) localStorage.setItem('espaco', estado.espaco.id); else localStorage.removeItem('espaco'); } catch { /* sem armazenamento: ignora */ } }
// 2.13: Execuções e Rastreabilidade deixaram de ser telas; viram subabas de Testes (Runs e Vínculos). Os nomes antigos continuam abrindo o lugar novo.
const rotasVirtuais = { conexoes: ['projetos', 'conexoes'], runs: ['testes', 'runs'], execucoes: ['testes', 'runs'], automacoes: ['testes', 'pipelines'], vinculos: ['testes', 'repositorio'], rastreabilidade: ['testes', 'repositorio'] };
async function mostrar(aba) {
  if (rotasVirtuais[aba]) { const [pai, sub] = rotasVirtuais[aba]; (estado.sub ||= {})[pai] = sub; aba = pai; }
  clearInterval(estado.timer); estado.aba = aba;
  if (typeof registrarTela === 'function') registrarTela(aba);
  for (const b of document.querySelectorAll('#nav button')) { if (b.dataset.aba === aba) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  // Corrida de navegação: cada renderização usa um token e constrói num contêiner separado; só a mais recente é anexada.
  // Sem isso, duas trocas rápidas de aba escreviam no mesmo elemento e misturavam conteúdos ou duplicavam ids.
  const token = (estado.render = (estado.render || 0) + 1); const el = document.createElement('div');
  const locais = await chamar(api.projetos); const espacos = await chamar(api.espacos);
  // Consulta que falhou não prova que o projeto sumiu: só descarta a seleção quando as duas listas vieram.
  const consultou = !!locais && !!espacos;
  // Seleção por ID evita mistura de projetos que tenham a mesma raiz (ou nenhuma raiz).
  if (espacos) {
    const id = estado.espaco?.id || estado.projetoSelecionadoId;
    estado.espaco = (id ? espacos.find(e => e.id === id) : null)
      || (!id && estado.root ? espacos.find(e => e.raizContextos === estado.root || e.pastaLocal === estado.root) : null)
      || null;
    estado.projetoSelecionadoId = estado.espaco?.id || null;
  }
  const nome = estado.espaco || locais?.find((p) => p.root === estado.root);
  if (token !== estado.render) return;
  if (estado.root && !nome && consultou) estado.root = null;
  // 2.10.2: um só nome de projeto atual para lateral, Suporte e Projetos (inclusive pasta com contrato local, como a demonstração).
  if (nome || consultou) {
    estado.projetoNome = nome ? (nome.nome || nome.name || nome.id) : null;
    estado.projetoLegado = !!nome && !estado.espaco;
    const atual = estado.projetoNome || 'nenhum selecionado';
    $('#projeto-atual').textContent = atual;
    const seletor = $('#projeto-botao');
    if (seletor?.setAttribute) seletor.setAttribute('aria-label', 'Contexto ativo: ' + atual + '. Trocar projeto');
  }
  if (typeof atualizarMenuDoProjeto === 'function') atualizarMenuDoProjeto(estado.espaco);
  try { await abas[aba](el); } catch (erro) {
    console.error("Falha ao carregar a seção " + aba + ":", erro?.stack || erro);
    if (token !== estado.render) return;
    // Uma tela parcialmente montada não deve substituir o conteúdo por uma área incompleta.
    el.replaceChildren(DS.estadoTela('erro', 'Não foi possível abrir esta tela', 'A seção falhou ao carregar. Tente novamente.',
      [DS.acao('Tentar novamente', () => mostrar(aba), { icone: 'atualizar' })], { id: 'tela-falha-carregamento' }));
    avisar('Falha ao carregar a seção.', true);
  }
  if (token !== estado.render) return;
  $('#conteudo').replaceChildren(...el.childNodes);
  if (typeof desenharTrilha === 'function') desenharTrilha();
  if (typeof montarSeletorProjeto === 'function') montarSeletorProjeto(espacos, locais);
}

(async () => {
  // Espera todos os scripts da página terminarem de executar antes de montar a primeira tela.
  if (document.readyState === 'loading') await new Promise((ok) => document.addEventListener('DOMContentLoaded', ok, { once: true }));
  const info = await chamar(api.info); if (info) $('#versao').textContent = 'v' + info.version;
  // 2.11: com o login ligado, nada mais carrega antes de a pessoa entrar (a tela de entrada recarrega a janela ao concluir).
  if (window.PrumoConta && !(await window.PrumoConta.iniciar())) return;
  try { estado.root = localStorage.getItem('raiz'); estado.projetoSelecionadoId = localStorage.getItem('espaco'); } catch { /* ignora */ }
  for (const b of document.querySelectorAll('#nav button')) b.addEventListener('click', () => mostrar(b.dataset.aba));
  iniciarMenu();
  await iniciarAgenda();
  // Abre diretamente uma tela permitida; não exibe Início bloqueado antes de redirecionar.
  void mostrar(window.PrumoConta?.telaInicial?.() || 'inicio');
  iniciarNotificacoes();
})();
