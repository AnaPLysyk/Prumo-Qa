/** Verifica que frontend/<tela> e as cópias empacotadas não divergem entre si. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const origem = 'frontend';
const copia = 'dist/renderer/telas';
const recursos = JSON.parse(fs.readFileSync('frontend/recursos.json', 'utf8')).recursos;
const mapeadas = new Set(recursos.map(r => r.fonte.slice('frontend/'.length)));
const lista = (base) => {
  const visitar = (p) => fs.readdirSync(p, { withFileTypes: true }).flatMap(ent =>
    ent.isDirectory() ? visitar(path.join(p, ent.name))
      : ent.isFile() ? [path.relative(base, path.join(p, ent.name)).split(path.sep).join('/')] : []);
  return visitar(base).sort();
};
test('frontend: os mesmos arquivos e conteúdos do Electron, sem duplicatas editáveis', () => {
  const arquivos = lista(origem).filter(arq => /\.(js|css|html)$/.test(arq) && !mapeadas.has(arq));
  assert.deepEqual(lista(copia).filter(arq => /\.(js|css|html)$/.test(arq)), arquivos, 'Cópia de execução deve ter os mesmos arquivos distribuíveis da fonte oficial');
  assert.ok(lista(copia).every(arq => !arq.endsWith('.md')), 'Documentação de desenvolvimento não deve ser distribuída como tela');
  for (const arq of arquivos) assert.deepEqual(
    fs.readFileSync(path.join(origem, arq)),
    fs.readFileSync(path.join(copia, arq)),
    'O arquivo executado deve coincidir com a fonte oficial: '+arq
  );
});

test('frontend: recursos têm fonte única e preservam todos os caminhos distribuídos', () => {
  assert.equal(new Set(recursos.map(r => r.fonte)).size, recursos.length);
  assert.equal(new Set(recursos.map(r => r.destino)).size, recursos.length);
  for (const recurso of recursos) {
    assert.deepEqual(fs.readFileSync(recurso.fonte), fs.readFileSync(recurso.destino), 'Recurso divergente: '+recurso.destino);
    assert.ok(!fs.existsSync(path.join(copia, recurso.fonte.slice('frontend/'.length))), 'Recurso não deve ser copiado como tela: '+recurso.fonte);
  }
  const bundles = JSON.parse(fs.readFileSync('ferramentas/frontend/telas-modulares.json', 'utf8')).bundles.map(b => path.basename(b.destino));
  const excluidos = new Set([...bundles, 'agenda.js', 'apoio-v40.js', 'integracoes.js', 'plataforma.js', 'status.css']);
  const runtime = fs.readdirSync('dist/renderer').filter(arq => /\.(js|css|html)$/.test(arq) && !excluidos.has(arq)).sort();
  assert.deepEqual(recursos.filter(r => path.dirname(r.destino) === 'dist/renderer').map(r => path.basename(r.destino)).sort(), runtime, 'Todo recurso não gerado da raiz deve ter fonte oficial');
});
test('frontend: módulos de telas reconhecíveis pelo nome e backend correspondente', () => {
  for (const mod of ['inicio','projetos','tickets','testes','agendamentos','agentes','conexoes','metricas','logs','suporte','ajuda','configuracoes']) {
    assert.ok(fs.statSync(path.join(origem, mod)).isDirectory(), 'Falta tela frontend/'+mod);
    assert.ok(fs.statSync(path.join('backend', mod)).isDirectory(), 'Falta função backend/'+mod);
  }
});
