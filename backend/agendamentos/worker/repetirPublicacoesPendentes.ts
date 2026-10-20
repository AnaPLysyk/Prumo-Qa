/** Tenta de novo os comentários no Jira que falharam por rede ou serviço (sem duplicar); depois de 3 tentativas, marca como falha. */
import { publicarComentarioDeResultado } from '../../testes/integracoes/publicarComentarioDeResultado.js';
import { publicacaoPodeRepetir } from '../../testes/regras/publicacaoPodeRepetir.js';
import { definirEstadoJiraDoTrabalho } from '../repositorioFila.js';
import { listarTrabalhos } from '../repositorioFila.js';
import { obterTrabalho } from '../repositorioFila.js';
import { EstadoDoWorker } from '../tipos/worker.js';

export async function repetirPublicacoesPendentes(e: EstadoDoWorker) {
  if (!e.d.servicos) return; const agora = e.agora();
  for (const t of listarTrabalhos(e.base)) {
    if (t.jira.estado !== 'PENDENTE' || !t.jira.codigo || !publicacaoPodeRepetir(t.jira.codigo)) continue;
    const fresco = obterTrabalho(t.id, e.base); const terminado = fresco.terminadoEm ? Date.parse(fresco.terminadoEm) : 0; if (agora.getTime() - terminado < 60000) continue;
    const reg = await publicarComentarioDeResultado(t.id, 'AGENDADO', e.d.servicos, e.base, false, agora);
    if (reg.estado === 'FALHA' && reg.tentativas >= 3) definirEstadoJiraDoTrabalho(t.id, { estado: 'FALHA', codigo: reg.erro ?? 'JIRA_PUBLISH_FAILED' }, e.base);
  }
}
