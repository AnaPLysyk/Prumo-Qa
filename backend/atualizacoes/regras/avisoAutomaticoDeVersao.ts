/** Aviso automático de versão nova (ao abrir e a cada 6 horas): acende o sino e mostra notificação do Windows uma vez por versão. */
import { app, Notification } from 'electron';
import { empilharAviso } from '../../aplicativo/avisos/avisos.js';
import { navegarPara } from '../../aplicativo/janela/navegarPara.js';
import { consultarAtualizacao } from './consultarAtualizacao.js';
import { lerPreferencias } from '../../configuracoes/banco/lerPreferencias.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export async function avisoAutomaticoDeVersao() {
  if (!lerPreferencias().avisoAutomatico || process.env.PRUMO_SEM_AVISO_AUTOMATICO === '1') return;
  if (!app.isPackaged && !process.env.PRUMO_UPDATE_TEST_URL) return;
  const r = await consultarAtualizacao(); const n = r.notificacao;
  if (r.status !== 'ATUALIZACAO_DISPONIVEL' || !n.notificar || !n.versao) return;
  // A janela (se aberta) acende o sino e toca o som quando for o caso; a notificação do Windows chega mesmo só na bandeja.
  const en = idiomaAtual() === 'en';
  const titulo = en ? `Prumo QA ${n.versao} available` : `Prumo QA ${n.versao} disponível`;
  const detalhe = en ? 'See what is new and update with one click in Help › Updates.' : 'Veja as novidades e atualize com um clique em Ajuda › Atualizações.';
  empilharAviso({ tipo: 'ATUALIZACAO_DISPONIVEL', titulo, detalhe, destino: 'atualizacoes', tocarSom: n.tocarSom });
  if (Notification.isSupported()) {
    const aviso = new Notification({ title: titulo, body: detalhe + (en ? ' Nothing is downloaded or installed without your click.' : ' Nada é baixado nem instalado sem o seu clique.'), silent: true });
    aviso.on('click', () => navegarPara('atualizacoes')); aviso.show();
  }
}
