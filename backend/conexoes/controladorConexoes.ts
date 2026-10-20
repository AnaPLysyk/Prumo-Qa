/** Controlador da funcionalidade conexoes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { dialog } from "electron";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { aplicarConexao } from "./ia/aplicarConexao.js";
import { prepararConexao } from "./ia/prepararConexao.js";
import { projetoVinculado } from "../projetos/servicoProjetos.js";
import { testarIntegracao } from "./servicoIaDiagnostico.js";
import { catalogoOperacoes } from "./escrita/catalogoOperacoes.js";
import { permissoesDoEspaco } from "./escrita/permissoesDoEspaco.js";
import { textoNoIdioma } from "../aplicativo/bandeja/textoNoIdioma.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { nomeServico } from "../aplicativo/tipos/aplicativo.js";
import { habilitarEscrita } from "./escrita/habilitarEscrita.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { executarOperacao } from "./escrita/executarOperacao.js";
import { prepararOperacao } from "./escrita/prepararOperacao.js";
import { servicosDoAplicativo } from "./regras/servicosDoAplicativo.js";
import { obterEspaco } from "../projetos/repositorio.js";
import { resolverAnexo } from "../tickets/servicoPropostas.js";
import { listarOperacoes } from "./repositorioOperacoes.js";
import { situacaoDasConexoesDeIa } from "./ia/situacaoDasConexoesDeIa.js";

// Alterar configuração de outro programa exige uma caixa de confirmação nativa, que a página não consegue simular.
export const conexaoAplicar: TratadorDoCanal<'conexao:aplicar'> = async (a, janela) => {
  const p = await projetoVinculado(a.root);
  const plano = prepararConexao(p, a.client);
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar conexão', buttons: ['Cancelar', 'Adicionar configuração'], defaultId: 0, cancelId: 0, noLink: true,
    message: `Adicionar o servidor MCP "${plano.name}" ao ${a.client}?`,
    detail: `Destino: ${plano.destination}\n\nComando:\n${plano.command}\n\nConfigurações existentes com o mesmo nome não são sobrescritas. Isto não comprova uma sessão ativa.` });
  if (r.response !== 1) return { configured: false, reason: 'Cancelado; nenhuma alteração.' };
  return aplicarConexao(plano, plano.confirmation);
};

export const conexaoTestar: TratadorDoCanal<'conexao:testar'> = a => testarIntegracao(a.root,a.client);

export const escritaEstado: TratadorDoCanal<'escrita:estado'> = a => ({ servicos: permissoesDoEspaco(a.espacoId), operacoes: catalogoOperacoes.map(o => ({ id: o.id, servico: o.servico, rotulo: o.rotulo, efeito: o.efeito })) });

export const escritaHabilitar: TratadorDoCanal<'escrita:habilitar'> = async (a, j) => {
  const i = idiomaAtual();
  if (a.habilitada && !(await confirmarNoWindows(j, textoNoIdioma('habTitulo', i), textoNoIdioma('habMsg', i, { s: nomeServico[a.servico] }), textoNoIdioma('habDet', i), textoNoIdioma('habBtn', i)))) return { canceled: true };
  return { canceled: false, ...habilitarEscrita(a.espacoId, a.servico, a.habilitada, usuarioDoWindows()) };
};

export const operacoesExecutar: TratadorDoCanal<'operacoes:executar'> = async (a, j) => {
  const i = idiomaAtual(); const parametros = { ...a.parametros } as Record<string, unknown>; delete parametros.arquivo; let aux; // o caminho nunca vem da página
  if (a.anexo && (a.operacao === 'jira.anexar' || a.operacao === 'qase.anexar')) {
    let escolhido: string | null = null;
    if (a.anexo.tipo === 'arquivo') { const r = await dialog.showOpenDialog(j!, { title: textoNoIdioma('arquivoTitulo', i), properties: ['openFile'] }); if (r.canceled || !r.filePaths[0]) return { canceled: true }; escolhido = r.filePaths[0]; }
    const res = resolverAnexo(a.espacoId, a.anexo, escolhido); parametros.arquivo = res.arquivo; aux = res.aux;
  }
  const prev = prepararOperacao(a.espacoId, a.operacao, parametros); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('opTitulo', i), textoNoIdioma('opMsg', i, { s: nomeServico[prev.servico], r: prev.rotulo }), textoNoIdioma('opDet', i, { x: prev.resumo + '\n\n' + prev.efeito, p: e.nome }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await executarOperacao(servicosDoAplicativo, a.espacoId, a.operacao, parametros, { confirmado: true, aux })) };
};

export const operacoesListar: TratadorDoCanal<'operacoes:listar'> = a => listarOperacoes(a.espacoId, a.limite ?? 100);

export const projetoConexoes: TratadorDoCanal<'projeto:conexoes'> = a => situacaoDasConexoesDeIa(a.root);
