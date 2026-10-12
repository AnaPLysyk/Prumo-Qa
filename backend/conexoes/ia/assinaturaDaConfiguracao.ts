/** Impressão digital da configuração proposta, para saber se o teste foi com a mesma configuração. */
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Plano } from '../tipos/integracaoIa.js';

export function assinaturaDaConfiguracao(plano: Plano) { return hash(JSON.stringify(plano.configuration)); }
