/** Resume o estado do caso usando evidências conhecidas. Parte de testes-v40.js; nao carregar isoladamente. */
  const situacao = (l) => {
    if (l.caso && l.impl.length) return { t: 'Caso com código', tom: 'ok' };
    if (l.caso && l.execucao === 'automatizado') return { t: 'Automatizado no Qase, código não encontrado', tom: 'aviso' };
    if (l.caso && l.execucao === 'planejado') return { t: 'Automação planejada', tom: 'info' };
    if (l.caso) return { t: 'Manual', tom: null };
    if (l.qaseSemCaso) return { t: tr('Anota Qase {ids}, caso não encontrado', { ids: l.qaseSemCaso.join(', ') }), tom: 'aviso' };
    return { t: 'Código sem caso no Qase', tom: null };
  };

  // ======================= Tela =======================
