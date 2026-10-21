/** Painel de conexões: sem órbita, módulos e núcleo arrastáveis sem perder conexões, e o modo "Só ver | Integrado" por ligação. */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ds = fs.readFileSync('frontend/design-system/ds.js', 'utf8');
const css = fs.readFileSync('frontend/design-system/ds.css', 'utf8');
const tela = fs.readFileSync('frontend/projetos/tela-projetos.js', 'utf8');

test('o painel não desenha mais a órbita pontilhada, nem no script nem nos estilos', () => {
  assert.doesNotMatch(ds, /ds-proj-orbita/);
  assert.doesNotMatch(css, /\.ds-proj-orbita/);
});

test('cada módulo e o núcleo são arrastáveis; a posição fica por projeto neste computador e os cabos acompanham', () => {
  assert.match(ds, /tornarArrastavel\(no, id,/);
  assert.match(ds, /tornarArrastavel\(centro, 'nucleo',/);
  assert.match(ds, /'prumo-fluxo:' \+ \(codigo \|\| nome\)/);
  assert.match(ds, /localStorage\.setItem\(chavePosicoes/);
  assert.match(ds, /style\.translate/, 'a posição usa a propriedade translate, sem brigar com as transformações do tema');
  assert.match(ds, /manterNoPainel\(id\); reorganizar\.hidden = false; atualizarCabos\(\);/, 'durante o arrasto os cabos são redesenhados');
  assert.match(ds, /const caixa = grafico\.getBoundingClientRect\(\)/, 'nada sai do painel');
});

test('arrastar nunca desfaz conexão nem abre o painel: o clique que termina o arrasto é descartado e só "Remover" desvincula', () => {
  assert.match(ds, /addEventListener\('click', ev => \{ if \(moveu\) \{ ev\.preventDefault\(\); ev\.stopPropagation\(\); \} \}, true\)/);
  const arrasto = ds.slice(ds.indexOf('function tornarArrastavel'), ds.indexOf('const fluxo = h('));
  assert.doesNotMatch(arrasto, /servicoDesvincular|desvincular|api\./);
  assert.match(ds, /t\.closest\('a, button\.ds-proj-porta, \.ds-proj-modulo-acoes, \.ds-proj-modo,/, 'botões e links dos módulos continuam funcionando');
});

test('em tela estreita (celular) o arrasto fica desligado e a ordem original vale', () => {
  assert.match(ds, /matchMedia\('\(max-width: 950px\)'\)\.matches/);
  assert.match(ds, /ev\.button !== 0 \|\| telaEstreita\(\)/);
  assert.match(css, /@media \(min-width: 951px\)\s*\{\s*\.ds-proj-modulo, \.ds-proj-hub \{ cursor: grab; touch-action: none; \}/);
});

test('"Reorganizar" apaga as posições guardadas e só aparece depois de mover algo', () => {
  assert.match(ds, /id: 'projeto-reorganizar', hidden: !Object\.keys\(posicoes\)\.length/);
  assert.match(ds, /posicoes = \{\}; guardarPosicoes\(\);/);
});

test('cada ligação tem o controle Só ver | Integrado, com ajuda do que o modo Integrado libera, e o modo não depende de link escondido', () => {
  assert.match(ds, /'aria-pressed': String\(!s\.modo\.integrado\)/);
  assert.match(ds, /'Só ver'\)/);
  assert.match(ds, /'Integrado'\)/);
  assert.match(tela, /modo: v && !v\.desligado \? \{ integrado: !!escrita\?\.\[servico\], aoAlterar: integrar => atualizar\(\(\) => api\.escritaHabilitar\(espaco\.id, servico, integrar\)\)\(\), ajuda: AJUDA_DO_MODO\[servico\] \} : null/);
  assert.doesNotMatch(tela, /'Integrar \(enviar também\)'/);
  for (const frase of ['publica os defeitos e melhorias que abriu no Jira, comenta resultados', 'criar casos, defeitos e runs e publicar resultados no Qase', 'criar issues e branches, gravar testes e abrir Pull Request em rascunho'])
    assert.ok(tela.includes(frase), frase);
  assert.match(tela, /sempre com a sua confirmação/);
});

test('o modo só aparece em ligação ativa: desligada não oferece integrar', () => {
  assert.match(tela, /modo: v && !v\.desligado/);
});

test('o núcleo do projeto não tem mais "Trocar projeto": quem troca é o seletor do topo', () => {
  assert.doesNotMatch(ds, /ds-proj-hub-trocar|projeto-nucleo-trocar/);
  assert.doesNotMatch(css, /ds-proj-hub-trocar/);
  assert.doesNotMatch(tela, /trocarProjeto, abrirConexao/);
  assert.match(tela, /id:'projetos-trocar'|id: ?'projetos-trocar'/);
});

test('cada origem tem ícone próprio no mesmo traço (Jira, Qase, GitHub, pasta e manual) e a cor da marca só aparece quando conectada', () => {
  for (const origem of ['jira', 'qase', 'github', 'local']) assert.ok(ds.includes(`case '${origem}': return svg(`), origem);
  assert.match(ds, /default: return svg\(\['M7 3\.5h6\.5L18 8v12\.5H7z'/);
  assert.match(css, /\.ds-proj-modulo\[data-vinculado="sim"\]\[data-servico="jira"\] \.ds-proj-modulo-emblema \{ color: #2684ff;/);
  assert.doesNotMatch(ds, /ds-proj-jira-marca|ds-proj-qase-marca|icone\(servico === 'local'/);
});

test('a trilha de navegação existe no Design System e aparece nos painéis de projeto e no fluxo de importação', () => {
  assert.match(ds, /function trilha\(itens, \{ rotulo = 'Você está em', semAtual = false \} = \{\}\)/);
  assert.match(ds, /h\('nav', \{ class: 'ds-trilha', 'aria-label': tr\(rotulo\) \}/);
  assert.match(ds, /'aria-current': 'page'/);
  assert.match(css, /\.ds-trilha li \+ li::before/);
  assert.match(tela, /trilhaDoPainel\.replaceChildren\(\.\.\.\(trilha && DS\.trilha \? \[DS\.trilha\(\[\['Projetos', fechar\]\]/);
  assert.match(tela, /trilha\(\[rotulo, voltarLista\], \['Destino'\]\)/);
});

test('botões menores em telas e modais, sem encolher o texto abaixo do legível', () => {
  const regra = css.slice(css.indexOf('Botões menores em telas e modais'));
  assert.match(regra, /body button\.acao \{ min-height: 28px; padding: 4px 12px; font-size: 12\.5px;/);
  assert.match(regra, /body button\.acao\.compacto \{ min-height: 24px;/);
  assert.match(regra, /\.ds-proj-topo button\.acao[^{]*\{ min-height: 30px;/);
  for (const [, px] of regra.matchAll(/font-size: (\d+(?:\.\d+)?)px/g)) assert.ok(Number(px) >= 12, 'fonte mínima de 12px: ' + px);
});

test('importar não decide sozinho: o portão tem Qase, Jira, GitHub, pasta e manual, e cada origem termina em "projeto novo" ou "projeto que já existe"', () => {
  for (const id of ['espaco-importar-', 'espaco-importar-pasta', 'espaco-importar-manual', 'importar-criar', 'importar-pasta-nova']) assert.ok(tela.includes(id), id);
  assert.match(tela, /async function decidirDestino\(conta, recurso, voltarLista\)/);
  assert.match(tela, /'Nasce só com ' \+ rotulo/);
  assert.match(tela, /jaTem \? chipCx\('já tem ' \+ rotulo, 'aviso'\)/);
  assert.match(tela, /vinculando:soFormulario,comProjeto:!!e/);
});

test('o arrasto não captura o ponteiro: o clique no emblema continua chegando ao botão que abre a conexão', () => {
  const arrasto = ds.slice(ds.indexOf('function tornarArrastavel'), ds.indexOf('const fluxo = h('));
  assert.doesNotMatch(arrasto, /setPointerCapture|releasePointerCapture/);
  assert.match(arrasto, /window\.addEventListener\('pointermove', mover\)/);
  assert.match(arrasto, /window\.removeEventListener\('pointerup', soltar\)/);
});

test('posição guardada vale só no layout largo e é reajustada quando a janela muda; o corte de tela estreita é o mesmo do CSS', () => {
  assert.match(ds, /posicoes\[id\] && !telaEstreita\(\) \? posicoes\[id\]\.x/);
  assert.match(ds, /function reajustar\(\)/);
  assert.match(ds, /reajustar\(\); atualizarCabos\(\);/);
  assert.match(css, /@media \(max-width: 950px\) \{\s*\.ds-proj-grafo \{ display: flex; flex-direction: column/);
});

test('o núcleo e o painel não carregam mais parâmetros do antigo "Trocar projeto"', () => {
  assert.doesNotMatch(ds, /trocarProjeto|aoAlternar/);
  assert.match(tela, /function montarFluxoProjeto\(espaco, abrirConexao, escrita = null\)/);
});
