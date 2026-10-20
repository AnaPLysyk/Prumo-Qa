/** Confere se a capacidade pode rodar (declarada, não bloqueada, projeto não somente leitura) e calcula seu escopo. */
import { ErroQa } from '../../compartilhado/erros.js';
import { normalizarComando } from '../../compartilhado/projeto/normalizarComando.js';
import { caminhoSeguro } from '../../compartilhado/seguranca/caminhoSeguro.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { ambienteMinimo } from './ambienteMinimo.js';
import { escopoDaExecucao } from './escopoDaExecucao.js';

/** Escopo atual de uma capability, sem executar nada: usado para pedir e reconhecer autorizações agendadas. */
export async function escopoDeCapability(p:Projeto,capability:string) {
  if(p.manifesto.execution.readOnly) throw new ErroQa('POLICY_BLOCKED','Projeto autorizado estritamente para leitura.');
  if(!Object.hasOwn(p.manifesto.commands,capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED','Capability inexistente.');
  if(p.manifesto.execution.blockedByDefault.includes(capability)) throw new ErroQa('POLICY_BLOCKED','Execução bloqueada pelo contrato.');
  const c=normalizarComando(p.manifesto.commands[capability]!); const command=JSON.stringify({...c,env:Object.fromEntries(Object.keys(c.env).map(n=>[n,'[DECLARED]']))});
  await caminhoSeguro(p.raiz,c.cwd); const env=ambienteMinimo(p,c,'escopo'); for(const f of c.requiredFiles) await caminhoSeguro(p.raiz,f);
  return { scopeHash:await escopoDaExecucao(p,c,env), command };
}
