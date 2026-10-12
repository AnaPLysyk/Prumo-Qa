/** Verifica que frontend/<tela> e as cópias empacotadas não divergem entre si. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const origem = 'frontend';
const copia = 'app/renderer/telas';
const lista = (base) => {
  const visitar = (p) => fs.readdirSync(p, { withFileTypes: true }).flatMap(ent =>
    ent.isDirectory() ? visitar(path.join(p, ent.name))
      : ent.isFile() ? [path.relative(base, path.join(p, ent.name)).split(path.sep).join('/')] : []);
  return visitar(base).sort();
};
test('frontend: os mesmos arquivos e conteúdos do Electron, sem duplicatas editáveis', () => {
  const arquivos = lista(origem);
  assert.deepEqual(lista(copia), arquivos, 'Cópia de execução deve ter as mesmas pastas e arquivos da fonte oficial');
  for (const arq of arquivos) assert.deepEqual(
    fs.readFileSync(path.join(origem, arq)),
    fs.readFileSync(path.join(copia, arq)),
    'O arquivo executado deve coincidir com a fonte oficial: '+arq
  );
});
test('frontend: módulos de telas reconhecíveis pelo nome e backend correspondente', () => {
  for (const mod of ['inicio','projetos','tickets','testes','agendamentos','execucoes','rastreabilidade','agentes','conexoes','metricas','historico','logs','suporte','ajuda','configuracoes']) {
    assert.ok(fs.statSync(path.join(origem, mod)).isDirectory(), 'Falta tela frontend/'+mod);
    assert.ok(fs.statSync(path.join('backend', mod)).isDirectory(), 'Falta função backend/'+mod);
  }
});
