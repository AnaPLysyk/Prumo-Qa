/** Lê o arquivo de um contexto e confere se o histórico está íntegro (nenhuma versão alterada fora do Prumo). */
import fs from 'node:fs';
import path from 'node:path';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { hashDoConteudoDoContexto } from '../regras/versoesDoContexto.js';
import { idDeContextoValido } from '../regras/idDeContextoValido.js';
import { seloDaVersaoDoContexto } from '../regras/versoesDoContexto.js';
import { Arquivo, arquivoSchema } from '../tipos/contexto.js';

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
