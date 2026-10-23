/** Controlador da funcionalidade ajuda: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import path from "node:path";
import { lerDocumentosDaAjuda } from "./servicoAjuda.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { versao, arquivoVersoes, textoExclusao } from "../aplicativo/tipos/aplicativo.js";
import { raizDoAplicativo } from "../compartilhado/raizDoAplicativo.js";
import { catalogo } from "../aplicativo/api/catalogoDeContratos.js";
import { apresentarVersoes } from "./servicoAjuda.js";
import { carregarVersoes } from "./servicoAjuda.js";
import { conferirInstalada } from "./servicoAjuda.js";
import { shell } from "electron";
import { perguntarNaJanela } from "../aplicativo/janela/caixaDeConfirmacao.js";
import { excluirTodosContextos } from "../agentes/banco/contextos.js";
import { excluirEvidencias } from "../testes/banco/publicacoes.js";
import { excluirAtividades } from "../logs/regras/iniciarAtividade.js";
import { excluirDiagnostico } from "../logs/banco/diagnostico.js";
import { projetoVinculado, espacoDaRaiz } from "../projetos/servicoProjetos.js";
import { resumirDados } from "./servicoAjuda.js";

export const ajudaDocumentos: TratadorDoCanal<'ajuda:documentos'> = () => lerDocumentosDaAjuda(path.join(raizDoAplicativo, 'docs', 'ajuda'), versao);

export const ajudaIntegracoes: TratadorDoCanal<'ajuda:integracoes'> = () => catalogo();

export const ajudaVersoes: TratadorDoCanal<'ajuda:versoes'> = () => { const v = carregarVersoes(arquivoVersoes); conferirInstalada(v, versao); return { installed: versao, versions: apresentarVersoes(v, versao) }; };

export const dadosExcluir: TratadorDoCanal<'dados:excluir'> = async (a, janela) => {
  const r = await perguntarNaJanela(janela, { type: 'warning', title: 'Confirmar exclusão', buttons: ['Cancelar', 'Excluir'], defaultId: 0, cancelId: 0, noLink: true,
    message: textoExclusao[a.escopo], detail: 'Esta ação não pode ser desfeita. Código-fonte e demais arquivos do projeto não são tocados e o vínculo do projeto é mantido.' });
  if (r.response !== 1) return { canceled: true, deleted: 0, failed: [] };
  if (a.escopo === 'diagnostico') return { canceled: false, ...excluirDiagnostico() };
  let p = await projetoVinculado(a.root);
  if (a.escopo === 'evidencias') {
    const pastaLocal = espacoDaRaiz(p.raiz)?.pastaLocal;
    if (pastaLocal) p = await projetoVinculado(pastaLocal);
  }
  return { canceled: false, ...(a.escopo === 'historico' ? excluirAtividades(p) : a.escopo === 'contextos' ? excluirTodosContextos(p) : await excluirEvidencias(p)) };
};

export const dadosResumo: TratadorDoCanal<'dados:resumo'> = () => resumirDados();

export const siteAbrir: TratadorDoCanal<'site:abrir'> = async (_a, janela) => {
  const url = 'https://prumo-qa-docs.onrender.com/';
  const r = await perguntarNaJanela(janela, { type: 'question', title: 'Prumo QA', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true, message: 'Abrir o site oficial do Prumo QA no navegador?', detail: url });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(url); return { opened: true };
};
