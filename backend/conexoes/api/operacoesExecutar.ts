/** Canal operacoes:executar: Executar uma operação externa do catálogo (criar ticket/caso/plano/run, anexar, editar, mudar status, vincular, branch, commit de teste, PR). */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { nomeServico } from '../../aplicativo/tipos/aplicativo.js';
import { executarOperacao } from '../escrita/executarOperacao.js';
import { prepararOperacao } from '../escrita/prepararOperacao.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { resolverAnexo } from '../../tickets/regras/resolverAnexo.js';

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
