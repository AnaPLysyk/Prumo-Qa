/** Contrato da interface: propostas locais continuam acessíveis com Qase apenas para leitura. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../frontend/testes');
const acoes = fs.readFileSync(path.join(base, 'visao-geral-dos-testes.parte.js'),'utf8');
const casos = fs.readFileSync(path.join(base, 'fluxos-casos-qase.parte.js'),'utf8');
test('Qase com escrita desligada permite elaborar proposta local, mas não cadastrar caso remoto', () => {
  assert.match(acoes, /vq \? \[DS\.acao\('Nova proposta de caso', \(\) => F\.novaProposta\(e\), \{ id: 'pr-nova'/);
  assert.match(acoes, /DS\.acao\('Novo caso no Qase', \(\) => F\.novoCasoQase\(e\), \{ id: 'qase-novo'/);
  assert.match(acoes, /desabilitado: !esc/);
  assert.match(casos, /DS\.modal\(local \? 'Novo caso local' : 'Nova proposta de caso'/);
  assert.match(casos, /if \(vinc\(e, 'qase'\)\) return/);
});
