/** Baixa o instalador e o .sha256 da release oficial e confere o SHA-256 antes de aceitar. */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { analisarVersao } from '../../ajuda/versoes/analisarVersao.js';
import { baixarComRedirecionamentoSeguro } from './baixarComRedirecionamentoSeguro.js';
import { enderecoDoInstalador } from './enderecoDoInstalador.js';
import { nomeDoInstalador } from './nomeDoInstalador.js';
import { LIMITE_INSTALADOR, Opcoes } from '../tipos/instalador.js';

/** Baixa e confere. Devolve o caminho do instalador verificado; em qualquer falha apaga o que baixou. */
export async function baixarAtualizacao(versao: string, o: Opcoes = {}): Promise<{ arquivo: string; sha256: string; bytes: number }> {
  if (!analisarVersao(versao) || versao !== versao.trim().replace(/^v/, '')) throw new Error('INVALID_VERSION: versão inválida.');
  const base = o.base && o.permitirLocal ? o.base.replace(/\/$/, '') : null;
  const url = base ? `${base}/${nomeDoInstalador(versao)}` : enderecoDoInstalador(versao);
  const textoHash = await (await baixarComRedirecionamentoSeguro(url + '.sha256', o)).text();
  const esperado = new RegExp(`^([0-9a-f]{64})\\s+\\*?${nomeDoInstalador(versao).replace(/\./g, '\\.')}\\s*$`, 'i').exec(textoHash.trim())?.[1]?.toLowerCase();
  if (!esperado) throw new Error('UPDATE_HASH_MISSING: a release não publicou um SHA-256 válido para o instalador. Nada foi baixado nem instalado.');
  const pasta = fs.mkdtempSync(path.join(o.pasta ?? os.tmpdir(), 'prumo-atualizacao-'));
  const arquivo = path.join(pasta, nomeDoInstalador(versao));
  try {
    const r = await baixarComRedirecionamentoSeguro(url, o); if (!r.body) throw new Error('UPDATE_DOWNLOAD_FAILED: resposta sem conteúdo. Nada foi instalado.');
    const resumo = createHash('sha256'); let bytes = 0;
    const origem = Readable.from(r.body as unknown as AsyncIterable<Uint8Array>);
    async function* conferirPartes() {
      for await (const parte of origem) {
        bytes += parte.byteLength;
        if (bytes > LIMITE_INSTALADOR) throw new Error('UPDATE_DOWNLOAD_FAILED: instalador maior que o limite. Nada foi instalado.');
        resumo.update(parte);
        yield parte;
      }
    }
    await pipeline(Readable.from(conferirPartes()), fs.createWriteStream(arquivo, { flags: 'wx', mode: 0o700 }));
    const obtido = resumo.digest('hex');
    if (obtido !== esperado) throw new Error(`UPDATE_HASH_MISMATCH: o SHA-256 do instalador baixado (${obtido.slice(0, 12)}…) não confere com o publicado (${esperado.slice(0, 12)}…). O arquivo foi apagado e nada foi instalado.`);
    return { arquivo, sha256: obtido, bytes };
  } catch (e) { fs.rmSync(pasta, { recursive: true, force: true }); throw e; }
}
