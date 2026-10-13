/** Capacidades da IA, especializações e o formato da configuração de agentes por projeto. */
import { z } from 'zod';

/**
 * Especializações e políticas de capacidade das IAs conectadas (2.9). É o ponto ÚNICO de decisão: o servidor MCP consulta estas regras a cada
 * chamada, no backend, não na interface. Uma capacidade só está disponível se (a) a política do projeto não a bloqueia e (b) existe ao menos uma
 * especialização habilitada que a inclua. Leitura nunca vira escrita: criar casos, abrir bugs, publicar resultados, comentar e abrir PR só existem
 * como ação da PESSOA na janela (com confirmação); a IA só produz propostas em rascunho.
 */
export type EstadoCapacidade = 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO' | 'SOMENTE_PESSOA';

export type DefCap = { id: string; rotulo: string; ferramenta: string | null; editavel: EstadoCapacidade[]; padrao: EstadoCapacidade; explicacao: string };

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
  { id: 'qa-geral', rotulo: 'QA Geral', skill: 'skills/qa', capacidades: ['consultar_contexto', 'revisar_cobertura', 'consultar_evidencias', 'propor_casos', 'propor_aprendizado'], profissao: 'Engenheiro de Qualidade', especialidade: 'Estratégia e testes exploratórios' },
  { id: 'requisitos', rotulo: 'Análise de Requisitos e Cobertura', skill: 'skills/requisitos', capacidades: ['consultar_contexto', 'revisar_cobertura', 'propor_casos', 'propor_aprendizado'], profissao: 'Analista de Requisitos', especialidade: 'Critérios de aceite e cobertura' },
  { id: 'playwright', rotulo: 'Automação Playwright', skill: 'skills/playwright', capacidades: ['consultar_contexto', 'propor_casos', 'executar_testes', 'consultar_evidencias', 'propor_aprendizado'], profissao: 'Engenheiro de Automação', especialidade: 'Interface e E2E com Playwright' },
  { id: 'api-rest', rotulo: 'Testes de API REST', skill: 'skills/api-rest', capacidades: ['consultar_contexto', 'propor_casos', 'executar_testes', 'consultar_evidencias', 'propor_aprendizado'], profissao: 'Engenheiro de Testes de API', especialidade: 'Contratos REST e integração' },
  { id: 'acessibilidade', rotulo: 'Acessibilidade', skill: 'skills/acessibilidade', capacidades: ['consultar_contexto', 'revisar_cobertura', 'propor_casos', 'propor_aprendizado'], profissao: 'Especialista em Acessibilidade', especialidade: 'Barreiras de uso e navegação' },
  { id: 'investigacao-bugs', rotulo: 'Investigação de Bugs', skill: 'skills/investigacao-bugs', capacidades: ['consultar_contexto', 'consultar_evidencias', 'propor_bugs', 'propor_aprendizado'], profissao: 'Analista de Defeitos', especialidade: 'Reprodução e investigação de falhas' },
  { id: 'regressao', rotulo: 'Regressão', skill: 'skills/regressao', capacidades: ['executar_testes', 'consultar_evidencias', 'propor_bugs', 'propor_aprendizado'], profissao: 'Engenheiro de Regressão', especialidade: 'Execuções e rotinas autorizadas' },
  { id: 'monitoramento', rotulo: 'Monitoramento de Alterações', skill: 'skills/monitoramento', capacidades: ['consultar_contexto', 'consultar_evidencias', 'propor_aprendizado'], profissao: 'Analista de Qualidade', especialidade: 'Histórico e alterações observadas' }
] as const;

export const idsCap = capacidades.map(c => c.id);

export const idsEsp = especializacoes.map(e => e.id);

export const itemSchema = z.object({ espacoId: z.string().uuid(), especializacoes: z.array(z.string()).max(16), politicas: z.record(z.enum(['PERMITIDO', 'EXIGE_AUTORIZACAO', 'BLOQUEADO'])), alteradoEm: z.string().datetime(), por: z.string().max(200) }).strict();

export const registro = z.object({ version: z.literal(1), itens: z.array(itemSchema).max(200) }).strict();

export type Registro = z.infer<typeof registro>;

export type Configuracao = { especializacoes: string[]; politicas: Record<string, 'PERMITIDO' | 'EXIGE_AUTORIZACAO' | 'BLOQUEADO'>; padrao: boolean };
