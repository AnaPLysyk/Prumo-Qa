/** Registra um canal da janela: só aceita a própria página, valida os dados pelo contrato, registra diagnóstico e nunca vaza detalhes internos. */
import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CanalIpc, canaisFrequentes, esquemasIpc } from './catalogoDeContratos.js';
import { mensagemComCodigo } from './mensagemComCodigo.js';
import { Resposta, origemPermitida } from '../tipos/aplicativo.js';
import { registrarDiagnostico } from '../../logs/banco/registrarDiagnostico.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { conferirAcessoAoCanal } from '../../login/regras/conferirAcessoAoCanal.js';

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
      conferirAcessoAoCanal(nome);
      apagaDiagnostico = nome === 'dados:excluir' && (args as { escopo?: string }).escopo === 'diagnostico';
      const data = await fn(args, janela);
      diag('OK'); return { ok: true, data };
    } catch (err) {
      // Entrada inválida já virou INVALID_ARGUMENTS acima; um ZodError aqui é dado local recusado pelo núcleo, não erro de quem chamou.
      const msg = err instanceof z.ZodError ? 'LOCAL_DATA_INVALID: dados locais recusados pela validação (' + (err.issues[0]?.path.join('.') || 'raiz') + ').' : mensagemComCodigo(err);
      diag('ERROR', /^([A-Z][A-Z_]{2,63})\b/.exec(msg)?.[1] ?? 'TOOL_ERROR');
      return { ok: false, error: msg };
    }
  });
}
