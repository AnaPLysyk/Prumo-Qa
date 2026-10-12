/** Responde sobre um teste escolhido na tela Testes (tipo, arquivo, agente certo). */
import { Coleta, ContextoChat, agentePorTipo } from '../tipos/chat.js';
import { agentesChat } from '../tipos/persona.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';
import { Fonte } from '../../inicio/tipos/assistenteLocal.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { catalogoDeTestes } from '../../testes/regras/catalogoDeTestes.js';

/** Explica um teste aberto na visão de código: só o que a leitura do arquivo mostra (inferência declarada). */
export function responderSobreTeste(ctx: ContextoChat, espacoId: string | null, base?: string): Coleta {
  const fontes: Fonte[] = [{ rotulo: 'Testes', aba: 'testes' }]; const agenteDe = (id: string) => agentesChat.find((a) => a.id === id)!;
  const e = espacoId ? tentarOuPadrao(() => obterEspaco(espacoId, base), null) : null;
  if (!e?.pastaLocal) return { linhas: ['Vincule a pasta do repositório ao projeto para eu ler este teste.'], fontes, fatos: [], agente: agenteDe('qa-geral') };
  const cat = tentarOuPadrao(() => catalogoDeTestes(e.pastaLocal!), null); const f = cat?.features.find((x) => x.arquivo === ctx.arquivo);
  if (!f || !f.testes.length) return { linhas: [`Não encontrei testes reconhecíveis em ${ctx.arquivo}.`], fontes, fatos: [], agente: agenteDe('qa-geral') };
  const antes = f.testes.filter((t) => !ctx.linha || t.linha <= ctx.linha); const t = antes.length ? antes.reduce((a, b) => (b.linha > a.linha ? b : a)) : f.testes[0]!;
  const linhas = [`"${t.titulo}" fica em ${f.arquivo}:${t.linha}, na feature ${f.nome}.`, `Tipo provável: ${t.tipo} (${t.motivo}; confiança ${t.confianca.toLowerCase()}). É inferência pela leitura do código.`,
    t.passos.length ? `Passos que encontrei no código: ${t.passos.slice(0, 6).map((s, i) => `${i + 1}) ${s}`).join(' ')}${t.passos.length > 6 ? ' …' : ''}.` : 'Não encontrei passos nomeados neste teste; leia o corpo no editor.',
    [t.tags.length ? `Tags: ${t.tags.join(', ')}.` : '', t.qase?.length ? `Ligado aos casos do Qase: ${t.qase.join(', ')}.` : 'Nenhum caso do Qase marcado neste teste.'].filter(Boolean).join(' '),
    'Se ele passa hoje, só uma execução real responde: rode pela capability do projeto e confira em Execuções.'];
  return { linhas, fontes, fatos: [`teste=${t.tipo}`, `passos=${t.passos.length}`], agente: agenteDe(agentePorTipo[t.tipo] ?? 'qa-geral') };
}
