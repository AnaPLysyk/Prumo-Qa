/** Executa o item escolhido no menu da bandeja (abrir, agenda, pausar, estado, sair). */
import { app, dialog } from 'electron';
import { definirPausaGlobal } from '../../agendamentos/regras/operacoesDaRotina.js';
import { workerDoAplicativo } from '../../agendamentos/worker/workerDoAplicativo.js';
import { resumoDoWorker } from './resumoDoWorker.js';
import { textoNoIdioma } from './textoNoIdioma.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { mostrarJanela } from '../janela/mostrarJanela.js';
import { navegarPara } from '../janela/navegarPara.js';
import { ItemMenu } from '../tipos/textosDaBandeja.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

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
