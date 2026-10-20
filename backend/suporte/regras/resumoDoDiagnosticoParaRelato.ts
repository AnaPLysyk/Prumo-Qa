/** Resume os 20 últimos registros do diagnóstico da janela para anexar ao relato, se a pessoa marcar. */
import { lerDiagnostico } from '../../logs/banco/lerDiagnostico.js';

export const resumoDoDiagnosticoParaRelato = () => lerDiagnostico(undefined, 20).events.map(e => `${e.at} ${e.channel} ${e.state}${e.code ? ' ' + e.code : ''} ${e.durationMs}ms`).join('\n');
