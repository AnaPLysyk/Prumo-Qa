'use strict';
/**
 * Reporter do Playwright para o Prumo QA. Copie este arquivo para o seu projeto e declare em playwright.config:
 *   reporter: [['list'], ['./prumo-playwright-reporter.cjs']]
 * Ele escreve cada teste como um cenário em PRUMO_RESULT_FILE (definido pelo Prumo ao executar a capability),
 * no formato { jobId, cases: [{ id, status, evidence }] }. Sem PRUMO_RESULT_FILE não faz nada (execução fora do Prumo).
 */
const fs = require('node:fs');

class PrumoReporter {
  constructor() { this.cases = []; this.vistos = new Map(); this.porTeste = new Map(); this.ambientes = new Map(); this.versoes = new Map(); }
  /** Projetos do Playwright (navegador, dispositivo, viewport) exatamente como o config declara. */
  onBegin(config) {
    for (const p of config.projects || []) {
      const u = p.use || {}; const v = u.viewport; const a = { projeto: p.name, navegador: u.browserName || (u.defaultBrowserType) || undefined, dispositivo: u.isMobile || u.deviceScaleFactor > 1 ? p.name : undefined, viewport: v ? `${v.width}x${v.height}` : undefined, plataforma: process.platform };
      for (const k of Object.keys(a)) if (a[k] == null) delete a[k];
      this.ambientes.set(p.name, a);
    }
  }
  onTestEnd(test, result) {
    let id = this.porTeste.get(test.id);
    if (!id) {
      const base = test.titlePath().filter(Boolean).join(' › ').slice(0, 90);
      const n = (this.vistos.get(base) || 0) + 1; this.vistos.set(base, n);
      id = n > 1 ? `${base} #${n}`.slice(0, 100) : base; this.porTeste.set(test.id, id);
    }
    let status; let evidence;
    if (result.status === 'skipped') { status = 'NOT_RUN'; evidence = 'Teste ignorado (skip) pelo Playwright.'; }
    else if (result.status === 'interrupted') { status = 'NOT_RUN'; evidence = 'Execução interrompida.'; }
    else if (result.status === 'passed' || result.status === test.expectedStatus) { status = 'PASS'; evidence = result.retry ? `Passou na tentativa ${result.retry + 1} (instável).` : 'Passou.'; }
    else { status = 'FAIL'; evidence = (result.error && result.error.message ? String(result.error.message).replace(/\u001b\[[0-9;]*m/g, '') : 'Falhou sem mensagem.').slice(0, 1000); }
    // Só o resultado final de cada teste vale (retentativas sobrescrevem a anterior).
    const i = this.cases.findIndex((c) => c.id === id);
    const caso = { id, status, evidence: evidence || 'sem detalhe' };
    if (i >= 0) this.cases[i] = caso; else this.cases.push(caso);
  }
  onEnd() {
    const alvo = process.env.PRUMO_RESULT_FILE; if (!alvo) return;
    const cases = this.cases;
    const ambientes = [...this.ambientes.values()].slice(0, 12).map((a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, String(v).slice(0, 60)])));
    fs.writeFileSync(alvo, JSON.stringify({ jobId: process.env.PRUMO_JOB_ID, cases, ...(ambientes.length ? { ambientes } : {}) }));
  }
}
module.exports = PrumoReporter;
