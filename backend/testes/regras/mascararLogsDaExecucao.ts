/** Mascara segredos declarados e do ambiente antes de mostrar ou gravar a saída de uma execução. */
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';

export function mascararLogsDaExecucao(p: Projeto, env: NodeJS.ProcessEnv, stdout: Buffer[], stderr: Buffer[]) {
  const segredos=[...Object.entries(process.env).filter(([n])=>/token|secret|password|api.?key/i.test(n)).map(([,v])=>v!),...p.manifesto.execution.envAllowlist.map(n=>env[n]!)].filter(Boolean);
  return {
    segredos,
    stdout:mascarar(Buffer.concat(stdout).toString(),segredos),
    stderr:mascarar(Buffer.concat(stderr).toString(),segredos)
  };
}
