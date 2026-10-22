/** Contrato da interface: propostas locais continuam acessíveis com Qase apenas para leitura. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../frontend/testes');
const acoes = fs.readFileSync(path.join(base, 'tela-testes.parte.js'),'utf8');
const casos = fs.readFileSync(path.join(base, 'fluxos-casos-qase.parte.js'),'utf8');
const casosLocais = fs.readFileSync(path.join(base, 'fluxos-repositorio-local.parte.js'),'utf8');
test('Qase com escrita desligada permite elaborar proposta local, mas não cadastrar caso remoto', () => {
  assert.match(acoes, /repositorio: \[menuCriar\(e, \{ modoCriar, vq, esc, mem \}\)\]/);
  const cabecalho = acoes.slice(acoes.indexOf('const acoes = {'), acoes.indexOf("runs: [DS.acao('Preparar run'")); assert.doesNotMatch(cabecalho, /Novo caso no Qase|Consulta avançada|Atualizar/);
  assert.match(fs.readFileSync(path.join(base, 'tela-testes.parte.js'), 'utf8'), /desabilitado: !perm\.qase/);
  assert.match(casos, /DS\.modal\(local \? 'Novo caso local' : 'Nova proposta de caso'/);
  assert.match(casosLocais, /if \(vinc\(e, 'qase'\)\) return/);
});
