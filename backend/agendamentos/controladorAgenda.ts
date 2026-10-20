/** Controlador da funcionalidade agendamentos: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { autorizarRotina } from "./autorizacoes/autorizarRotina.js";
import { obterRotina } from "./repositorioAgenda.js";
import { permissoesDaRotina } from "./regras/permissoes.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { textoNoIdioma } from "../aplicativo/bandeja/textoNoIdioma.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { solicitarAprovacao } from "../testes/servicoAprovacao.js";
import { desativarRotina, pausarRotina, retomarRotina, excluirRotina } from "./regras/operacoesDaRotina.js";
import { workerDoAplicativo } from "./worker/workerDoAplicativo.js";
import { listarAgenda } from "./regras/listarAgenda.js";
import { listarPermissoes } from "./regras/permissoes.js";
import { criarPoliticaPublicacao } from "./autorizacoes/politicas.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { obterEspaco } from "../projetos/repositorio.js";
import { revogarAutorizacao } from "./autorizacoes/revogarAutorizacao.js";
import { criarRotina } from "./regras/criarRotina.js";
import { editarRotina } from "./regras/editarRotina.js";
import { validarRotina } from "./regras/validarRotina.js";

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
