/** Persistência da autorização para disponibilizar contextos aos agentes via MCP. */
import fs from 'node:fs';
import path from 'node:path';
import { semLinks } from '../../compartilhado/seguranca/semLinks.js';
import { Projeto } from '../../compartilhado/projeto/contratos.js';
import { pastaContextos, gravarArquivoDeContexto } from './arquivosDeContexto.js';
import { configSchema } from '../tipos/contexto.js';

/** Sem autorização válida, contextos não podem ser disponibilizados. */
export function lerPermissaoDeContextosNoMcp(
  projeto: Projeto,
  base?: string
): { disponibilizarAoMcp: boolean } {
  try {
    const arquivo = path.join(pastaContextos(projeto, base), 'config.json');
    semLinks(arquivo);
    const configuracao = configSchema.parse(JSON.parse(fs.readFileSync(arquivo, 'utf8')));
    return { disponibilizarAoMcp: configuracao.disponibilizarAoMcp };
  } catch {
    return { disponibilizarAoMcp: false };
  }
}

/** Registra somente a decisão explícita da pessoa, com a versão do contrato. */
export function gravarPermissaoDeContextosNoMcp(
  projeto: Projeto,
  disponibilizarAoMcp: boolean,
  base?: string
) {
  const arquivo = path.join(pastaContextos(projeto, base), 'config.json');
  gravarArquivoDeContexto(arquivo, { version: 1, disponibilizarAoMcp });
  return { disponibilizarAoMcp };
}
