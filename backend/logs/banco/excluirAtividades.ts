/** Apaga o diário de operações do projeto (Ajuda › Privacidade e dados), informando falhas. */
import fs from 'node:fs';
import path from 'node:path';
import { falharCom } from '../../compartilhado/erros.js';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { arquivosDoDiario } from './arquivosDoDiario.js';
import { pastaAtividades } from './pastaAtividades.js';

/**
 * Exclusão controlada do histórico operacional de um projeto (nunca código nem evidências).
 * Só apaga arquivos <uuid>.jsonl regulares, um a um, sem links; falhas parciais (arquivo em uso, permissão) são devolvidas.
 */
export function excluirAtividades(p:Projeto,base?:string) {
  const pasta=pastaAtividades(p,base);const falhas:{file:string;code:string}[]=[];let apagados=0;
  for(const nome of arquivosDoDiario(pasta)) {
    const alvo=path.join(pasta,nome);
    try { semLinks(alvo);const st=fs.lstatSync(alvo);if(!st.isFile()||st.nlink!==1)falharCom('HISTORY_FILE_INVALID');fs.unlinkSync(alvo);apagados++; }
    catch(e) { falhas.push({file:nome,code:(e as NodeJS.ErrnoException).code??(e as Error).message.slice(0,40)}); }
  }
  try { fs.rmdirSync(pasta); } catch { /* restam arquivos ou a pasta não existe */ }
  return {deleted:apagados,failed:falhas};
}
