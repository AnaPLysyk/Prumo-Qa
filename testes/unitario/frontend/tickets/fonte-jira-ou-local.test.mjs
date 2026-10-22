import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pasta = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../frontend/tickets');
const arquivos = ['tela-tickets.parte.js'];
const fonte = arquivos.map(nome => fs.readFileSync(path.join(pasta, nome), 'utf8')).join('\n');

test('Novo ticket é um botão só e segue as conexões do projeto', () => {
  assert.match(fonte, /DS\.acao\('Novo ticket', \(\) => abrirNovoTicket\(e, \(\) => buscar\(\)\), \{ id: 'tk-novo', primaria: true, icone: 'mais', desabilitado: !podeCriar \}\)/);
  assert.match(fonte, /\.filter\(\(x\) => x\.vinculo && !x\.vinculo\.desligado\)/, 'vínculo desligado não conta como conexão');
  assert.match(fonte, /tr\('\{s\} somente leitura', \{ s: x\.nome \}\)/, 'qualquer ferramenta em Só ver aparece como somente leitura, não só o Jira');
  assert.doesNotMatch(fonte, /Novo rascunho local|Destinos disponíveis para publicação|data-destinos-publicacao|Prumo · rascunho local/);
});
test('o destino vem das conexões: rascunho no Prumo só com Manual ativo e ferramenta em Só ver indisponível', () => {
  assert.match(fonte, /e\.manualAtivo !== false \? \[\{ servico: 'prumo'/);
  assert.match(fonte, /role: 'radiogroup'/);
  assert.match(fonte, /Só ver neste projeto/);
  assert.match(fonte, /Habilitar em Projetos/);
  assert.match(fonte, /Nenhum destino disponível/, 'sem Manual e sem escrita, o modal explica em vez de abrir vazio');
});
test('publicar sai só pela operação confirmada e cada destino tem os próprios campos', () => {
  assert.match(fonte, /operacao = 'qase\.criar_defeito'/);
  assert.match(fonte, /operacao = 'github\.criar_issue'/);
  assert.match(fonte, /operacao = 'jira\.criar_ticket'/);
  assert.match(fonte, /const r = await executarOperacao\(e, operacao, p\);/, 'a operação só sai pela confirmação do processo principal');
  assert.match(fonte, /api\.propostaCriar\(e\.id, 'bug', dados/);
  assert.match(fonte, /atual === 'qase' \? 'Resultado observado \*' : 'Descrição'/);
});
test('a falha de origem liga o ticket à run, ao cenário e à evidência', () => {
  assert.match(fonte, /async function falhasDasRuns/);
  assert.match(fonte, /async function vincularFalha/);
  for (const tipo of ["tipo: 'run'", "tipo: 'qase'", "tipo: 'qase-run'", "tipo: 'evidencia'"]) assert.ok(fonte.includes(tipo), tipo);
  assert.match(fonte, /TRACE_DUPLICATE/, 'vínculo repetido não é erro');
  assert.match(fonte, /api\.runEvidencias\(/);
});
test('a criação aceita vínculos a casos, cenários, automações, evidências e outros tickets, gravados só depois do item existir', () => {
  assert.match(fonte, /function vinculosExtras\(e\)/);
  for (const tipo of ["tipo: 'qase'", "tipo: 'caso-local'", "tipo: 'automacao'", "tipo: 'evidencia'", "tipo: 'jira'", "tipo: 'qase-defeito'", "tipo: 'github-issue'", "tipo: 'ticket-local'"]) assert.ok(fonte.includes(tipo), tipo);
  assert.match(fonte, /api\.servicoConsultar\(e\.id, 'jira', 'ticket', \{\}, chave\)/, 'o ticket do Jira é conferido antes de entrar na lista');
  assert.match(fonte, /const vincularTudo = async \(item\)/);
  assert.equal((fonte.match(/concluir\(await vincularTudo\(/g) || []).length, 2, 'rascunho e publicação direta registram os mesmos vínculos');
  assert.match(fonte, /async function vincularExtras/);
});
test('rascunho e publicação permitem destinos isolados ou múltiplos sem confundir Actions com Issues', () => {
  assert.match(fonte, /\['local', 'Manter rascunho local'\]/);
  assert.match(fonte, /data-selecao-destinos/);
  assert.match(fonte, /const destinosMarcados/);
  assert.match(fonte, /vg\s*&&\s*perm\.github\s*\)\s*opcoesDestino\.push/);
  assert.match(fonte, /\['github', 'Publicar em GitHub Issues · '/);
  assert.match(fonte, /vg && perm\.github/, 'GitHub Issues exige vínculo e escrita habilitada');
  assert.doesNotMatch(fonte, /github-pendente/);
  assert.match(fonte, /api\.propostaPublicar\(p\.id, tipoId, marcados\[0\]/);
  assert.match(fonte, /Publicação parcial/);
});
test('filtros de período também se aplicam a Qase, GitHub e rascunhos locais', () => {
  assert.match(fonte, /Date\.parse\(d\.updated_at \|\| 0\)/);
  assert.match(fonte, /Date\.parse\(i\.atualizado \|\| 0\)/);
  assert.match(fonte, /Date\.parse\(p\.atualizadaEm \|\| 0\)/);
  assert.match(fonte, /const dentroDoPeriodo = \(valor\) =>/);
  assert.match(fonte, /\['7', 'Últimos 7 dias'\], \['30', 'Últimos 30 dias'\], \['90', 'Últimos 90 dias'\]/);
  assert.match(fonte, /if \(f\.periodo\) fj\.desde = inicioDoPeriodo\(\)/, 'o Jira recebe o início do período e filtra todas as páginas');
  assert.match(fonte, /!dentroDoPeriodo\(d\.updated_at\)/);
  assert.match(fonte, /!dentroDoPeriodo\(i\.atualizado\)/);
  assert.match(fonte, /!dentroDoPeriodo\(p\.atualizadaEm\)/);
});
test('situação vale para todas as origens, traduzindo o status de cada serviço', () => {
  assert.match(fonte, /\['aberto', 'Abertos'\], \['andamento', 'Em andamento'\], \['concluido', 'Concluídos'\]/);
  assert.match(fonte, /naSituacao\(\{ new: 'aberto', indeterminate: 'andamento', done: 'concluido' \}\[x\.status\?\.statusCategory\?\.key\]\)/);
  assert.match(fonte, /naSituacao\(\{ open: 'aberto', in_progress: 'andamento', resolved: 'concluido', invalid: 'concluido' \}\[d\.status\]\)/);
  assert.match(fonte, /naSituacao\(i\.estado === 'closed' \? 'concluido' : 'aberto'\)/);
  assert.match(fonte, /naSituacao\(p\.estado === 'VINCULADA' \|\| p\.estado === 'PUBLICADA' \? 'concluido' : 'aberto'\)/);
  assert.match(fonte, /\{ aberto: 'open', andamento: 'in_progress' \}\[f\.situacao\]/, 'aberto e em andamento vão para a API do Qase');
});
test('a barra de filtros não tem botão Buscar, texto livre de status nem par de datas', () => {
  assert.match(fonte, /DS\.barra\(q\.no, origem, vj \? tipo : null, situacao, periodo\)/);
  assert.match(fonte, /aoEnter: \(\) => buscar\(\)/);
  assert.doesNotMatch(fonte, /tk-buscar|tk-status|tk-desde|tk-ate|type: 'date'/);
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
