/** Controlador da funcionalidade atualizacoes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { shell, app } from "electron";
import { perguntarNaJanela } from "../aplicativo/janela/caixaDeConfirmacao.js";
import { repositorio } from "../ajuda/contratos.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { estadoDoAplicativo } from "../aplicativo/estadoDoAplicativo.js";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { workerDoAplicativo } from "../agendamentos/worker/workerDoAplicativo.js";
import { baixarAtualizacao } from "./servicoInstalacao.js";
import { entregarInstalador, instrucaoDeInstalacao } from "./servicoInstalacao.js";
import { plataformaDoInstalador } from "./servicoInstalacao.js";
import { argumentosInstalador } from "./contratos.js";
import { consultarAtualizacao } from "./servicoVerificacao.js";
import { versao } from "../aplicativo/tipos/aplicativo.js";
import { avisoDeVersaoPendente } from "./servicoVerificacao.js";
import { marcarVersaoVista } from "./servicoVerificacao.js";

export const atualizacaoAbrir: TratadorDoCanal<'atualizacao:abrir'> = async (_a, janela) => {
  if (!estadoDoAplicativo.ultimaRelease || !new RegExp(`^https://github\\.com/${repositorio}/releases/tag/v\\d+\\.\\d+\\.\\d+$`).test(estadoDoAplicativo.ultimaRelease)) throw new Error('NO_VERIFIED_RELEASE: verifique as atualizações antes.');
  const r = await perguntarNaJanela(janela, { type: 'question', title: 'Abrir página oficial', buttons: ['Cancelar', 'Abrir no navegador'], defaultId: 0, cancelId: 0, noLink: true,
    message: 'Abrir a página oficial da nova versão?', detail: `${estadoDoAplicativo.ultimaRelease}\n\nO Prumo não baixa nem instala nada. Confira o SHA-256 informado na página antes de executar o instalador.` });
  if (r.response !== 1) return { opened: false };
  await shell.openExternal(estadoDoAplicativo.ultimaRelease); return { opened: true };
};

// Atualizar com um clique (Windows). No macOS e no Linux o instalador é baixado, conferido e entregue na pasta Downloads para a pessoa abrir.
// Só a versão que a consulta validou; confirmação nativa; download e SHA-256 conferidos
// no processo principal; o instalador roda em modo silencioso e reabre o Prumo. Fora do pacote (desenvolvimento e testes)
// baixa e confere de um servidor 127.0.0.1, mas nunca executa instalador.
export const atualizacaoInstalar: TratadorDoCanal<'atualizacao:instalar'> = async (_a, janela) => {
  const v = estadoDoAplicativo.ultimaVersao;
  if (!v || !estadoDoAplicativo.ultimaRelease) throw new Error('NO_VERIFIED_RELEASE: verifique as atualizações antes de atualizar.');
  if (workerDoAplicativo.estado().emExecucao) throw new Error('UPDATE_BUSY: há uma execução em andamento. Espere terminar e atualize de novo.');
  const plataforma = plataformaDoInstalador();
  if (!plataforma) throw new Error('UPDATE_UNSUPPORTED: não há instalador oficial para este sistema; baixe pela página de download.');
  const ehWindows = plataforma === 'win';
  const r = await perguntarNaJanela(janela, { type: 'question', title: 'Atualizar o Prumo QA', buttons: ['Cancelar', 'Atualizar agora'], defaultId: 1, cancelId: 0, noLink: true,
    message: `Atualizar para a versão ${v} agora?`, detail: `O Prumo baixa o instalador oficial da release v${v} no GitHub, confere o SHA-256 publicado, fecha, instala e abre de novo. Projetos, histórico e evidências são mantidos.\n\nO instalador não é assinado digitalmente; a conferência do SHA-256 garante que o arquivo é o publicado na release.` });
  if (r.response !== 1) return { canceled: true };
  const teste = !app.isPackaged ? process.env.PRUMO_UPDATE_TEST_DOWNLOAD : undefined;
  if (!app.isPackaged && !teste) throw new Error('UPDATE_DEV_MODE: fora do aplicativo instalado não há atualização automática.');
  const baixado = await baixarAtualizacao(v, teste ? { base: teste, permitirLocal: true } : {});
  if (!app.isPackaged) { fs.rmSync(path.dirname(baixado.arquivo), { recursive: true, force: true }); return { canceled: false, verificado: true, instalando: false, versao: v, sha256: baixado.sha256 }; }
  if (!ehWindows) {
    const entregue = entregarInstalador(baixado.arquivo, app.getPath('downloads'), plataforma);
    shell.showItemInFolder(entregue);
    return { canceled: false, verificado: true, instalando: false, versao: v, sha256: baixado.sha256, baixadoEm: entregue, proximoPasso: instrucaoDeInstalacao(plataforma) };
  }
  // Outra rotina pode começar durante o download. Não fechar o aplicativo com trabalho ativo.
  if (workerDoAplicativo.estado().emExecucao) throw new Error('UPDATE_BUSY: uma execução começou durante o download; tente instalar depois que terminar.');
  const filho = spawn(baixado.arquivo, [...argumentosInstalador], { detached: true, stdio: 'ignore', windowsHide: false });
  await new Promise<void>((resolve, reject) => {
    filho.once('error', reject);
    filho.once('spawn', resolve);
  });
  filho.on('error', () => { /* erro posterior não deve derrubar o processo principal */ });
  filho.unref();
  setTimeout(() => app.quit(), 600).unref();
  return { canceled: false, verificado: true, instalando: true, versao: v, sha256: baixado.sha256 };
};

export const atualizacaoVerificar: TratadorDoCanal<'atualizacao:verificar'> = () => consultarAtualizacao();

export const preferenciasVisualizada: TratadorDoCanal<'preferencias:visualizada'> = a => ({ preferencias: marcarVersaoVista(a.versao), aviso: avisoDeVersaoPendente(versao) });
