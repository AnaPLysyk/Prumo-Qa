/** Criação explícita de repositório na conta conectada, sem mudar permissões nem substituir vínculos. */
import { z } from 'zod';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { contaAtivaRenovada, adaptadorDaConta } from '../servicoContas.js';
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { vincularServicoAoEspaco } from '../../projetos/servicoProjetos.js';
import { escritaHabilitada } from '../escrita/permissoes.js';
import { recursoDaResposta } from '../integracoes/configuracaoDosServicos.js';

export async function criarRepositorio(c: ContextoDosServicos, espacoId: string, conexaoId: string, nome: string, privado: boolean) {
  const e = obterEspaco(espacoId, c.base);
  if (e.vinculos.some(v => v.servico === 'github')) throw new Error('WORKSPACE_LINK_EXISTS');
  if (!escritaHabilitada(e.id, 'github', c.base)) throw new Error('WRITE_NOT_ENABLED');
  z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$/).refine(v => !v.includes('..')).parse(nome);
  const conta = await contaAtivaRenovada(c, conexaoId);
  if (conta.servico !== 'github') throw new Error('GITHUB_ACCOUNT_REQUIRED');
  const a = adaptadorDaConta(c, conta);
  if ((await a.autenticar()).contaId !== conta.contaId) throw new Error('SERVICE_SCOPE_CHANGED');
  const ctx = a.contexto();
  const criado = await ctx.enviar('POST', '/user/repos', JSON.stringify({ name: nome, private: privado, auto_init: true }));
  const recurso = recursoDaResposta(a.c, criado);
  const releitura = recursoDaResposta(a.c, await ctx.ler('/repos/' + recurso.chave));
  if (releitura.id !== recurso.id) throw new Error('CODE_REPOSITORY_NOT_CONFIRMED');
  return vincularServicoAoEspaco(e.id, 'github', conta.id, releitura, c.base);
}
