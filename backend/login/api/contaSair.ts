/** Canal conta:sair: Encerrar a sessão de quem está no Prumo. */
import { sairDaConta } from '../regras/contas.js';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import {sairRemotamente} from '../integracoes/autenticacaoRemota.js';
import { revogarCredencialMcp } from '../../aplicativo/ponteDaSessaoMcp.js';

export const contaSair: TratadorDoCanal<'conta:sair'> = async () => {
  revogarCredencialMcp(); // O MCP perde acesso antes das operações assíncronas de saída.
  // Encerra tarefas da conta anterior antes de liberar uma nova identidade nesta janela.
  try { await workerDoAplicativo.parar(); } catch { /* Saída não deve preservar sessão por erro do worker. */ }
  await sairRemotamente();
  servicosDoAplicativo.limparPrevias();
  return sairDaConta();
};
