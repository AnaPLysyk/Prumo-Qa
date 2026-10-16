import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const fonte = fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../frontend/tickets/fluxos-tickets.parte.js'), 'utf8');

test('com Jira vinculado, o modo manual continua disponível sem publicar', () => {
  assert.match(fonte, /DS\.acao\('Novo rascunho local'/);
  assert.match(fonte, /vj\s*&&\s*DS\.acao\('Novo ticket'/);
  assert.match(fonte, /abrirCriar\(e,\s*\{\}\)/);
});
test('rascunho e publicação têm destinos diferentes e não confundem Actions com Issues', () => {
  assert.match(fonte, /\['local', 'Manter rascunho local'\]/);
  assert.match(fonte, /destino\.value === 'qase'/);
  assert.match(fonte, /destino\.value === 'jira'/);
  assert.match(fonte, /\['github', 'Publicar em GitHub Issues · '/);
  assert.match(fonte, /vg && perm\.github/, 'GitHub Issues exige vínculo e escrita habilitada');
  assert.match(fonte, /Isso não dispara GitHub Actions/);
  assert.doesNotMatch(fonte, /github-pendente/);
  assert.match(fonte, /api\.propostaPublicar\(p\.id, tipoId, destino\.value/);
});
test('lista de tickets reúne GitHub Issues do repositório vinculado sem misturar origens', () => {
  assert.match(fonte, /api\.servicoConsultar\(e\.id, 'github', 'issues'/);
  assert.match(fonte, /\['github', 'GitHub Issues'\]/);
  assert.match(fonte, /'data-origem': 'github'/);
});
test('tickets locais antigos continuam visiveis para preservar historico e rastreabilidade', () => {
  assert.match(fonte, /carregarLocais\(e\)/);
  assert.match(fonte, /mem\.locais\?\.itens/);
});
test('rascunho local já publicado aparece uma vez só: a linha do serviço ganha a marca e a local some', () => {
  assert.match(fonte, /publicadosPeloPrumo\.has\(p\.remoto\?\.chave\)\) continue;/);
  assert.match(fonte, /marcaPrumo\(i\.key\)/, 'Jira');
  assert.match(fonte, /marcaPrumo\(vq\.recurso\.chave \+ '-' \+ d\.id\)/, 'Defeitos Qase');
  assert.match(fonte, /marcaPrumo\('#' \+ i\.numero\)/, 'GitHub Issues');
});
