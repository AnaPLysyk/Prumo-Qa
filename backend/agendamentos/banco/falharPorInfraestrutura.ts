/** Registra falha de infraestrutura; tenta de novo mais tarde, com espera crescente, quando ainda há tentativas. */
import { fecharTentativa } from './fecharTentativa.js';
import { mudarTrabalho } from './mudarTrabalho.js';
import { ESPERA_BASE_MS, resultadoSchema } from '../tipos/fila.js';

/**
 * Falha de INFRAESTRUTURA (rede, serviço indisponível, runner ausente): retenta com espera crescente até o limite.
 * Falha de teste NÃO passa por aqui: é um resultado (FAIL), registrado em `concluir`, e não se repete.
 */
export const falharPorInfraestrutura = (id: string, codigo: string, motivo: string, retentavel: boolean, base?: string, agora = new Date()) => mudarTrabalho(id, t => {
  const iso = agora.toISOString(); fecharTentativa(t, 'ERRO', iso, codigo); t.heartbeat = null;
  if (retentavel && t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = codigo; t.disponivelEm = new Date(agora.getTime() + ESPERA_BASE_MS * 2 ** (t.tentativas - 1)).toISOString(); return; }
  t.estado = 'ERRO'; t.erro = codigo; t.terminadoEm = iso; t.resultado = resultadoSchema.parse({ status: 'ERRO_INFRA', motivo: motivo.slice(0, 600) });
}, base);
