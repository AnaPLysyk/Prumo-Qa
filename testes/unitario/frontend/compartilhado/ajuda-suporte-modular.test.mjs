/** Garante fonte única e montagem previsível das telas Ajuda e Suporte. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const manifest = JSON.parse(fs.readFileSync('frontend/construcao/telas-modulares.json', 'utf8')).bundles;
const html = fs.readFileSync('frontend/compartilhado/runtime/index.html', 'utf8');
const bundles = [
  {
    saida: 'dist/renderer/ajuda.js',
    partes: ['frontend/ajuda/busca-e-indice.parte.js', 'frontend/ajuda/navegacao-e-conteudo.parte.js'],
    entrada: /abas\.ajuda\s*=/,
    marcador: /function pontuar\(/,
    antigo: 'frontend/ajuda/mostrarAjuda.js'
  },
  {
    saida: 'dist/renderer/suporte.js',
    partes: ['frontend/suporte/chamados-da-pessoa.parte.js', 'frontend/suporte/revisao-e-envio.parte.js', 'frontend/suporte/consultas-e-diagnostico.parte.js'],
    entrada: /abas\.suporte\s*=/,
    marcador: /async function desenharMeus\(/,
    antigo: 'frontend/suporte/mostrarSuporte.js'
  }
];

for (const item of bundles) {
  test(item.saida + ' corresponde às fontes por função e só registra uma tela', () => {
    const b = manifest.find(x => x.destino === item.saida);
    assert.ok(b, 'bundle declarado');
    assert.deepEqual(b.origens, item.partes);
    const fragmentos = item.partes.map(p => fs.readFileSync(p, 'utf8'));
    assert.ok(fragmentos.every(s => s.startsWith('/** ')), 'responsabilidade explicada');
    const compilado = fragmentos.map(s => s.slice(s.indexOf('\n') + 1)).join('');
    assert.equal(compilado, fs.readFileSync(item.saida, 'utf8'));
    assert.doesNotThrow(() => new vm.Script(compilado));
    assert.equal([...compilado.matchAll(new RegExp(item.entrada.source, 'g'))].length, 1);
    assert.match(compilado, item.marcador);
    assert.ok(!fs.existsSync(item.antigo), 'fonte antiga removida');
    assert.ok(html.includes('src="' + item.saida.replace('dist/renderer/', '') + '"'));
  });
}
test('painéis da Ajuda carregam antes da tela e Suporte usa o próprio bundle', () => {
  assert.ok(html.indexOf('src="telas/ajuda/paineis-da-ajuda.js"') < html.indexOf('src="ajuda.js"'));
  assert.ok(!html.includes('telas/suporte/mostrarSuporte.js'));
  assert.ok(!html.includes('telas/ajuda/mostrarAjuda.js'));
});
