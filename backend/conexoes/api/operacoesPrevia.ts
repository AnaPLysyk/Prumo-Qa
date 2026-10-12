/** Canal operacoes:previa: Mostrar o resumo, o efeito e a chave de idempotência de uma operação externa antes de executá-la. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { prepararOperacao } from '../escrita/prepararOperacao.js';

export const operacoesPrevia: TratadorDoCanal<'operacoes:previa'> = a => prepararOperacao(a.espacoId, a.operacao, a.parametros);
