/** Cria o diretório protegido e lê ou grava versões íntegras dos contextos, fora do projeto. */
import path from "node:path";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { hash } from "../../compartilhado/seguranca/hash.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import fs from "node:fs";
import { hashDoConteudoDoContexto, seloDaVersaoDoContexto } from "../regras/validacoesDeContexto.js";
import { idDeContextoValido } from "../regras/validacoesDeContexto.js";
import { Arquivo, arquivoSchema } from "../tipos/contexto.js";
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
