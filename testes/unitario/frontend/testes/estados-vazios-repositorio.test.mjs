import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../');
const fonte = arquivo => fs.readFileSync(path.join(raiz, arquivo), 'utf8');

function renderizarRelacoes(nos, lacunas = []) {
  const renderizado = [];
  const DS = {
    info: texto => texto,
    secao: (titulo, conteudo) => ({ titulo, conteudo }),
    estadoTela: (...args) => ({ args }),
    tabela: config => ({ config })
  };
  const h = (tipo, atributos, ...filhos) => ({ tipo, atributos, filhos });
  const contexto = {
    DS, h, tr: texto => texto,
    mapa: { nos, lacunas, arestas: [], operacoesRecentes: [], aviso: 'Vínculos não são execução.' },
    renderizado
  };
  vm.runInNewContext(
    fonte('frontend/testes/fluxos-vinculos.parte.js') +
      '\nrelacoes({}, mapa, { append(...itens) { renderizado.push(...itens); } }, null);',
    contexto
  );
  const secao = renderizado.find(item => item?.titulo === 'Lacunas de cadastro');
  assert.ok(secao, 'seção de lacunas renderizada');
  return JSON.stringify(secao.conteudo);
}

test('projeto vazio não anuncia ausência comprovada de lacunas', () => {
  const saida = renderizarRelacoes([{ id: 'prumo', tipo: 'projeto', rotulo: 'Teste' }]);
  assert.match(saida, /Sem casos ou tickets para avaliar lacunas/);
  assert.doesNotMatch(saida, /Nenhuma lacuna de cadastro encontrada/);
});

test('recursos conhecidos não são apresentados como comprovação de cobertura', () => {
  const saida = renderizarRelacoes([
    { id: 'prumo', tipo: 'projeto', rotulo: 'Teste' },
    { id: 'caso-local:123', tipo: 'caso-local', rotulo: 'Exemplo' }
  ]);
  assert.match(saida, /Isso não comprova cobertura ou execução/);
});

test('lacunas existentes permanecem visíveis após a mudança de estados vazios', () => {
  const saida = renderizarRelacoes(
    [{ id: 'prumo', tipo: 'projeto', rotulo: 'Teste' }],
    [{ tipo: 'CASO_SEM_TICKET', mensagem: 'Caso local sem ticket associado' }]
  );
  assert.match(saida, /Caso local sem ticket associado/);
  assert.doesNotMatch(saida, /Sem casos ou tickets para avaliar lacunas/);
});

test('sem Qase, ausência de pasta não impede cadastrar casos e suítes locais', () => {
  const origem = fonte('frontend/testes/visao-geral-dos-testes.parte.js');
  assert.match(origem, /if \(src\.cat\?\.semPasta && !vq\)/);
  assert.match(origem, /Você já pode criar casos e suítes locais sem Qase ou GitHub/);
  assert.match(origem, /Seus casos e suítes locais continuam disponíveis acima/);
  assert.doesNotMatch(origem, /Vincule a pasta do repositório \(ou o repositório do GitHub\) e o projeto do Qase em Projetos\./);
});
