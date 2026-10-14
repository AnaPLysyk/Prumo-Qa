/** Grava a configuração geral dos agentes da plataforma conferindo o formato antes. */
import { AgentesDaPlataforma, agentesDaPlataformaSchema } from '../tipos/agentesDaPlataforma.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';

export function gravarAgentesDaPlataforma(c: AgentesDaPlataforma, b?: string): AgentesDaPlataforma {
  const valido = agentesDaPlataformaSchema.parse(c); gravarLocal('agentes-plataforma.json', valido, b); return valido;
}
