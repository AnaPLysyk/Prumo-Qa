/** Guarda o registro de uma orquestração (só metadados) em orquestracoes.jsonl na pasta de dados, mantendo os 500 mais recentes. */
import fs from 'node:fs';
import path from 'node:path';
import { Orquestracao, limitesOrquestracao } from '../tipos/orquestracao.js';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { falharCom } from '../../compartilhado/erros/falharCom.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';

/** Onde ficam os registros: um arquivo por computador, com o projeto em cada linha. */
export const arquivoDeOrquestracoes = (base?: string) => path.join(diretorioDados(base), 'orquestracoes.jsonl');

export function registrarOrquestracao(r: Orquestracao, base?: string): void {
  const alvo = arquivoDeOrquestracoes(base); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 }); semLinks(alvo);
  if (fs.existsSync(alvo) && (!fs.lstatSync(alvo).isFile() || fs.lstatSync(alvo).nlink !== 1)) falharCom('ORCHESTRATION_FILE_INVALID');
  fs.appendFileSync(alvo, JSON.stringify(r) + '\n', { mode: 0o600 });
  const linhas = fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean);
  if (linhas.length > limitesOrquestracao.registros) fs.writeFileSync(alvo, linhas.slice(-limitesOrquestracao.registros).join('\n') + '\n', { mode: 0o600 });
}
