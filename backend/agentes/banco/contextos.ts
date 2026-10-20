/** Cria, lê, valida, remove e grava versões dos contextos e suas permissões de compartilhamento. */
import path from "node:path";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import fs from "node:fs";
import { hashDoConteudoDoContexto, seloDaVersaoDoContexto, idDeContextoValido, ultimaVersaoDoContexto } from "../regras/validacoesDeContexto.js";
import { Arquivo, arquivoSchema, limites, configSchema } from "../tipos/contexto.js";
import { randomUUID } from "node:crypto";

export function pastaContextos(p: Projeto, base?: string): string {
  const dados = diretorioDados(base); const alvo = path.resolve(dados, 'contextos', hash(p.raiz + '\0' + p.manifesto.id));
  const r = path.relative(p.raiz, alvo); if (!r || (!r.startsWith('..') && !path.isAbsolute(r))) throw new ErroQa('CONTEXT_INSIDE_PROJECT', 'Contextos não podem ficar dentro do projeto.');
  semLinks(alvo); return alvo;
}

/** Lê e valida um arquivo; `integro` é falso se o encadeamento ou algum hash não conferir. */
export function lerArquivoDeContexto(dir: string, id: string): { arq: Arquivo; integro: boolean } {
  if (!idDeContextoValido(id)) throw new ErroQa('INVALID_CONTEXT_ID', 'Identificador de contexto inválido.');
  const alvo = path.join(dir, id + '.json'); semLinks(alvo);
  const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1 || st.size > 8 * 1024 * 1024) throw new ErroQa('CONTEXT_FILE_INVALID', 'Arquivo de contexto inválido.');
  const arq = arquivoSchema.parse(JSON.parse(fs.readFileSync(alvo, 'utf8')));
  if (arq.id !== id) throw new ErroQa('CONTEXT_FILE_INVALID', 'Identidade do contexto não confere com o arquivo.');
  let integro = true; let anterior: string | null = null; let versao = 0;
  for (const e of arq.historico) {
    const { selo: s, ...resto } = e;
    if (e.versao !== ++versao || e.anterior !== anterior || e.conteudoHash !== hashDoConteudoDoContexto(e.conteudo) || s !== seloDaVersaoDoContexto(resto)) integro = false;
    anterior = s;
  }
  return { arq, integro };
}

export function gravarArquivoDeContexto(alvo: string, dados: unknown) {
  semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(dados, null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo);
}

/** Um contexto só pertence ao projeto quando o hash do seu identificador corresponde. */
export function carregarContexto(projeto: Projeto, id: string, base?: string) {
  const dir = pastaContextos(projeto, base);
  let resultado: ReturnType<typeof lerArquivoDeContexto>;

  try {
    resultado = lerArquivoDeContexto(dir, id);
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');
    }
    throw erro;
  }

  if (resultado.arq.projectId !== hash(projeto.manifesto.id)) {
    throw new ErroQa('CONTEXT_NOT_FOUND', 'Contexto não encontrado neste projeto.');
  }
  return { dir, ...resultado };
}

/** Lista os contextos íntegros; arquivos inválidos entram em problemas, não no resultado. */
export function carregarTodosOsContextos(projeto: Projeto, base?: string) {
  const dir = pastaContextos(projeto, base);
  const itens: { arq: Arquivo; integro: boolean }[] = [];
  const problemas: { id: string; code: string }[] = [];

  let nomes: string[] = [];
  try {
    nomes = fs.readdirSync(dir).filter(nome => /^[0-9a-f-]{36}\.json$/.test(nome));
  } catch (erro) {
    if ((erro as NodeJS.ErrnoException).code !== 'ENOENT') throw erro;
  }

  if (nomes.length > limites.contextos) {
    throw new ErroQa('CONTEXT_LIMIT', 'Mais de ' + limites.contextos + ' contextos no projeto.');
  }

  for (const nome of nomes) {
    const id = nome.slice(0, -5);
    try {
      const resultado = lerArquivoDeContexto(dir, id);
      if (resultado.arq.projectId !== hash(projeto.manifesto.id)) {
        throw new Error('outro projeto');
      }
      itens.push(resultado);
    } catch {
      problemas.push({ id, code: 'CONTEXT_FILE_INVALID' });
    }
  }

  return { dir, itens, problemas };
}

/** Elimina o conteúdo e mantém somente identificador, data, hash e versão no registro. */
export function excluirContexto(projeto: Projeto, id: string, base?: string) {
  const { dir, arq } = carregarContexto(projeto, id, base);
  const ultima = ultimaVersaoDoContexto(arq);

  fs.appendFileSync(
    path.join(dir, 'excluidos.jsonl'),
    JSON.stringify({
      id,
      em: new Date().toISOString(),
      ultimoHash: ultima.conteudoHash,
      versao: ultima.versao
    }) + '\n',
    { mode: 0o600 }
  );
  fs.unlinkSync(path.join(dir, id + '.json'));
  return { deleted: true };
}

/** Exclui cada arquivo de contexto e informa os que não puderam ser removidos. */
export function excluirTodosContextos(projeto: Projeto, base?: string) {
  const dir = pastaContextos(projeto, base);
  let deleted = 0;
  const failed: { file: string; code: string }[] = [];
  let nomes: string[] = [];

  try {
    nomes = fs.readdirSync(dir).filter(nome => /^[0-9a-f-]{36}\.json$/.test(nome));
  } catch {
    return { deleted: 0, failed };
  }

  for (const nome of nomes) {
    try {
      const info = fs.lstatSync(path.join(dir, nome));
      if (!info.isFile() || info.nlink !== 1) {
        throw Object.assign(new Error('x'), { code: 'FILE_INVALID' });
      }
      fs.unlinkSync(path.join(dir, nome));
      deleted++;
    } catch (erro) {
      failed.push({ file: nome, code: (erro as NodeJS.ErrnoException).code ?? 'UNKNOWN' });
    }
  }

  return { deleted, failed };
}

/** Sem autorização válida, contextos não podem ser disponibilizados. */
export function lerPermissaoDeContextosNoMcp(
  projeto: Projeto,
  base?: string
): { disponibilizarAoMcp: boolean } {
  try {
    const arquivo = path.join(pastaContextos(projeto, base), 'config.json');
    semLinks(arquivo);
    const configuracao = configSchema.parse(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
    return { disponibilizarAoMcp: configuracao.disponibilizarAoMcp };
  } catch {
    return { disponibilizarAoMcp: false };
  }
}

/** Registra somente a decisão explícita da pessoa, com a versão do contrato. */
export function gravarPermissaoDeContextosNoMcp(
  projeto: Projeto,
  disponibilizarAoMcp: boolean,
  base?: string
) {
  const arquivo = path.join(pastaContextos(projeto, base), 'config.json');
  gravarArquivoDeContexto(arquivo, { version: 1, disponibilizarAoMcp });
  return { disponibilizarAoMcp };
}
