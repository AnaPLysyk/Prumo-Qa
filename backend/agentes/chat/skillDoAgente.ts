/** Monta a Skill do agente para a IA externa: só os trechos aprovados do banco de Skills que combinam com a pergunta, dentro do limite de bytes. */
import { listarTrechosDeSkill } from '../banco/listarTrechosDeSkill.js';
import { sementeDasSkills } from '../banco/sementeDasSkills.js';
import { SkillEscolhida, escolherTrechosDaSkill } from '../regras/escolherTrechosDaSkill.js';
import { validarEspecializacao } from '../regras/validarEspecializacao.js';
import { falharCom } from '../../compartilhado/erros.js';

/**
 * Sem especialização (orquestrador), usa a Skill de QA geral. Especialização desconhecida é recusada antes de ler qualquer
 * arquivo. Se o banco não abrir, usa só as Skills que vêm com o aplicativo e avisa por `origem`. Sem nenhum trecho aprovado,
 * falha com SKILL_UNAVAILABLE: a IA externa não é chamada sem as instruções da especialização.
 */
export function skillDoAgente(especializacao: string | null, pergunta: string, base?: string): SkillEscolhida & { origem: 'BANCO' | 'ARQUIVOS' } {
  const esp = validarEspecializacao(especializacao ?? 'qa-geral');
  let r: SkillEscolhida & { origem: 'BANCO' | 'ARQUIVOS' };
  try { r = { ...escolherTrechosDaSkill(listarTrechosDeSkill({ especializacao: esp, estados: ['APROVADO'] }, base), pergunta), origem: 'BANCO' }; }
  catch { r = { ...escolherTrechosDaSkill(sementeDasSkills().filter((t) => t.especializacao === esp), pergunta), origem: 'ARQUIVOS' }; }
  if (!r.texto) falharCom('SKILL_UNAVAILABLE: nenhuma instrução aprovada desta especialização; resposta local.');
  return r;
}
