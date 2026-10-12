import { z } from 'zod';
import { lerLocal, gravarLocal } from './armazenamentoLocal.js';
import { listarEspacos, obterEspaco } from './espacos.js';
import path from 'node:path';

/**
 * Especializações e políticas de capacidade das IAs conectadas (2.9). É o ponto ÚNICO de decisão: o servidor MCP consulta estas regras a cada
 * chamada, no backend, não na interface. Uma capacidade só está disponível se (a) a política do projeto não a bloqueia e (b) existe ao menos uma
 * especialização habilitada que a inclua. Leitura nunca vira escrita: criar casos, abrir bugs, publicar resultados, comentar e abrir PR só existem
 * como ação da PESSOA na janela (com confirmação); a IA só produz propostas em rascunho.
 */
export type EstadoCapacidade = 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO' | 'SOMENTE_PESSOA';
type DefCap = { id: string; rotulo: string; ferramenta: string | null; editavel: EstadoCapacidade[]; padrao: EstadoCapacidade; explicacao: string };
export const capacidades: DefCap[] = [
  { id: 'consultar_contexto', rotulo: 'Ler o contexto do projeto', ferramenta: 'contexto_projeto', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Contexto autorizado e, se você habilitou, contextos do projeto. Somente leitura.' },
  { id: 'revisar_cobertura', rotulo: 'Revisar cobertura e riscos', ferramenta: 'revisar_cobertura', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Análise estrutural; não afirma execução.' },
  { id: 'consultar_evidencias', rotulo: 'Consultar evidências', ferramenta: 'consultar_evidencias', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Resultados e logs reais, com integridade.' },
  { id: 'propor_casos', rotulo: 'Propor casos de teste (rascunho)', ferramenta: 'propor_caso', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Cria só um rascunho local com checagem de duplicidade e limite por hora. Publicar no Qase é decisão da pessoa.' },
  { id: 'propor_bugs', rotulo: 'Propor bugs (rascunho)', ferramenta: 'propor_bug', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Cria só um rascunho local. Abrir o bug no Jira é decisão da pessoa.' },
  { id: 'propor_aprendizado', rotulo: 'Propor aprendizado (rascunho)', ferramenta: 'propor_aprendizado', editavel: ['PERMITIDO', 'BLOQUEADO'], padrao: 'PERMITIDO', explicacao: 'Sugere um conhecimento para o banco do agente como RASCUNHO, com limite por hora. Só a pessoa aprova no Cérebro.' },
  { id: 'executar_testes', rotulo: 'Executar testes autorizados', ferramenta: 'executar_validacao', editavel: ['EXIGE_AUTORIZACAO', 'BLOQUEADO'], padrao: 'EXIGE_AUTORIZACAO', explicacao: 'Capability declarada e autenticação humana nativa do Windows em cada execução. Bloquear desliga a ferramenta.' },
  { id: 'consultar_jira', rotulo: 'Consultar tickets do Jira', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'As credenciais ficam protegidas no aplicativo e não são acessíveis ao agente. A pessoa consulta na janela e pode importar o ticket como contexto em rascunho.' },
  { id: 'consultar_qase', rotulo: 'Consultar casos, planos e runs do Qase', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'Mesma regra do Jira: leitura na janela; o agente recebe apenas o que a pessoa disponibilizar como contexto.' },
  { id: 'criar_casos_qase', rotulo: 'Criar casos diretamente no Qase', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'Exige revisão e confirmação nativa da pessoa. A IA só propõe.' },
  { id: 'abrir_bug_jira', rotulo: 'Abrir bug no Jira', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'Exige confirmação nativa da pessoa, com prévia.' },
  { id: 'enviar_resultados_qase', rotulo: 'Enviar resultados ao Qase', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'Confirmação da pessoa, ou política de publicação aprovada por run para rotinas agendadas.' },
  { id: 'github_escrita', rotulo: 'Criar branch, commit e Pull Request', ferramenta: null, editavel: [], padrao: 'SOMENTE_PESSOA', explicacao: 'Somente em branch prumo/..., com revisão e confirmação da pessoa. Nunca na main.' }
];
export const especializacoes = [
  { id: 'qa-geral', rotulo: 'QA Geral', skill: 'skills/qa', capacidades: ['consultar_contexto', 'revisar_cobertura', 'consultar_evidencias', 'propor_casos', 'propor_aprendizado'] },
  { id: 'requisitos', rotulo: 'Análise de Requisitos e Cobertura', skill: 'skills/requisitos', capacidades: ['consultar_contexto', 'revisar_cobertura', 'propor_casos', 'propor_aprendizado'] },
  { id: 'playwright', rotulo: 'Automação Playwright', skill: 'skills/playwright', capacidades: ['consultar_contexto', 'propor_casos', 'executar_testes', 'consultar_evidencias', 'propor_aprendizado'] },
  { id: 'api-rest', rotulo: 'Testes de API REST', skill: 'skills/api-rest', capacidades: ['consultar_contexto', 'propor_casos', 'executar_testes', 'consultar_evidencias', 'propor_aprendizado'] },
  { id: 'acessibilidade', rotulo: 'Acessibilidade', skill: 'skills/acessibilidade', capacidades: ['consultar_contexto', 'revisar_cobertura', 'propor_casos', 'propor_aprendizado'] },
  { id: 'investigacao-bugs', rotulo: 'Investigação de Bugs', skill: 'skills/investigacao-bugs', capacidades: ['consultar_contexto', 'consultar_evidencias', 'propor_bugs', 'propor_aprendizado'] },
  { id: 'regressao', rotulo: 'Regressão', skill: 'skills/regressao', capacidades: ['executar_testes', 'consultar_evidencias', 'propor_bugs', 'propor_aprendizado'] },
  { id: 'monitoramento', rotulo: 'Monitoramento de Alterações', skill: 'skills/monitoramento', capacidades: ['consultar_contexto', 'consultar_evidencias', 'propor_aprendizado'] }
] as const;
const idsCap = capacidades.map(c => c.id); const idsEsp = especializacoes.map(e => e.id);
const itemSchema = z.object({ espacoId: z.string().uuid(), especializacoes: z.array(z.string()).max(16), politicas: z.record(z.enum(['PERMITIDO', 'EXIGE_AUTORIZACAO', 'BLOQUEADO'])), alteradoEm: z.string().datetime(), por: z.string().max(200) }).strict();
const registro = z.object({ version: z.literal(1), itens: z.array(itemSchema).max(200) }).strict();
type Registro = z.infer<typeof registro>;
const ler = (b?: string) => lerLocal<Registro>('agentes.json', registro, { version: 1, itens: [] }, b);

export type Configuracao = { especializacoes: string[]; politicas: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'>; padrao: boolean };
/** Sem configuração salva vale o padrão: todas as especializações habilitadas e as políticas padrão (comportamento anterior à 2.9). */
export function configuracaoDoEspaco(espacoId: string, b?: string): Configuracao {
  const i = ler(b).itens.find(x => x.espacoId === espacoId);
  return i ? { especializacoes: i.especializacoes.filter(e => idsEsp.includes(e as never)), politicas: i.politicas, padrao: false } : { especializacoes: [...idsEsp], politicas: {}, padrao: true };
}
export function salvarConfiguracao(espacoId: string, c: { especializacoes: string[]; politicas: Record<string, string> }, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const esp = [...new Set(c.especializacoes)]; if (esp.some(e => !idsEsp.includes(e as never))) throw new Error('AGENT_SPECIALIZATION_UNKNOWN');
  const pol: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'> = {};
  for (const [cap, estado] of Object.entries(c.politicas)) { const d = capacidades.find(x => x.id === cap); if (!d) throw new Error('AGENT_CAPABILITY_UNKNOWN'); if (!d.editavel.includes(estado as EstadoCapacidade)) throw new Error('AGENT_POLICY_NOT_ALLOWED: ' + cap + ' não aceita ' + estado); pol[cap] = estado as 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'; }
  const r = ler(b); r.itens = r.itens.filter(i => i.espacoId !== espacoId); r.itens.push({ espacoId, especializacoes: esp, politicas: pol, alteradoEm: agora.toISOString(), por: por.slice(0, 200) });
  gravarLocal('agentes.json', registro.parse(r), b); return configuracaoDoEspaco(espacoId, b);
}
export function capacidadeEfetiva(espacoId: string | null, cap: string, b?: string): { estado: EstadoCapacidade; motivo: string } {
  const d = capacidades.find(x => x.id === cap); if (!d) return { estado: 'BLOQUEADO', motivo: 'Capacidade desconhecida.' };
  if (d.padrao === 'SOMENTE_PESSOA') return { estado: 'SOMENTE_PESSOA', motivo: d.explicacao };
  const c = espacoId ? configuracaoDoEspaco(espacoId, b) : { especializacoes: [...idsEsp], politicas: {} as Configuracao['politicas'], padrao: true };
  const politica = c.politicas[cap] ?? d.padrao; if (politica === 'BLOQUEADO') return { estado: 'BLOQUEADO', motivo: 'Bloqueada pela política deste projeto.' };
  const cobre = especializacoes.filter(e => (c.especializacoes as string[]).includes(e.id) && (e.capacidades as readonly string[]).includes(cap));
  if (!cobre.length) return { estado: 'BLOQUEADO', motivo: 'Nenhuma especialização habilitada inclui esta capacidade.' };
  return { estado: politica, motivo: politica === 'EXIGE_AUTORIZACAO' ? 'Permitida, mas cada execução exige autorização humana nativa.' : 'Permitida pelas especializações: ' + cobre.map(e => e.rotulo).join(', ') + '.' };
}
/** Matriz completa para a interface e para a ferramenta listar_politicas. */
export function matrizDePoliticas(espacoId: string | null, b?: string) {
  return capacidades.map(d => { const e = capacidadeEfetiva(espacoId, d.id, b); return { id: d.id, rotulo: d.rotulo, ferramenta: d.ferramenta, estado: e.estado, motivo: e.motivo, editavel: d.editavel, explicacao: d.explicacao }; });
}
export function exigirCapacidade(espacoId: string | null, cap: string, b?: string) {
  const e = capacidadeEfetiva(espacoId, cap, b); if (e.estado === 'BLOQUEADO' || e.estado === 'SOMENTE_PESSOA') throw Object.assign(new Error(`POLICY_BLOCKED: ${e.motivo}`), { codigo: 'POLICY_BLOCKED' }); return e;
}
/** Projeto Prumo (espaço) a que uma raiz autorizada pertence: a pasta de contextos do projeto ou a pasta de automação vinculada. */
export function espacoDaRaiz(raiz: string, b?: string) {
  const alvo = path.resolve(raiz).toLowerCase(); return listarEspacos(b).find(e => path.resolve(e.raizContextos).toLowerCase() === alvo || (e.pastaLocal && path.resolve(e.pastaLocal).toLowerCase() === alvo)) ?? null;
}
