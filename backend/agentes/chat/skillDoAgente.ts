/** Monta a Skill do agente para a IA externa: só os trechos aprovados do banco de Skills que combinam com a pergunta, dentro do limite de bytes. */
import { listarTrechosDeSkill } from '../banco/listarTrechosDeSkill.js';
import { sementeDasSkills } from '../banco/sementeDasSkills.js';
import { SkillEscolhida, escolherTrechosDaSkill } from '../regras/escolherTrechosDaSkill.js';

/**
 * Sem especialização (orquestrador), usa a Skill de QA geral. Se o banco não abrir, usa só os arquivos que vêm
 * com o aplicativo e avisa por `origem`, para a falha não passar despercebida.
 */
export function skillDoAgente(especializacao: string | null, pergunta: string, base?: string): SkillEscolhida & { origem: 'BANCO' | 'ARQUIVOS' } {
  const esp = especializacao ?? 'qa-geral';
  try { return { ...escolherTrechosDaSkill(listarTrechosDeSkill({ especializacao: esp, estados: ['APROVADO'] }, base), pergunta), origem: 'BANCO' }; }
  catch { return { ...escolherTrechosDaSkill(sementeDasSkills().filter((t) => t.especializacao === esp), pergunta), origem: 'ARQUIVOS' }; }
}
