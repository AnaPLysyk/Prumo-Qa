/** Liga ou desliga a delegação de IA após aprovação nativa da pessoa. */
import { lerPreferencias, gravar } from '../configuracoes/armazenarPreferencias.js';

/** Autoriza ou revoga a delegação do chat ao Claude Code/Codex. Chamado só após confirmação nativa da pessoa. */
export function autorizarDelegacao(provedor: 'claude' | 'codex', valor: boolean, base?: string) { const p = lerPreferencias(base); return gravar({ ...p, ia: { ...p.ia, delegacao: { ...p.ia.delegacao, [provedor]: valor } } }, base); }
