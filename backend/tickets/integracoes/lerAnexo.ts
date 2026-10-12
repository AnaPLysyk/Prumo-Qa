/** Lê o arquivo a anexar só se for evidência do projeto ou escolhido pela pessoa; textos têm segredos mascarados. */
import fs from 'node:fs';
import path from 'node:path';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { Auxiliar } from '../../conexoes/tipos/operacao.js';
import { tipos } from '../tipos/escritaJira.js';

/** Lê um arquivo para anexar: só dentro das pastas de evidência do projeto ou de um caminho que a pessoa escolheu no diálogo nativo. */
export function lerAnexo(caminho: string, aux: Auxiliar, limite = 10 * 1024 * 1024) {
  const real = fs.realpathSync(path.resolve(caminho)); const dentro = aux.raizesDeEvidencia.some(r => { try { const rr = fs.realpathSync(r); return real === rr || real.startsWith(rr + path.sep); } catch { return false; } });
  const escolhido = aux.arquivosAutorizados.some(a => { try { return fs.realpathSync(a) === real; } catch { return false; } });
  if (!dentro && !escolhido) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const st = fs.lstatSync(real); if (!st.isFile() || st.nlink !== 1 || st.size === 0 || st.size > limite) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const ext = path.extname(real).toLowerCase(); const tipo = tipos[ext]; if (!tipo || /\.(env|pem|key|pfx|p12)$/i.test(real)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  let dados = fs.readFileSync(real); if (['.txt', '.log', '.json', '.html'].includes(ext)) dados = Buffer.from(mascarar(dados.toString('utf8')), 'utf8');
  return { nome: path.basename(real), tipo, dados, tamanho: dados.length };
}
