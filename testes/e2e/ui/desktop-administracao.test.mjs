// Administração na janela real: a documentação viva mostra o caminho de uma tela até os testes e a busca encontra um canal.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { abrir, novoDados, ir } from '../../apoio/janela.mjs';

test('Administração › Documentação viva: busca por canal abre a tela certa com interface, canais, backend e testes', async (t) => {
  const dados = novoDados(t), a = await abrir(t, dados);
  await a.page.emulateMedia({ reducedMotion: 'reduce' });
  await ir(a.page, 'administracao');
  // 2.11: a Administração abre em Usuários; a documentação viva fica na própria aba.
  await a.page.getByRole('tab', { name: 'Documentação viva' }).click();
  await a.page.waitForSelector('#adm-resumo');
  assert.match(await a.page.textContent('#adm-resumo'), /\d+telas/);
  await a.page.fill('#adm-busca', 'skills:criar');
  const agentes = a.page.locator('#adm-tela-agentes');
  await agentes.waitFor();
  assert.equal(await agentes.getAttribute('open'), '', 'a busca abre a tela encontrada');
  const texto = await agentes.textContent();
  for (const trecho of ['1. Interface', '2. Canais da janela (IPC)', '3. Backend', '4. Testes', 'skills:criar', 'backend/agentes/api/skillsCriar.ts']) assert.ok(texto.includes(trecho), trecho);
  fs.mkdirSync(path.join('tmp', 'evidencias', 'telas'), { recursive: true });
  await a.page.screenshot({ path: path.join('tmp', 'evidencias', 'telas', 'administracao-documentacao.png') });
  await a.page.getByRole('tab', { name: 'Sistema' }).click();
  assert.match(await a.page.textContent('#adm-area'), /conta do Windows/);
  assert.deepEqual(a.erros, []);
});
