/** Monta o que a tela recebe de uma consulta: dados limpos, próxima página, origem, data, endpoint e o aviso de que é informação externa. */
import { Recurso } from '../../projetos/tipos/espacos.js';
import { ConfigServico } from '../tipos/adaptador.js';
import { limparRespostaDoServico } from './limparRespostaDoServico.js';

export function saidaDaConsulta(c: ConfigServico, dados: unknown, proxima: string | number | null | undefined, r: Recurso, endpoint: string) {
  return {
    dados: Array.isArray(dados) && endpoint === '/rest/api/3/field' ? dados.map(x => limparRespostaDoServico(c, x)) : limparRespostaDoServico(c, dados),
    proxima: proxima ?? null, servico: c.servico, origem: c.instancia, recursoId: r.id, consultadoEm: new Date().toISOString(), cache: false, endpoint: endpoint.split('?')[0], metodo: 'GET',
    limitesExibicao: 'Detalhes: textos até 20000 caracteres, listas internas até 100 itens e objetos até 80 campos; chaves sensíveis removidas. A resposta integral não é armazenada.',
    interpretacao: 'Informação externa consultada; não é requisito aprovado nem cobertura verificada.'
  };
}
