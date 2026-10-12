/** Canal testes:catalogo: Ler os arquivos de teste da pasta do projeto, agrupar por feature e classificar cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { catalogoDeTestes } from '../regras/catalogoDeTestes.js';

export const testesCatalogo: TratadorDoCanal<'testes:catalogo'> = a => { const e = obterEspaco(a.espacoId); return e.pastaLocal ? { semPasta: false, catalogo: catalogoDeTestes(e.pastaLocal) } : { semPasta: true, catalogo: null }; };
