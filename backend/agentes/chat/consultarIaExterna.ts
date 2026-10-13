/** Usa Claude ou Codex somente após autorização; retorna ao chat local quando faltar permissão ou a IA falhar. */
import { conhecimentosRelevantes } from '../banco/conhecimentosRelevantes.js';
import { argumentosDoProvedorDeIa } from './argumentosDoProvedorDeIa.js';
import { montarPrompt } from './montarPrompt.js';
import { registrarSugestoesDaIa } from './registrarSugestoesDaIa.js';
import { separarAprendizados } from './separarAprendizados.js';
import { ContextoDelegacao } from '../tipos/ContextoDelegacao.js';
import { Resposta } from '../tipos/chat.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

export async function consultarIaExterna({ o, agente, pergunta, local, estilo, nome, perfil, historico, comum, provedor, montar, vestido }: ContextoDelegacao): Promise<Resposta> {
  // 3) IA externa: só com autorização registrada e executável encontrado; qualquer falha volta para a resposta local.
  const nomeP = provedor === 'claude' ? 'Claude Code' : 'Codex';
  const voltar = (aviso: string) => montar(agente, { ...local, linhas: vestido() }, 'LOCAL', { ...comum, aviso });
  if (!o.autorizados?.[provedor]) return voltar(`Delegação ao ${nomeP} não autorizada; resposta local.`);
  const exe = o.executavel?.(provedor); if (!exe || !o.executor) return voltar(`${nomeP} não encontrado neste computador; resposta local.`);
  let cwd: string | undefined; if (o.espacoId) { try { cwd = obterEspaco(o.espacoId, o.base).pastaLocal ?? undefined; } catch { cwd = undefined; } }
  const conhecimentos = tentarOuPadrao(() => conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, pergunta, 5, o.base), [] as Conhecimento[]).map((c) => ({ titulo: c.titulo, texto: c.texto }));
  try {
    const x = await o.executor(exe, argumentosDoProvedorDeIa(provedor, montarPrompt(agente, pergunta, local, estilo, nome, { perfil, historico, conhecimentos, base: o.base })), { timeoutMs: 120000, cwd });
    const { texto: limpo, aprendizados } = separarAprendizados(mascarar(x.saida)); const texto = limpo.trim().slice(0, 6000);
    if (x.codigo !== 0 || !texto) return voltar(`${nomeP} não respondeu (código ${x.codigo ?? 'tempo esgotado'}); resposta local.`);
    const { acoes, sugeridos, naoRegistrados } = registrarSugestoesDaIa(o, agente, provedor, aprendizados);
    const linhas = texto.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean).slice(0, 12);
    if (sugeridos) linhas.push(`${nomeP} sugeriu ${sugeridos} aprendizado(s); ficam como rascunho até você decidir.`);
    return montar(agente, { ...local, linhas }, provedor === 'claude' ? 'CLAUDE' : 'CODEX', { ...comum, acoes, ...(naoRegistrados ? { aviso: `${naoRegistrados} aprendizado(s) não foram registrados (limite ou armazenamento indisponível). A resposta da IA foi preservada.` } : {}) });
  } catch { return voltar('Falha ao chamar a IA externa; resposta local.'); }
}
