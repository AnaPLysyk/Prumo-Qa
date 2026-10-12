/** Resume os 20 últimos registros do diagnóstico da janela para anexar ao relato, se a pessoa marcar. */
import { lerDiagnostico } from '../../logs/banco/lerDiagnostico.js';

// ---- Suporte (2.5). Nada é enviado sem revisão e confirmação NATIVA; a URL é reconstruída aqui, nunca recebida da página. Logs nunca são anexados sem marcação. ----
export const resumoDoDiagnosticoParaRelato = () => lerDiagnostico(undefined, 20).events.map(e => `${e.at} ${e.channel} ${e.state}${e.code ? ' ' + e.code : ''} ${e.durationMs}ms`).join('\n');
