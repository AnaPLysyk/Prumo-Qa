/** Registra um canal da janela: só aceita a própria página, valida os dados pelo contrato, registra diagnóstico e nunca vaza detalhes internos. */
import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CanalIpc, canaisFrequentes, esquemasIpc } from './catalogoDeContratos.js';
import { mensagemComCodigo } from '../../compartilhado/erros/mensagemComCodigo.js';
import { Resposta, origemPermitida } from '../tipos/aplicativo.js';
import { registrarDiagnostico } from '../../logs/banco/registrarDiagnostico.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { conferirAcessoAoCanal } from '../../login/regras/conferirAcessoAoCanal.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { executarNoEscopoDoUsuario } from '../../compartilhado/banco/escopoDeUsuario.js';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import {usarAutenticacaoRemota,validarSessaoRemota} from '../../login/integracoes/autenticacaoRemota.js';
import {acessoDosCanais} from '../../login/tipos/acessoDosCanais.js';

/**
 * Registra um canal do catálogo: recusa remetente que não seja a nossa página, valida com o esquema do contrato,
 * grava diagnóstico (só metadados) e nunca vaza stack. Consultas frequentes só deixam rastro quando falham.
 */
export function registrarCanal<C extends CanalIpc>(nome: C, fn: (a: z.output<(typeof esquemasIpc)[C]>, janela: BrowserWindow | null) => unknown | Promise<unknown>) {
  ipcMain.handle('prumo:' + nome, async (e: IpcMainInvokeEvent, bruto: unknown): Promise<Resposta> => {
    const inicio = performance.now(); const correlationId = randomUUID(); let apagaDiagnostico = false;
    const diag = (state: 'OK' | 'ERROR', code?: string) => {
      // Excluir o diagnóstico não deve deixar um novo registro de si mesmo; consultas frequentes só deixam rastro ao falhar.
      if (nome === 'diagnostico:listar' || apagaDiagnostico || (state === 'OK' && canaisFrequentes.has(nome))) return;
      registrarDiagnostico({ at: new Date().toISOString(), channel: nome, state, durationMs: Math.round(performance.now() - inicio), ...(code ? { code } : {}), correlationId });
    };
    try {
      const janela = estadoDoAplicativo.janelaPrincipal;
      if (!janela || janela.isDestroyed() || e.sender !== janela.webContents
        || e.senderFrame !== e.sender.mainFrame || e.senderFrame.url !== origemPermitida) {
        throw new Error('IPC_SENDER_REJECTED');
      }
      const entrada = esquemasIpc[nome].safeParse(bruto ?? {});
      if (!entrada.success) throw new Error('INVALID_ARGUMENTS: argumentos recusados.');
      const args = entrada.data as z.output<(typeof esquemasIpc)[C]>;
      // 2.11: com o login ligado, cada canal exige sessão e o nível da tela no papel da pessoa (login/tipos/acessoDosCanais.ts).
      // Revalida a sessão remota periodicamente antes de processar dados locais protegidos.
      if(usarAutenticacaoRemota() && acessoDosCanais[nome]!=='publico' && nome!=='conta:sair' && contaDaSessao())
        await validarSessaoRemota();
      conferirAcessoAoCanal(nome, undefined, Date.now(), !canaisFrequentes.has(nome));
      apagaDiagnostico = nome === 'dados:excluir' && (args as { escopo?: string }).escopo === 'diagnostico';
      // A identidade do pedido fica fixa durante awaits; A jamais grava nos dados de B após um logout.
      const data = await executarNoEscopoDoUsuario(contaDaSessao()?.id ?? null, () => fn(args, janela));
      // Reinicia os agendamentos no escopo de quem acabou de entrar (não no do usuário anterior).
      if (['conta:entrar','conta:confirmarentrada','conta:githubestado','conta:googleestado','usuarios:ativar'].includes(nome)) {
        const usuario=contaDaSessao();
        if(usuario){
          await workerDoAplicativo.parar();
          try { executarNoEscopoDoUsuario(usuario.id, () => workerDoAplicativo.iniciar()); }
          catch { /* erro do worker não dá acesso e não bloqueia login */ }
        }
      }
      diag('OK'); return { ok: true, data };
    } catch (err) {
      // Entrada inválida já virou INVALID_ARGUMENTS acima; um ZodError aqui é dado local recusado pelo núcleo, não erro de quem chamou.
      const msg = err instanceof z.ZodError ? 'LOCAL_DATA_INVALID: dados locais recusados pela validação (' + (err.issues[0]?.path.join('.') || 'raiz') + ').' : mensagemComCodigo(err);
      diag('ERROR', /^([A-Z][A-Z_]{2,63})\b/.exec(msg)?.[1] ?? 'TOOL_ERROR');
      return { ok: false, error: msg };
    }
  });
}
