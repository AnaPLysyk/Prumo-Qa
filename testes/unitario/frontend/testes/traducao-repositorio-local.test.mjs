/** As mensagens novas da tela do repositório local têm correspondência no idioma inglês. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const dicionario = fs.readFileSync(path.join(raiz, 'frontend/compartilhado/runtime/i18n-en-v41.js'),'utf8');
test('suítes, casos e propostas locais têm tradução registrada', () => {
  for(const rotulo of [
    'Suítes locais','Nova suíte local','Nenhuma suíte local',
    'Crie uma suíte para organizar seus casos.','Casos do repositório local',
    'Nenhum caso local cadastrado','Use Novo caso local para criar o primeiro.',
    'Suíte exclusiva deste projeto. Nada é enviado ao Qase.',
    'Nova proposta de caso','Novo caso no Qase'
  ]) assert.ok(dicionario.includes("'" + rotulo + "': '"),'Tradução ausente: '+rotulo);
});
