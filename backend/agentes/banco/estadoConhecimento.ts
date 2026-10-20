/** Resume o banco de conhecimento: arquivo, tamanho, tabelas, vistas e contagens por agente. */
import fs from 'node:fs';
import { caminhoConhecimento } from './caminhoConhecimento.js';
import { comBancoDeConhecimento } from './comBancoDeConhecimento.js';
import { lerPerfil } from './lerPerfil.js';
import { pessoaDoConhecimento } from './pessoaDoConhecimento.js';
import { validarProjetoDoConhecimento } from './validacoesDoConhecimento.js';
import { vistaDoAgente } from './formatosDoConhecimento.js';
import { Linha, VERSAO_ESQUEMA } from '../tipos/conhecimento.js';
import { agentesChat } from '../tipos/persona.js';

export function estadoConhecimento(espacoId: string | null, base?: string) {
  validarProjetoDoConhecimento(espacoId); const arquivo = caminhoConhecimento(base);
  return comBancoDeConhecimento(base, (db) => {
    const conta = (sql: string, ...p: string[]) => Number((db.prepare(sql).get(...p) as Linha).n);
    const escopo = espacoId ? '(espaco_id IS NULL OR espaco_id = ?)' : 'espaco_id IS NULL'; const p = espacoId ? [espacoId] : [];
    // Atendimentos contam só os da pessoa da sessão; conhecimento aprovado é do projeto e vale para todos.
    const pessoa = pessoaDoConhecimento(base) ?? ''; const deQuem = `usuario_id = ? AND ${espacoId ? 'espaco_id = ?' : 'espaco_id IS NULL'} AND agente_id = ?`;
    const porAgente = Object.fromEntries(agentesChat.map((a) => [a.id, { aprovados: conta(`SELECT COUNT(*) AS n FROM conhecimentos WHERE ${escopo} AND agente_id = ? AND estado = 'APROVADO'`, ...p, a.id), rascunhos: conta(`SELECT COUNT(*) AS n FROM conhecimentos WHERE ${escopo} AND agente_id = ? AND estado = 'RASCUNHO'`, ...p, a.id),
      atendimentos: conta(`SELECT COUNT(*) AS n FROM atendimentos WHERE ${deQuem}`, pessoa, ...p, a.id), uteis: conta(`SELECT COUNT(*) AS n FROM atendimentos WHERE ${deQuem} AND avaliacao = 'UTIL'`, pessoa, ...p, a.id),
      naoUteis: conta(`SELECT COUNT(*) AS n FROM atendimentos WHERE ${deQuem} AND avaliacao = 'NAO_UTIL'`, pessoa, ...p, a.id) }]));
    return { arquivo, bytes: (() => { try { return fs.statSync(arquivo).size; } catch { return 0; } })(), esquema: VERSAO_ESQUEMA, tabelas: ['perfil', 'agentes', 'conhecimentos', 'vocabulario', 'atendimentos'], vistas: agentesChat.map((a) => vistaDoAgente(a.id)),
      gerais: conta(`SELECT COUNT(*) AS n FROM conhecimentos WHERE ${escopo} AND agente_id IS NULL AND estado = 'APROVADO'`, ...p), porAgente, perfil: lerPerfil(base) };
  });
}
