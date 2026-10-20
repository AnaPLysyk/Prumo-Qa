/** Liga ou desliga "iniciar com o sistema": item de login no Windows e no macOS, arquivo de autostart no Linux. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

type ItemDeLogin = { setLoginItemSettings: (o: { openAtLogin: boolean; args: string[] }) => void };

/** Texto do atalho de autostart (freedesktop). O caminho do executável vai entre aspas; a pessoa que liga é quem o usa. */
export function atalhoDeAutostart(executavel: string): string {
  const exec = '"' + executavel.replace(/(["`$\\])/g, '\\$1') + '" --oculto';
  return ['[Desktop Entry]', 'Type=Application', 'Name=Prumo QA', 'Comment=Qualidade de software do ticket à evidência', `Exec=${exec}`, 'Terminal=false', 'X-GNOME-Autostart-enabled=true', ''].join('\n');
}

export function iniciarComOSistema(ligado: boolean, app: ItemDeLogin, sistema: string = process.platform, opcoes: { pastaConfig?: string; executavel?: string } = {}): void {
  if (sistema !== 'linux') { app.setLoginItemSettings({ openAtLogin: ligado, args: ligado ? ['--oculto'] : [] }); return; }
  const pasta = path.join(opcoes.pastaConfig ?? (process.env.XDG_CONFIG_HOME && path.isAbsolute(process.env.XDG_CONFIG_HOME) ? process.env.XDG_CONFIG_HOME : path.join(os.homedir(), '.config')), 'autostart');
  const arquivo = path.join(pasta, 'prumo-qa.desktop');
  if (!ligado) { fs.rmSync(arquivo, { force: true }); return; }
  fs.mkdirSync(pasta, { recursive: true });
  fs.writeFileSync(arquivo, atalhoDeAutostart(opcoes.executavel ?? process.env.APPIMAGE ?? process.execPath), { mode: 0o644 });
}
