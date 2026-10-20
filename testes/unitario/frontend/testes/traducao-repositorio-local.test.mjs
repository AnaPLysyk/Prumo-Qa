/** As mensagens novas da tela do repositório local têm correspondência no idioma inglês. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const runtime = path.join(raiz, 'frontend/compartilhado/runtime');
const html = fs.readFileSync(path.join(runtime, 'index.html'), 'utf8');
const arquivos = [...html.matchAll(/<script src="(i18n-en[^"]*\.js)"/g)].map(x => x[1]);
const janela = {};
const repetidas = [];
// O dicionário é observado desde a criação: chave atribuída de novo (com o mesmo valor ou outro) é repetição.
let dicionario;
Object.defineProperty(janela, 'PRUMO_EN', {
  get: () => dicionario,
  set: (objeto) => { dicionario = new Proxy(objeto, { set(alvo, chave, valor) { if (Object.hasOwn(alvo, chave)) repetidas.push(String(chave)); alvo[chave] = valor; return true; } }); }
});
const contexto = vm.createContext({ window: janela });
function carregar(arquivo) { vm.runInContext(fs.readFileSync(path.join(runtime, arquivo), 'utf8'), contexto, { filename: arquivo }); }
for (const arquivo of arquivos) carregar(arquivo);
test('o inglês fica num dicionário só, sem atribuir a mesma chave duas vezes', () => {
  assert.deepEqual(arquivos, ['i18n-en.js']);
  assert.deepEqual(repetidas, []);
});
test('suítes, casos e propostas locais têm tradução registrada', () => {
  for(const rotulo of [
    'Suítes locais','Nova suíte local','Nenhuma suíte local',
    'Crie uma suíte para organizar seus casos.','Casos do repositório local',
    'Nenhum caso local cadastrado','Use Novo caso local para criar o primeiro.',
    'Suíte exclusiva deste projeto. Nada é enviado ao Qase.',
    'Nova proposta de caso','Novo caso no Qase'
  ]) assert.ok(typeof dicionario[rotulo] === 'string' && dicionario[rotulo], 'Tradução ausente: ' + rotulo);
});
