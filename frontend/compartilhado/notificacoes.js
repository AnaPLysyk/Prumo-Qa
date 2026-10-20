'use strict';
/** Notificacoes: sino de atualizacoes, som e estado de novas versoes. */
const resumoNotas = (notas) => (notas || '').split(/\r?\n/).map((l) => l.replace(/^[-*#>\s]+/, '').replace(/[`*]/g, '').trim()).filter((l) => l.length > 3).slice(0, 3);
function tocarSom() {
  // Dois tons curtos (≈0,3 s) sintetizados na hora: sem arquivo de áudio e sem biblioteca. Falha de áudio nunca atrapalha o uso.
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(); const t0 = ctx.currentTime;
    [[660, 0], [880, 0.14]].forEach(([freq, atraso]) => {
      const osc = ctx.createOscillator(); const ganho = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, t0 + atraso); ganho.gain.exponentialRampToValueAtTime(0.12, t0 + atraso + 0.02); ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + atraso + 0.14);
      osc.connect(ganho).connect(ctx.destination); osc.start(t0 + atraso); osc.stop(t0 + atraso + 0.16);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
    window.__prumoSom = (window.__prumoSom || 0) + 1; // contador observável pelos testes automatizados
  } catch { /* sem áudio: ignora */ }
}
function desenharSino(aviso) {
  const sino = $('#sino'); const ponto = $('#sino-ponto'); const dica = $('#sino-dica');
  estado.aviso = aviso && aviso.indicador ? aviso : null;
  ponto.hidden = !estado.aviso; sino.classList.toggle('novo', !!estado.aviso);
  sino.setAttribute('aria-label', estado.aviso ? 'Atualizações do Prumo QA: versão ' + estado.aviso.versao + ' disponível' : 'Atualizações do Prumo QA: nenhuma novidade');
  const itens = estado.aviso ? resumoNotas(estado.aviso.notas) : [];
  dica.replaceChildren(...(estado.aviso
    ? [h('p', {}, h('strong', {}, 'Versão ' + estado.aviso.versao + ' disponível')), itens.length ? h('ul', {}, itens.map((i) => h('li', {}, i))) : null,
       h('p', { class: 'suave' }, 'Clique para ver as notas completas (correções, segurança e compatibilidade). Nada é baixado nem instalado automaticamente.')]
    : [h('p', {}, 'Nenhuma atualização pendente.'), h('p', { class: 'suave' }, 'Clique para abrir Atualizações e verificar.')]));
}
async function atualizarSino() { const r = await chamar(api.preferencias); if (r) { estado.prefs = r.preferencias; desenharSino(r.aviso); } return r; }
function ligarSino() {
  const sino = $('#sino'); const dica = $('#sino-dica'); let preso = false;
  const mostrarDica = () => { dica.hidden = false; }; const esconder = () => { if (!preso) dica.hidden = true; };
  sino.addEventListener('mouseenter', mostrarDica); sino.addEventListener('mouseleave', esconder); sino.addEventListener('focus', mostrarDica); sino.addEventListener('blur', esconder);
  sino.addEventListener('keydown', (e) => { if (e.key === 'Escape') { preso = false; dica.hidden = true; } });
  sino.addEventListener('click', async () => {
    dica.hidden = true;
    if (estado.aviso) { await chamar(() => api.marcarVisualizada(estado.aviso.versao)); await atualizarSino(); }
    estado.ajudaAlvo = 'atualizacoes'; mostrar('ajuda');
  });
}
/** Aplica o resultado de uma verificação: atualiza o sino e toca o som no máximo uma vez por versão (decidido e gravado pelo núcleo). */
async function aplicarNotificacao(r) {
  if (!r || !r.notificacao) return; const n = r.notificacao;
  await atualizarSino(); if (n.tocarSom) tocarSom();
}
async function iniciarNotificacoes() {
  // 2.10.1: a consulta automática (ao abrir e a cada 6 horas) é feita pelo processo principal e chega como evento;
  // aqui só se desenha o aviso já conhecido, que funciona offline.
  await atualizarSino(); ligarSino();
}

/** Markdown mínimo (títulos, listas, código, parágrafos), sempre via nós de texto. */
