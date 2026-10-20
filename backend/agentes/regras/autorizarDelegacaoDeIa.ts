/** Autoriza ou revoga o chat de enviar perguntas ao Claude Code ou ao Codex. */
import { gravarPreferencias } from '../../configuracoes/repositorio.js';
import { lerPreferencias } from '../../configuracoes/repositorio.js';

/** Autoriza ou revoga a delegação do chat ao Claude Code/Codex. Chamado só após confirmação nativa da pessoa. */
export function autorizarDelegacaoDeIa(provedor: 'claude' | 'codex', valor: boolean, base?: string) { const p = lerPreferencias(base); return gravarPreferencias({ ...p, ia: { ...p.ia, delegacao: { ...p.ia.delegacao, [provedor]: valor } } }, base); }
