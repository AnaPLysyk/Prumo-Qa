/** cicloDaBandeja: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { workerDoAplicativo } from "../../agendamentos/worker/workerDoAplicativo.js";
import { empilharAviso } from "../estadoDoAplicativo.js";
import { estadoDoAplicativo } from "../estadoDoAplicativo.js";
import { idiomaAtual } from "../../configuracoes/servico.js";
import { nativeImage, Tray, Menu, app, dialog } from "electron";
import path from "node:path";
import { mostrarJanela, navegarPara } from "../janela/controleDaJanela.js";
import { raizDoAplicativo } from "../../compartilhado/raizDoAplicativo.js";
import { textoNoIdioma, resumoDoWorker } from "./conteudoDaBandeja.js";
import { EstadoWorker, Idioma, ItemMenu } from "../tipos/textosDaBandeja.js";
import { definirPausaGlobal } from "../../agendamentos/regras/cicloDaRotina.js";

// --- vigiarWorker ---
/** Vigia o worker: se ele parar sem o usuário pedir, tenta reiniciar e avisa; nunca finge que está ativo. */
export function vigiarWorker() {
  if (estadoDoAplicativo.saindo || workerDoAplicativo.estado().executando) return;
  try { workerDoAplicativo.iniciar(); empilharAviso({ tipo: 'WORKER_INTERROMPIDO', titulo: 'Worker', detalhe: idiomaAtual() === 'en' ? 'The worker had stopped and was restarted.' : 'O worker tinha parado e foi reiniciado.' }); } catch { /* outra instância detém a trava */ }
}

// --- cicloDaBandeja ---
export function criarBandeja() {
  const icone = nativeImage.createFromPath(path.join(raizDoAplicativo, 'assets', 'prumo-icon.png')).resize({ width: 16, height: 16 });
  estadoDoAplicativo.bandeja = new Tray(icone); estadoDoAplicativo.bandeja.on('click', () => mostrarJanela()); estadoDoAplicativo.bandeja.on('double-click', () => mostrarJanela()); atualizarBandeja();
  setInterval(() => { try { vigiarWorker(); atualizarBandeja(); } catch { /* um ciclo com erro não derruba o processo */ } }, 15000).unref();
}

const dicaDaBandeja = (e: EstadoWorker, i: Idioma) => `Prumo QA — ${!e.executando ? textoNoIdioma('dicaParado', i) : e.pausado ? textoNoIdioma('dicaPausado', i) : e.emExecucao ? textoNoIdioma('dicaExecutando', i) : textoNoIdioma('dicaAtivo', i)}`;

export function atualizarBandeja() {
  const bandeja = estadoDoAplicativo.bandeja;
  if (!bandeja) return;
  bandeja.setContextMenu(menuDaBandeja(atualizarBandeja));
  bandeja.setToolTip(dicaDaBandeja(workerDoAplicativo.estado(), idiomaAtual()));
}

/** Modelo puro do menu da bandeja. Pausar e Retomar nunca aparecem juntos; o item de estado reflete o worker real. */
function itensDoMenuDaBandeja(e: EstadoWorker, i: Idioma): ItemMenu[] {
  return [
    { id: 'abrir', rotulo: textoNoIdioma('abrir', i) }, { id: 'agenda', rotulo: textoNoIdioma('agenda', i) }, { id: 'execucoes', rotulo: textoNoIdioma('execucoes', i) }, { id: 'separador', rotulo: '' },
    e.pausado ? { id: 'retomar', rotulo: textoNoIdioma('retomar', i) } : { id: 'pausar', rotulo: textoNoIdioma('pausar', i) },
    { id: 'estado', rotulo: textoNoIdioma('estado', i, { e: resumoDoWorker(e, i) }) }, { id: 'separador', rotulo: '' }, { id: 'sair', rotulo: textoNoIdioma('sair', i) }
  ];
}

export const menuDaBandeja = (atualizar: () => void) => {
  const itens = itensDoMenuDaBandeja(workerDoAplicativo.estado(), idiomaAtual());
  return Menu.buildFromTemplate(itens.map(item => {
    if (item.id === 'separador') return { type: 'separator' as const };
    return { label: item.rotulo, click: () => acaoDoMenuDaBandeja(item.id, atualizar) };
  }));
};

export function acaoDoMenuDaBandeja(id: ItemMenu['id'], atualizar: () => void) {
  if (id === 'abrir') { mostrarJanela(); return; }
  if (id === 'agenda') { navegarPara('agenda'); return; }
  if (id === 'execucoes') { navegarPara('execucoes'); return; }

  if (id === 'pausar' || id === 'retomar') {
    definirPausaGlobal(id === 'pausar');
    atualizar();
    return;
  }
  if (id === 'sair') { app.quit(); return; }
  if (id !== 'estado') return;

  const estado = workerDoAplicativo.estado();
  const idioma = idiomaAtual();
  const principal = estadoDoAplicativo.janelaPrincipal;
  const janela = principal && !principal.isDestroyed() && principal.isVisible() ? principal : undefined;
  const opcoes = {
    type: 'info' as const,
    title: textoNoIdioma('tituloEstado', idioma),
    message: resumoDoWorker(estado, idioma),
    buttons: [textoNoIdioma('fechar', idioma)],
    detail: textoNoIdioma('detalheEstado', idioma, {
      n: estado.proximaExecucao ?? textoNoIdioma('nenhuma', idioma),
      p: estado.pendentes,
      z: estado.pausado ? textoNoIdioma('sim', idioma) : textoNoIdioma('nao', idioma),
      u: estado.ultimoErro ?? textoNoIdioma('nenhum', idioma)
    })
  };
  void (janela ? dialog.showMessageBox(janela, opcoes) : dialog.showMessageBox(opcoes));
}
