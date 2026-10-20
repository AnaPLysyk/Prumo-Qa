/** Executa Codex e Claude com ambiente restrito, sem shell e sem alterar o repositório. */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { localizarClienteDeIa } from '../../conexoes/ia/localizarClienteDeIa.js';
import { Executor } from '../tipos/chat.js';

const variaveisPermitidas = [
  'PATH', 'SystemRoot', 'WINDIR', 'USERPROFILE', 'HOME', 'APPDATA',
  'LOCALAPPDATA', 'TEMP', 'TMP', 'CODEX_HOME', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'
];

/** Aceita executável real; shims ou atalhos que exigem shell ficam bloqueados. */
export const executavelDaIa = (provedor: 'claude' | 'codex') => {
  const cliente = localizarClienteDeIa(provedor);
  return cliente && !cliente.shim ? cliente.executable : null;
};

function ambienteDaIa() {
  return Object.fromEntries(
    variaveisPermitidas
      .filter(nome => process.env[nome])
      .map(nome => [nome, process.env[nome] as string])
  );
}

/** Executa numa pasta temporária vazia, com limites de tempo e buffer. */
export const executarCliDeIa: Executor = (comando, args, opcoes) => new Promise(resolver => {
  const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-chat-'));

  execFile(comando, args, {
    timeout: opcoes.timeoutMs,
    maxBuffer: 1024 * 1024,
    windowsHide: true,
    shell: false,
    cwd: temporario,
    env: ambienteDaIa()
  }, (erro, saida, stderr) => {
    // Apaga somente a pasta criada pelo próprio processo, dentro de os.tmpdir().
    const relativo = path.relative(os.tmpdir(), temporario);
    if (
      !path.isAbsolute(relativo) &&
      !relativo.startsWith('..') &&
      path.basename(temporario).startsWith('prumo-chat-')
    ) {
      try {
        fs.rmSync(temporario, { recursive: true, force: true });
      } catch {
        // Falha na limpeza não altera a resposta do provedor.
      }
    }

    const codigo = erro
      ? typeof (erro as NodeJS.ErrnoException & { code?: unknown }).code === 'number'
        ? (erro as unknown as { code: number }).code
        : null
      : 0;
    resolver({ codigo, saida: String(saida ?? ''), erro: String(stderr ?? '') });
  });
});
