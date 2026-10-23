/**
 * Lê a saída TAP do node:test (suítes do Prumo QA Lab no CI) e imprime uma anotação ::error por teste que falhou,
 * com o local e o começo do erro. O log do GitHub Actions exige login; as anotações são públicas pela API,
 * então é por elas que dá para saber qual teste barrou a release. Uso: node anotar-falhas-dos-testes.mjs <saida.log> <rótulo>
 */
import fs from 'node:fs';

const [arquivo, rotulo = 'Testes'] = process.argv.slice(2);
const escapar = (s) => s.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
const escaparPropriedade = (s) => escapar(s).replace(/:/g, '%3A').replace(/,/g, '%2C');
const linhas = fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8').split(/\r?\n/) : [];
const LIMITE = 10; // o GitHub mostra no máximo 10 anotações de erro por passo
let anotadas = 0;
for (let i = 0; i < linhas.length && anotadas < LIMITE; i++) {
  const falha = /^\s*not ok \d+ - (.+)$/.exec(linhas[i]);
  if (!falha) continue;
  const detalhes = [];
  for (let j = i + 1; j < Math.min(i + 60, linhas.length) && detalhes.length < 14; j++) {
    if (/^\s*((ok|not ok) \d+ |# Subtest:|1\.\.\d+)/.test(linhas[j])) break;
    const t = linhas[j].trim();
    if (t && t !== '---' && t !== '...' && !/^(duration_ms|type|failureType|code|stack):/.test(t)) detalhes.push(t);
  }
  console.log(`::error title=${escaparPropriedade(rotulo)}::${escapar([falha[1], ...detalhes].join('\n'))}`);
  anotadas++;
}
if (!anotadas) console.log(`::error title=${escaparPropriedade(rotulo)}::${escapar('Nenhum "not ok" na saída: o executor falhou antes dos testes (veja as últimas linhas).\n' + linhas.filter(Boolean).slice(-8).join('\n'))}`);
