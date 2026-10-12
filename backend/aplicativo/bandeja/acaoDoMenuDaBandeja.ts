/** Executa o item escolhido no menu da bandeja (abrir, agenda, pausar, estado, sair). */
import { app, dialog } from 'electron';
import { definirPausaGlobal } from '../../agendamentos/regras/definirPausaGlobal.js';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { atualizarBandeja } from './atualizarBandeja.js';
import { resumoDoWorker } from './resumoDoWorker.js';
import { textoNoIdioma } from './textoNoIdioma.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { mostrarJanela } from '../janela/mostrarJanela.js';
import { navegarPara } from '../janela/navegarPara.js';
import { ItemMenu } from '../tipos/textosDaBandeja.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export function acaoDoMenuDaBandeja(id: ItemMenu['id']) {
  if (id === 'abrir') mostrarJanela(); else if (id === 'agenda') navegarPara('agenda'); else if (id === 'execucoes') navegarPara('execucoes');
  else if (id === 'pausar' || id === 'retomar') { definirPausaGlobal(id === 'pausar'); atualizarBandeja(); }
  else if (id === 'sair') app.quit();
  else if (id === 'estado') {
    const e = workerDoAplicativo.estado(); const i = idiomaAtual(); const j = estadoDoAplicativo.janelaPrincipal && !estadoDoAplicativo.janelaPrincipal.isDestroyed() && estadoDoAplicativo.janelaPrincipal.isVisible() ? estadoDoAplicativo.janelaPrincipal : undefined;
    const opcoes = { type: 'info' as const, title: textoNoIdioma('tituloEstado', i), message: resumoDoWorker(e, i), buttons: [textoNoIdioma('fechar', i)], detail: textoNoIdioma('detalheEstado', i, { n: e.proximaExecucao ?? textoNoIdioma('nenhuma', i), p: e.pendentes, z: e.pausado ? textoNoIdioma('sim', i) : textoNoIdioma('nao', i), u: e.ultimoErro ?? textoNoIdioma('nenhum', i) }) };
    void (j ? dialog.showMessageBox(j, opcoes) : dialog.showMessageBox(opcoes));
  }
}
