/** Controlador da tela agendamentos: concentra canais de entrada, organizados por área funcional. */
import { autorizarRotina } from "./autorizacoes/autorizarRotina.js";
import { obterRotina } from "./banco/agenda.js";
import { permissoesDaRotina, listarAgenda, listarPermissoes } from "./regras/cicloDaRotina.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { solicitarAprovacao } from "../testes/servicoAprovacao.js";
import { desativarRotina, pausarRotina, retomarRotina, excluirRotina, definirPausaGlobal } from "./regras/cicloDaRotina.js";
import { workerDoAplicativo } from "./worker/workerDoAplicativo.js";
import { criarPoliticaPublicacao } from "./autorizacoes/politicas.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { revogarAutorizacao } from "./autorizacoes/estadoERevogacao.js";
import { criarRotina, editarRotina } from "./regras/cicloDaRotina.js";
import { validarRotina } from "./regras/cicloDaRotina.js";
import { estadoDoAplicativo } from "../aplicativo/estadoDoAplicativo.js";
import { avisosDaJanela } from "../aplicativo/avisos/avisos.js";
import { atualizarBandeja } from "../aplicativo/bandeja/cicloDaBandeja.js";

// controladorAgenda — operações relacionadas
export const agendaAutorizar: TratadorDoCanal<'agenda:autorizar'> = async (a, j) => {
  const i = idiomaAtual(); const r = obterRotina(a.id);
  if (!(await confirmarNoWindows(j, textoNoIdioma('autTitulo', i), textoNoIdioma('autMsg', i, { n: r.nome, d: a.dias, u: a.maxUsos }), textoNoIdioma('autDet', i, { r: permissoesDaRotina(r).join('\n'), a: r.ambiente }), textoNoIdioma('continuar', i)))) return { canceled: true };
  return { canceled: false, autorizacoes: await autorizarRotina(a.id, { dias: a.dias, maxUsos: a.maxUsos }, solicitarAprovacao) };
};

export const agendaEstado: TratadorDoCanal<'agenda:estado'> = a => (a.acao === 'pausar' ? pausarRotina(a.id) : a.acao === 'retomar' ? retomarRotina(a.id) : desativarRotina(a.id));

export const agendaExcluir: TratadorDoCanal<'agenda:excluir'> = async (a, j) => {
  const i = idiomaAtual(); const r = obterRotina(a.id);
  if (!(await confirmarNoWindows(j, textoNoIdioma('excluirTitulo', i), textoNoIdioma('excluirMsg', i, { n: r.nome }), textoNoIdioma('excluirDet', i), textoNoIdioma('excluirBtn', i)))) return { canceled: true };
  return { canceled: false, ...excluirRotina(a.id) };
};

export const agendaExecutar: TratadorDoCanal<'agenda:executar'> = async a => { const t = workerDoAplicativo.executarAgora(a.id); void workerDoAplicativo.tick(); return { trabalho: t.id, estado: t.estado }; };

export const agendaListar: TratadorDoCanal<'agenda:listar'> = a => listarAgenda(a.espacoId);

export const agendaPermissoes: TratadorDoCanal<'agenda:permissoes'> = a => listarPermissoes(a.espacoId);

export const agendaPolitica: TratadorDoCanal<'agenda:politica'> = async (a, j) => {
  const i = idiomaAtual(); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('polTitulo', i), textoNoIdioma('polMsg', i, { t: a.tickets.join(', ') }), textoNoIdioma('polDet', i, { p: e.nome, i: a.tipos.join(', '), d: a.dias, m: a.maxPublicacoes }), textoNoIdioma('polBtn', i)))) return { canceled: true };
  return { canceled: false, politica: criarPoliticaPublicacao(a.espacoId, { tickets: a.tickets, tipos: a.tipos, dias: a.dias, maxPublicacoes: a.maxPublicacoes }, usuarioDoWindows()) };
};

export const agendaRevogar: TratadorDoCanal<'agenda:revogar'> = a => ({ autorizacao: revogarAutorizacao('execucoes', a.id) });

export const agendaRevogarPolitica: TratadorDoCanal<'agenda:revogarpolitica'> = a => ({ politica: revogarAutorizacao('publicacoes', a.id) });

export const agendaSalvar: TratadorDoCanal<'agenda:salvar'> = async a => { await validarRotina(a.dados); return a.id ? editarRotina(a.id, a.dados) : criarRotina(a.dados); };

// controladorWorker — operações relacionadas
export const workerEstado: TratadorDoCanal<'worker:estado'> = () => ({ ...workerDoAplicativo.estado(), bandeja: estadoDoAplicativo.bandeja !== null });

export const workerEventos: TratadorDoCanal<'worker:eventos'> = a => ({ eventos: avisosDaJanela.filter(x => x.n > a.desde), ultimo: estadoDoAplicativo.contadorAviso });

export const workerPausa: TratadorDoCanal<'worker:pausa'> = a => { definirPausaGlobal(a.pausado); atualizarBandeja(); return workerDoAplicativo.estado(); };
