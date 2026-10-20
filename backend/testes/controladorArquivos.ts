/** Controlador da funcionalidade testes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { hash } from "../compartilhado/seguranca/hash.js";
import { mascarar } from "../compartilhado/seguranca/mascarar.js";
import { obterEspaco } from "../projetos/banco/obterEspaco.js";
import { arquivoDeTeste } from "./regras/arquivoDeTeste.js";
import { catalogoDeTestes } from "./regras/catalogoDeTestes.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { escreverArquivoDeTeste } from "./regras/escreverArquivoDeTeste.js";
import { pareceArquivoDePipeline } from "./regras/identificarArquivosDeTeste.js";
import { listarPipelines } from "./regras/listarPipelines.js";

export const testesArquivo: TratadorDoCanal<'testes:arquivo'> = a => { const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE'); const r = arquivoDeTeste(e.pastaLocal, a.arquivo); const conteudo = mascarar(r.conteudo); return { ...r, conteudo, hash: hash(r.conteudo), editavel: conteudo === r.conteudo }; };

export const testesCatalogo: TratadorDoCanal<'testes:catalogo'> = a => { const e = obterEspaco(a.espacoId); return e.pastaLocal ? { semPasta: false, catalogo: catalogoDeTestes(e.pastaLocal) } : { semPasta: true, catalogo: null }; };

export const testesGravar: TratadorDoCanal<'testes:gravar'> = async (a, j) => {
  const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE');
  const linhas = a.conteudo.split(/\r?\n/).length;
  const pipeline = pareceArquivoDePipeline(a.arquivo.replaceAll('\\', '/'));
  const detalhe = `Pasta: ${e.pastaLocal}\nArquivo: ${a.arquivo}\n${a.hashBase === null ? `Arquivo novo com ${linhas} linha(s).` : `O conteúdo atual será substituído por ${linhas} linha(s).`}\n${pipeline ? 'Este arquivo define um pipeline de CI/CD: só passa a valer no GitHub depois que você enviar o repositório.' : 'O Prumo só grava arquivos de teste dentro desta pasta.'} Nada é executado nem enviado.`;
  if (!await confirmarNoWindows(j, pipeline ? (a.hashBase === null ? 'Criar pipeline' : 'Salvar pipeline') : a.hashBase === null ? 'Criar arquivo de teste' : 'Salvar arquivo de teste', `Gravar ${a.arquivo} na pasta do projeto ${e.nome}?`, detalhe, 'Salvar')) return { canceled: true };
  return escreverArquivoDeTeste(e.pastaLocal, a.arquivo, a.conteudo, a.hashBase);
};

export const testesPipelines: TratadorDoCanal<'testes:pipelines'> = (a) => { const e = obterEspaco(a.espacoId); return { pastaVinculada: !!e.pastaLocal, pipelines: e.pastaLocal ? listarPipelines(e.pastaLocal) : [] }; };
