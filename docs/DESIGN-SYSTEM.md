# Design System do Prumo QA (v40)

Extraído do aplicativo existente (`estilo.css`, `qc.css`, `interfaces-v36.css`,
`qualidade-v39.css`) e do protótipo aprovado `prumo_qa_v39_qualidade_fluxos.html`.
**Não é uma identidade nova.** Cores, temas, tipografia, fundo espacial, menu
lateral, esfera/robô do Orchestrator e chat flutuante continuam definidos onde
sempre estiveram. Este sistema acrescenta escala, superfícies e componentes
comuns para que as telas tenham a mesma estrutura.

| Arquivo | Papel |
|---|---|
| `app/renderer/estilo.css`, `qc.css` | Tokens de cor e tema (escuro, claro, sistema), cor de destaque, tipografia, menu lateral, fundo vivo. **Fonte das cores.** |
| `app/renderer/ds.css` | Escala de espaço/raio, superfícies, componentes e utilitários (v40). Carregado por último. |
| `app/renderer/ds.js` | Construtores dos componentes (`DS.*`). Só cria nós com `h()`/`textContent`; não chama o núcleo. |
| `app/renderer/qualidade-v39.js` | `<dialog>` único dos detalhes (`#qualidade-dialog`), com foco, Escape e retorno de foco. O DS só o estende (tamanho e subtítulo). |

## 1. Fundamentos

### Cor (existente, não alterada)

| Token | Escuro | Claro | Uso |
|---|---|---|---|
| `--fundo` / `--fundo2` | `#040712` / `#070d1d` | `#f5f8fc` / `#eef3fb` | Página e áreas recuadas |
| `--painel` | `#0a1122` | `#ffffff` | Lateral, modal, campos |
| `--linha` | `#1c2742` | `#cfd9ea` | Divisórias |
| `--texto` / `--suave` | `#f3f6fc` / `#9aa8c2` | `#14233d` / `#465875` | Texto principal e secundário |
| `--acento` | `#6ea8ff` (ou cor escolhida) | `#1f56b8` | Ação principal, foco, seleção |
| `--ok` `--falha` `--aviso` `--neutro` | verde / vermelho / âmbar / cinza | versões AA | Estados PASS, FAIL, BLOCKED, NOT_RUN |
| `--qc-azul` `--qc-vermelho` `--qc-branco` | RGB | RGB | Halo, anéis da esfera, realces translúcidos |

Derivados v40 (sempre calculados dos tokens acima): `--ds-linha-suave`,
`--ds-superficie`, `--ds-superficie-2`, `--ds-hover`, `--ds-selecionado`.
Cores de origem, usadas só em pontos e indicadores: `--ds-jira`, `--ds-qase`,
`--ds-github`, `--ds-local`, `--ds-prumo`.

### Espaço, raio e tipo

- Espaço: `--ds-1`…`--ds-8` = 4, 8, 12, 16, 20, 24, 32, 40 px.
- Raio: `--ds-r1` 8 (controles e cartões pequenos), `--ds-r2` 12 (blocos), `--ds-r3` 16 (modal), `--ds-rp` pílula (botões e chips de navegação).
- Controle: `--ds-controle` 34 px de altura (input, select, botão de barra).
- Tipo: Segoe UI Variable (texto/título). Título da tela 24/600; título do modal 18/600;
  rótulos de seção 11,5 px em caixa alta com espaçamento 0,08em; corpo 13,5 px; secundário 12–12,5 px.
  Números sempre com `tabular-nums`.

## 2. Estrutura de uma tela

```
DS.cabecalho  → título + contagem · uma linha de contexto · ações (primária à direita)
barraSub      → abas da tela (sublinhado), quando houver subáreas
DS.barra      → busca + filtros + metadado à direita
.ds-fontes    → origem e horário de cada consulta (Jira · 3 tickets · consultado 12:40)
DS.tabela     → registros; "Abrir →" abre o modal de detalhe
DS.secao      → blocos secundários, sem cartão
```

Regras: um único botão primário por tela; sem cartões em volta de listas; nenhum
texto explicativo que não mude a decisão da pessoa; limites reais do núcleo são
ditos uma vez, perto da ação afetada.

## 3. Componentes (`ds.js` + `ds.css`)

| Componente | API | Notas |
|---|---|---|
| Cabeçalho | `DS.cabecalho({ titulo, contagem, idContagem, descricao, acoes })` | Mantém a esfera do Prumo antes do título. |
| Botão | `DS.acao(texto, fn, { id, primaria, compacto, icone, desabilitado })` | Desabilita durante a ação assíncrona. Ação indisponível = `desabilitado` + motivo visível. |
| Link de abrir | `DS.link(texto, fn, { rotulo, seta })` | Seta decorativa sem entrar no nome acessível (`content: "→" / ""`). |
| Barra de filtros | `DS.barra(...)`, `DS.busca({ id, placeholder })`, `DS.selecao({ id, rotulo, opcoes })` | Controles com `aria-label`; quebra linha em telas estreitas. |
| Tabela | `DS.tabela({ id, colunas, linhas })` | Linha com `abrir` é clicável e tem botão "Abrir" para teclado. Coluna `{ t, classe: 'ds-opcional' }` some abaixo de 1240 px. |
| Chip e origem | `DS.chip(texto, tom)`, `DS.origem('jira' | 'qase' | 'github' | 'prumo' | 'local' | 'manual')` | Tons `ok`, `falha`, `aviso`, `info`. Estados do núcleo continuam com `selo()`. |
| Estados | `DS.estadoTela('vazio' | 'erro' | 'bloqueado' | 'carregando', titulo, descricao, acoes)`, `DS.esqueleto(n)`, `DS.carregando()` | Sempre com texto (o modal fecha sozinho se ficar vazio). |
| Alerta | `DS.alerta(texto, tom, icone)`, `DS.notaPermissao(texto)` | Permissão: cadeado âmbar + motivo. |
| Abas | `DS.abas(itens, atual, aoTrocar)` | `role=tablist`, setas ←/→. Subáreas de tela usam `barraSub` (mesmo visual). |
| Formulário | `DS.campo(rotulo, controle, { inteiro, ajuda })`, `DS.grupo(legenda, ...)` | Grade de 2 colunas (1 abaixo de 640 px), rótulo acima, ações à direita. |
| Detalhe | `DS.meta(pares, { linha })`, `DS.bloco(titulo, ...)`, `DS.texto(valor)`, `DS.recolher(titulo, ...)`, `DS.tempo(eventos)` | Metadados em coluna lateral ou em linha; linha do tempo para etapas e histórico. |
| Modal | `DS.modal(titulo, conteudo, { tamanho: 'sm' | 'md' | 'lg', subtitulo })`, `DS.abasModal(paineis)`, `DS.rodape(...)` | Reusa `#qualidade-dialog`. `lg` tem altura fixa e rola só o corpo; `md` acompanha o conteúdo. Painéis das abas carregam na primeira abertura. |
| Trilha | `.ds-no` (`data-servico`, `data-origem`) | Tracejado = declarado; contínuo = registrado pelo Prumo; verde = observado em execução. Vínculo removido fica desabilitado. |
| Documentação | `.ds-doc`, `.ds-links`, `.ds-doc-cartoes`, `.ds-prosa` | Índice agrupado, busca com trecho destacado. |
| Atendimento | `.ds-atendimento`, `.ds-passos-form`, `.ds-diag` | Formulário + lateral (acesso rápido, diagnóstico local, acompanhamento). |

Utilitários (a CSP do aplicativo bloqueia o atributo `style`): `ds-mt`, `ds-mb`,
`ds-m0`, `ds-ml`, `ds-min0`, `ds-flex1`, `ds-w-sm`, `ds-coluna`, `coluna`,
`ds-passo-linha`, `visually-hidden`. Estilo dinâmico só por CSSOM (`el.style.width`).

## 4. Padrão de detalhe em modal

Ticket, defeito, caso, plano, run, rotina e execução abrem no mesmo `<dialog>`:

- título = identificador + resumo; subtítulo = origem, tipo e estado em chips;
- `lg`: conteúdo principal à esquerda e `aside` com metadados e ações (280 px);
- registros com várias naturezas de dado usam abas (Execução: Resumo · Etapas · Logs · Evidências);
- ação que escreve fora (Jira/Qase) só fica ativa com escrita habilitada no projeto
  e sempre passa pela confirmação nativa do processo principal;
- fechar (×, Escape ou clique fora) preserva filtros, lista e posição, e devolve o foco ao registro.

## 5. Texto

Português técnico e curto, com nome exato da funcionalidade. Evitar "gerenciar",
"poderoso", "inteligente", exclamação e frases de marketing. Dizer o limite real
("Defeitos do Qase são somente leitura no Prumo") em vez de esconder o botão sem
explicação. Toda string nova tem entrada em `i18n-en-v40.js`; chaves existentes
não são redefinidas.

## 6. Acessibilidade e responsividade

Foco visível com `--acento`; navegação por teclado em abas e tabelas; contraste
herdado dos tokens (testado em `desktop.test.mjs`); movimento reduzido desliga
brilhos e giros. Sem rolagem horizontal da página em 1440, 1024 e 860 px nem com
zoom de 200% e 400% (`desktop-v40.test.mjs`): tabelas rolam dentro da própria
caixa e colunas opcionais somem em larguras menores.

## 7. Aplicação

Grupo B (implementado com o DS): Tickets, Testes (Catálogo, Casos, Suites, Planos,
Runs, Automação), Agendamentos, Execuções (evidências dentro da execução),
Rastreabilidade, Suporte e Ajuda.

Grupo A (preservado; só correções comprovadas em `ds.css`): Início/Orchestrator,
chat flutuante, Agentes/Cérebro, Métricas, Histórico, Logs, Conexões e Projetos.
Correções: barra de Métricas/Histórico e abas de Agentes causavam rolagem
horizontal entre 831 e 860 px.
