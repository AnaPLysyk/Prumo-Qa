/** Encontra trabalhos que ficaram "executando" sem batimento (o aplicativo caiu) e os devolve à fila ou encerra. */
import { fecharTentativa } from './fecharTentativa.js';
import { gravarFila } from './gravarFila.js';
import { lerFila } from './lerFila.js';

/** Início do worker: trabalho EXECUTANDO sem batimento recente foi interrompido (fechamento, queda, suspensão). Nunca vira PASS. */
export function recuperarInterrompidos(base?: string, agora = new Date(), limiteMs = 120000) {
  const r = lerFila(base); let n = 0; const iso = agora.toISOString();
  for (const t of r.trabalhos) {
    if (t.estado !== 'EXECUTANDO') continue; if (t.heartbeat && agora.getTime() - Date.parse(t.heartbeat) < limiteMs) continue;
    fecharTentativa(t, 'INTERROMPIDA', iso, 'INTERRUPTED'); t.heartbeat = null; n++;
    if (t.tentativas < t.maxTentativas) { t.estado = 'PENDENTE'; t.erro = 'INTERRUPTED'; t.disponivelEm = iso; }
    else { t.estado = 'ERRO'; t.erro = 'INTERRUPTED'; t.terminadoEm = iso; t.resultado = { status: 'ERRO_INFRA', motivo: 'Execução interrompida (aplicativo fechado, queda ou suspensão) e sem tentativas restantes.' }; }
  }
  if (n) gravarFila(r, base); return n;
}
