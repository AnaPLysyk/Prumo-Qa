/** Diz quais comandos do projeto (capacidades) uma rotina vai executar. */
import { capacidadeDoK6 } from '../k6/capacidadeDoK6.js';
import { Rotina } from '../tipos/rotina.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { obterRunLocal } from '../../testes/banco/obterRunLocal.js';

export function capacidadesDaRotina(r: Rotina, base?: string): string[] {
  if (r.tipo === 'smoke' || r.tipo === 'regressao') return r.capability ? [r.capability] : [];
  if (r.tipo === 'k6') return r.k6 ? [capacidadeDoK6(r.k6)] : [];
  if (r.tipo === 'run-qase') { try { return [...new Set(obterRunLocal(r.runLocalId!, base).casos.map(c => c.capability).filter((c): c is string => !!c))]; } catch { return []; } }
  if (r.tipo === 'validacao-ticket') { const e = obterEspaco(r.espacoId, base); return [...new Set(e.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5); }
  return [];
}
