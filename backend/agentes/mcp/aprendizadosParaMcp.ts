/** Junta os conhecimentos aprovados dos agentes para a IA, só se a pessoa permitiu enviar contextos. */
import { conhecimentoParaIA } from '../regras/conhecimentoParaIA.js';
import { espacoDaRaiz } from '../../projetos/servicoProjetos.js';

export function aprendizadosParaMcp(raiz: string, permitido: boolean, base?: string) {
  if (!permitido) return { disponivel: false, motivo: 'A pessoa não habilitou o envio de contextos ao agente de IA para este projeto; o conhecimento segue a mesma permissão.' };
  try { const e = espacoDaRaiz(raiz, base); return { disponivel: true, projetoPrumo: e?.nome ?? null, ...conhecimentoParaIA(e?.id ?? null, base) }; }
  catch { return { disponivel: false, motivo: 'Banco de conhecimento indisponível neste computador.' }; }
}
