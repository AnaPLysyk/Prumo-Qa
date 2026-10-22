/** Testes: IDE, editor e repositório formam a fonte da tela, com bundle compilado idêntico. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workbench='frontend/testes/ide-workbench.parte.js';
const fonte='frontend/testes/tela-testes.parte.js';

test('Testes mantém workbench, tela, pipelines e IDE em sequência, sem arquivos fragmentados', () => {
  const manifesto=JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json','utf8'));
  const bundle=manifesto.bundles.find(b=>b.destino==='dist/renderer/tela-testes.js');
  assert.deepEqual(bundle.origens,[workbench,fonte]);
  const codigo=fs.readFileSync(fonte,'utf8');
  for(const trecho of [/async function visaoGeral\(/,/async function telaPipelines\(/,/async function telaCodigo\(/,/function blocoCodigoDoCaso\(/])assert.match(codigo,trecho);
  const posicoes=['async function visaoGeral(','async function telaPipelines(','async function telaCodigo('].map(s=>codigo.indexOf(s));
  assert.ok(posicoes.every(x=>x>=0));
  assert.ok(posicoes[0]<posicoes[1]&&posicoes[1]<posicoes[2]);
  const semPrimeiraLinha=(arquivo)=>{const c=fs.readFileSync(arquivo,'utf8');return c.slice(c.indexOf('\n')+1);};
  assert.equal(semPrimeiraLinha(workbench)+semPrimeiraLinha(fonte),fs.readFileSync(bundle.destino,'utf8'));
});

test('IDE preenche a área de trabalho sem moldura de cartão e usa o Monaco isolado', () => {
  const css = fs.readFileSync('frontend/design-system/ds.css','utf8');
  const ide = fs.readFileSync(workbench,'utf8');
  assert.match(css, /main#conteudo:has\(> \.ds-ide-cheio\)[^\n]*height: 100dvh/);
  assert.match(css, /#sub-conteudo\.ds-ide-cheio \{[^\n]*flex: 1/);
  assert.match(css, /\.ds-ide \{[^\n]*border: 0; border-radius: 0/);
  assert.match(css, /\.ds-wb-painel-corpo \.ds-bloco \{[^\n]*border: 0/);
  assert.match(ide, /window\.PrumoEditorDeCodigo\.criar\(/);
  assert.match(ide, /function atalho\(chave\)[\s\S]*s: \(\) => salvar\(\)/);
});

test('Workbench da IDE: abas acessíveis, atalhos, painel inferior e recursos novos protegidos contra canal ausente', () => {
  const ide = fs.readFileSync(workbench,'utf8');
  for(const trecho of [/role: 'tablist'/,/role: 'tab'/,/'aria-selected'/,/aria-live': 'polite'/,/typeof api\.ideBuscar !== 'function'/,/typeof api\.ideGitEstado !== 'function'/,/'S\+p'/,/Fechar sem salvar/])assert.match(ide,trecho);
});
