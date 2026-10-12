/** Canal escrita:estado: Ver em quais serviços a escrita está habilitada no projeto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { catalogoOperacoes } from '../escrita/catalogoOperacoes.js';
import { permissoesDoEspaco } from '../escrita/permissoesDoEspaco.js';

export const escritaEstado: TratadorDoCanal<'escrita:estado'> = a => ({ servicos: permissoesDoEspaco(a.espacoId), operacoes: catalogoOperacoes.map(o => ({ id: o.id, servico: o.servico, rotulo: o.rotulo, efeito: o.efeito })) });
