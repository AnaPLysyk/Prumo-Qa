/** Canal testes:arquivo: Ler o conteúdo de um arquivo de teste listado pelo catálogo, para a IDE (só é editável se não tiver segredo mascarado). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { arquivoDeTeste } from '../regras/arquivoDeTeste.js';

export const testesArquivo: TratadorDoCanal<'testes:arquivo'> = a => { const e = obterEspaco(a.espacoId); if (!e.pastaLocal) throw new Error('PASTA_AUSENTE'); const r = arquivoDeTeste(e.pastaLocal, a.arquivo); const conteudo = mascarar(r.conteudo); return { ...r, conteudo, hash: hash(r.conteudo), editavel: conteudo === r.conteudo }; };
