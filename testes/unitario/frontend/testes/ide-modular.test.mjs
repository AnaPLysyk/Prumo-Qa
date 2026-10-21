/** Testes: IDE, editor e repositório formam a fonte da tela, com bundle compilado idêntico. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Testes mantém tela, editor, pipelines e IDE em sequência, sem arquivos fragmentados', () => {
  const fonte='frontend/testes/tela-testes.parte.js';
  const manifesto=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
  const bundle=manifesto.bundles.find(b=>b.destino==='dist/renderer/tela-testes.js');
  assert.deepEqual(bundle.origens,[fonte]);
  const codigo=fs.readFileSync(fonte,'utf8');
  for(const trecho of [/async function visaoGeral\(/,/function abrirEditor\(/,/async function telaPipelines\(/,/async function telaCodigo\(/,/function blocoCodigoDoCaso\(/])assert.match(codigo,trecho);
  const posicoes=['async function visaoGeral(','function abrirEditor(','async function telaCodigo('].map(s=>codigo.indexOf(s));
  assert.ok(posicoes.every(x=>x>=0));
  assert.ok(posicoes[0]<posicoes[1]&&posicoes[1]<posicoes[2]);
  assert.equal(codigo.slice(codigo.indexOf('\n')+1),fs.readFileSync(bundle.destino,'utf8'));
});

test('IDE preenche a área de trabalho sem moldura de cartão e mantém o CodeMirror', () => {
  const css = fs.readFileSync('frontend/design-system/ds.css','utf8');
  const ide = fs.readFileSync('frontend/testes/tela-testes.parte.js','utf8');
  assert.match(css, /main#conteudo:has\(> \.ds-ide-cheio\)[^\n]*height: 100dvh/);
  assert.match(css, /#sub-conteudo\.ds-ide-cheio \{[^\n]*flex: 1/);
  assert.match(css, /\.ds-ide \{[^\n]*border: 0; border-radius: 0/);
  assert.match(css, /\.ds-ide-painel \.ds-bloco \{[^\n]*border: 0/);
  assert.match(ide, /window\.CodeMirror\(host,/);
  assert.match(ide, /'Ctrl-S': \(\) => salvar\(\)/);
});
