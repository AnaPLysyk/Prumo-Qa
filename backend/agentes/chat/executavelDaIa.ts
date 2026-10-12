/** Caminho do .exe do Claude ou do Codex, se instalado (atalhos .cmd não são usados). */
import { localizarClienteDeIa } from '../../conexoes/ia/localizarClienteDeIa.js';

// Chat orquestrado. IA externa: só CLI .exe encontrado (atalhos .cmd exigiriam shell), sem shell, ambiente mínimo e tempo limite.
export const executavelDaIa = (p: 'claude' | 'codex') => { const l = localizarClienteDeIa(p); return l && !l.shim ? l.executable : null; };
