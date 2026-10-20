/** Guarda a configuração geral dos agentes da plataforma, com validação antes de gravar. */
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import {
  AgentesDaPlataforma,
  agentesDaPlataformaPadrao,
  agentesDaPlataformaSchema
} from '../tipos/agentesDaPlataforma.js';

export const lerAgentesDaPlataforma = (base?: string): AgentesDaPlataforma =>
  lerLocal<AgentesDaPlataforma>(
    'agentes-plataforma.json',
    agentesDaPlataformaSchema,
    structuredClone(agentesDaPlataformaPadrao),
    base
  );

export function gravarAgentesDaPlataforma(
  configuracao: AgentesDaPlataforma,
  base?: string
): AgentesDaPlataforma {
  const validada = agentesDaPlataformaSchema.parse(configuracao);
  gravarLocal('agentes-plataforma.json', validada, base);
  return validada;
}
