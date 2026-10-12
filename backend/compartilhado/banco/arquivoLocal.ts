/** Devolve o caminho de um arquivo de dados do Prumo na pasta do usuário (LOCALAPPDATA\PrumoQA\plataforma), recusando nomes estranhos. */
import path from 'node:path';
import { diretorioDados } from './diretorioDados.js';
import { semLinks } from '../seguranca/semLinks.js';

/** Arquivos próprios do aplicativo: nomes internos, limites e gravação atômica. */
export function arquivoLocal(nome:string,base?:string) {
  if(!/^[a-z0-9-]+\.(json|bin)$/.test(nome))throw new Error('LOCAL_FILE_INVALID');
  const alvo=path.join(diretorioDados(base),'plataforma',nome);semLinks(alvo);return alvo;
}
