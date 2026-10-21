# Design System do Prumo QA (v40)

Extraído do aplicativo existente (`estilo.css`, `qc.css`, `interfaces-v36.css`,
`qualidade-v39.css`) e do protótipo aprovado `prumo_qa_v39_qualidade_fluxos.html`.
**Não é uma identidade nova.** Cores, temas, tipografia, fundo espacial, menu
lateral, esfera/robô do Orchestrator e chat flutuante continuam definidos onde
sempre estiveram. Este sistema acrescenta escala, superfícies e componentes
comuns para que as telas tenham a mesma estrutura.

| Arquivo | Papel |
|---|---|
| `dist/renderer/estilo.css`, `qc.css` | Tokens de cor e tema (escuro, claro, sistema), cor de destaque, tipografia, menu lateral, fundo vivo. **Fonte das cores.** |
| `dist/renderer/ds.css` | Escala de espaço/raio, superfícies, componentes e utilitários (v40). Carregado por último. |
| `dist/renderer/ds.js` | Construtores dos componentes (`DS.*`). Só cria nós com `h()`/`textContent`; não chama o núcleo. |
| `dist/renderer/qualidade-v39.js` | `<dialog>` único dos detalhes (`#qualidade-dialog`), com foco, Escape e retorno de foco. O DS só o estende (tamanho e subtítulo). |

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

Tokens de tema para as telas (2.11, em `ds.css`, com escuro, claro escolhido e claro do sistema): `--ds-rotulo`
(camada ou rótulo sobre o fundo), `--ds-mistura-retrato` e `--ds-mistura-avatar` (mistura das imagens dos agentes),
`--ds-sombra-curta` e a paleta do terminal `--ds-terminal-*` (mais `--ds-terminal-claro-*` e `--ds-terminal-escuro-*`
para a escolha por janela em Logs).

**Regra:** as cores de tema moram só em `frontend/design-system/` (`estilo.css`, `qc.css`, `ds.css`). Nenhuma tela tem
`data-tema` ou `prefers-color-scheme` nem redefine `--fundo`, `--painel`, `--linha`, `--texto`, `--suave`, `--acento` ou
os estados; trocar uma cor é trocar um arquivo. `testes/unitario/frontend/compartilhado/design-system-tema.test.mjs` garante a regra.

### Espaço, raio e tipo

- Espaço: `--ds-1`…`--ds-8` = 4, 8, 12, 16, 20, 24, 32, 40 px.
- Raio: `--ds-r1` 8 (controles e cartões pequenos), `--ds-r2` 12 (blocos), `--ds-r3` 16 (modal), `--ds-rp` pílula (botões e chips de navegação).
- Controle: `--ds-controle` 34 px de altura (input, select, botão de barra).
- Tipo: Inter (texto e título) e JetBrains Mono (código, ids, referências de arquivo), embutidas em `assets/fontes` (variáveis, subconjunto latino, SIL OFL). Tokens `--fonte-ui` e `--fonte-mono`; as telas nunca declaram família de fonte.
  Corpo 14 px; título da tela 24/650; título de seção 15/600 em caixa normal; título do modal 18/600; secundário 12–12,5 px. Caixa alta só nos rótulos do menu lateral.
  `tabular-nums` só onde há número (tabelas, estatísticas, contagens), nunca no texto corrido.
- Componentes: selos num formato só (6 px, sem borda, fundo na cor do texto); estatísticas em células de largura igual (`.ds-resumo`), com valor em texto menor que valor numérico e zero apagado; filtros numa linha (`.ds-barra`) com seletores sem o visual nativo; plurais por `tr()` ("1 ticket(s)" vira "1 ticket").

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

## 3. Componentes (`frontend/design-system/ds.js` + `ds.css`)

Estas são as fontes oficiais. `frontend:sync` gera os recursos em `dist/renderer/`, preservando os caminhos do instalador. As abas oferecem foco único com Tab, setas com retorno nas extremidades e Home/End; os painéis dos modais têm vínculos ARIA estáveis e a montagem assíncrona conserva a seleção atual. O teste `design-system.test.mjs` verifica foco e respostas fora de ordem em Electron com conteúdo sintético.

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
herdado dos tokens (testado em `janela-e-seguranca.test.mjs`); movimento reduzido desliga
brilhos e giros. Sem rolagem horizontal da página em 1440, 1024 e 860 px nem com
zoom de 200% e 400% (`telas-tickets-testes-e-agenda.test.mjs`): tabelas rolam dentro da própria
caixa e colunas opcionais somem em larguras menores.

## 7. Aplicação

Todas as telas seguem o Design System. Projetos, Testes, Tickets e os demais módulos possuem lógica própria, mas o visual (inclusive componentes específicos) vive em `frontend/design-system/`. Não há grupos de telas com folha de estilo própria.

## Aplicação por tela

Toda a apresentação editável reside em `frontend/design-system/`. As pastas de telas não contêm folhas de estilo próprias.

- `estilo.css` e `qc.css`: tokens de cor, temas, tipografia e base da janela.
- `ds.css` e `ds.js`: componentes reutilizáveis, layout de trabalho e regras de acessibilidade.
- `estilos-das-telas.parte.css`: única fonte dos estilos específicos de todas as telas. O build a reúne em `dist/renderer/interfaces.css`. Cada seção conserva a indicação da tela de origem.
- `qc.js`, `orbitas.js` e `robos.js`: identidade visual comum do sistema e dos agentes.
- `painel-atividades.js`: canvas e apresentação das atividades dos agentes.
- `modal-de-detalhes.css` e `modal-de-detalhes.js`: detalhes compartilhados.

A IDE de Testes ocupa a janela como área de trabalho: explorador lateral, editor central e painel de contexto, sem cartões sobrepostos. O editor é o CodeMirror local, com `Ctrl+S` e gravação pelo contrato do backend. O login e os componentes do chat conservam sua composição específica, mas seus estilos permanecem no mesmo Design System.

**Contrato de manutenção:** mudar cor, espaçamento, fonte, composição, animação, responsividade ou um componente visual somente em `frontend/design-system/`. Mudar consulta, estado, regra da tela ou pedido IPC em `frontend/<tela>/`. Não editar `dist/`, não reescrever bibliotecas vendorizadas de `frontend/compartilhado/vendor/`, não duplicar CSS e não criar pastas só para dividir funções pequenas.

Os auxiliares visuais de formulários (`botao`, `campoPlataforma`, `dadosVisiveis` e `faltaEspaco`) também residem em `frontend/design-system/ds.js`, e não criam arquivos adicionais por tela.

## Acabamento visual e bibliotecas

O Prumo mantém a própria identidade: temas, tipografia, espaçamentos, componentes e estilos ficam em `frontend/design-system/`; a lógica fica na tela. **Usar uma biblioteca não significa trocar o Design System nem instalar um framework novo.** Bibliotecas precisam resolver um componente difícil, preservar o uso offline do Electron, respeitar CSP, acessibilidade e ter licença compatível. O código distribuído deve ser local, versionado e com sua atribuição.

Ordem de adoção, somente quando a necessidade surgir na tela:
- **Lucide (ícones):** candidato à padronização dos SVGs. Antes de instalar, comparar com `DS.icone()`, já centralizado, e evitar manter dois catálogos que façam a mesma coisa.
- **Floating UI 1.8.0 (integrado):** `DS.info` posiciona dicas com `offset` + `flip` + `shift` e acompanhamento do alvo. O bundle local (~16 KB) está em `frontend/compartilhado/vendor/floating-ui-1.8.0.min.js`, com licença `FLOATING-UI-LICENSE.txt` e cópia declarada em `frontend/recursos.json`. É carregado antes de `ds.js`; o app não usa CDN e mantém o `<dialog>` nativo. Novos menus podem reutilizar a biblioteca se houver colisão comprovada.
- **Tom Select (seleção pesquisável):** listas longas de projetos, contas ou recursos; listas pequenas continuam com seletor simples.
- **flatpickr (datas):** agenda e filtros de período, quando o controle nativo não atender o fluxo de usuário.
- **Plotly.js (gráficos):** métricas que exigem interação; tabelas e números simples não precisam da biblioteca.
- **Driver.js (guia pontual):** opção para mostrar uma primeira ação numa tela complexa, somente se um teste de uso comprovar necessidade; não criar tours obrigatórios nem painéis explicativos novos.

CodeMirror e Three.js já existem no aplicativo como bibliotecas locais. Não adicionar React, shadcn/ui, React Hook Form ou XYFlow ao renderer inteiro para fazer formulários comuns; essas opções só fazem sentido mediante decisão de arquitetura e necessidade comprovada.

**Padrão de revisão por agentes (QA geral, Acessibilidade, Playwright e Regressão):** cada estado vazio mostra o que falta e uma ação clara (uma linha de apoio apenas quando necessária); formulários dão nome exato ao campo e ao botão, sem parágrafos repetidos; dados de origem/limitações aparecem perto da ação ou no ícone ⓘ, mas avisos críticos ficam visíveis. Uma ação principal por área, nada de cartão dentro de cartão ou efeitos desnecessários. Verificar com o Electron real: temas claro/escuro, janela estreita, contraste, foco, leitura por teclado, textos longos, rolagem horizontal, estado sem dados, sucesso e falha. Validar a mudança com inspeção, revisor independente e testes existentes. O modal **Minha conta** usa `DS.modal`, `DS.abasModal`, `DS.secao` e estilos `.ds-conta-*` em `ds.css` como exemplo desse padrão.

## Mapa visual de conexões por projeto

A tela **Projetos** apresenta uma lista compacta. Abrir um projeto mostra um **mapa de origem**, com um núcleo Prumo QA e cinco ramificações independentes:

- **Manual / Prumo:** casos, tickets e propostas mantidos no próprio Prumo, sem fornecedor obrigatório.
- **Jira:** projeto externo de gestão/requisitos. Mostra a chave efetivamente vinculada e o estado de validação.
- **Qase:** projeto externo de casos e gestão de qualidade. Mostra a identidade específica da conta vinculada.
- **GitHub:** repositório de código. Mostra o repositório escolhido e oferece trazer a cópia para o computador quando ainda não há pasta local.
- **Pasta local:** diretório vinculado para a IDE e automações. Pode ser escolhido ou trocado pela confirmação nativa.

Cada ramificação exibe a condição real **vinculado/não vinculado**, o identificador de origem e comandos adequados: **Conectar**, **Verificar**, **Remover**, **Escolher pasta** ou **Trocar pasta**. O desenho não pressupõe equivalência entre projetos de serviços diferentes e não cria vínculos apenas pelo nome. **Conectar** abre a lista real da conta e exige confirmação antes de persistir. **Remover** usa o contrato existente e não exclui dados remotos. Os metadados completos ficam recolhidos em *Detalhes técnicos* para a tela permanecer limpa.

O mapa é só uma **representação dos vínculos**: não é o orquestrador de testes, não executa pipelines e não transfere dados entre fornecedores. O isolamento continua garantido por ID de projeto e por ID da conta/recurso. Alterar os vínculos de um projeto só reflete naquele projeto, inclusive ao abrir a IDE e os fluxos de Testes/Tickets.

**Para fazer manutenção:** a regra de cada botão, a seleção de conta, os IDs e o estado do projeto ficam em `frontend/projetos/tela-projetos.js`. O componente visual reutilizável `DS.fluxoProjeto` fica em `frontend/design-system/ds.js`, e **todos** os seus estilos, linhas, estados, tamanhos e comportamento responsivo ficam em `frontend/design-system/ds.css`. Não crie outro componente por fornecedor, nem folha de estilo na pasta da tela. O seletor GitHub usa o mesmo fluxo de importação de Jira/Qase, com uma opção extra de clonagem local.

**Editor de conexões:** o desenho usa portas circulares e cabos SVG calculados pelas posições reais dos módulos. Apenas o projeto interno (Manual) e os serviços efetivamente vinculados têm cabo; serviços desconectados têm portas livres. Clicar na porta livre abre a escolha da conta, recurso ou pasta; clicar numa porta vinculada permite conferir ou trocar a pasta, conforme o serviço. O cabo não simula sincronização, execução nem associação cruzada. A conexão acontece ao escolher um recurso real e confirmar no backend. Em janelas estreitas, a bancada reorganiza os módulos sem esconder as ações. Todas as regras visuais continuam no Design System, sem novos arquivos.

## Conexões dentro de cada projeto

A tela independente **Conexões** foi incorporada a **Projetos**. Cada projeto de qualidade tem o painel expansível **Configurar contas, vínculos e permissões deste projeto**. A autorização de conta do Jira, Qase ou GitHub continua armazenada no cofre e pode ser reutilizada, mas a escolha do recurso, os vínculos, o histórico de operações, a pasta local e a permissão de escrita são **por projeto**. Remover uma credencial compartilhada pode afetar outros projetos; remover um vínculo não remove a credencial nem modifica o recurso remoto.

É possível autorizar uma conta antes de importar o primeiro projeto em **Projetos > Autorizar contas para importar projetos**. A integração Qase por token e sua prévia permanecem nessa área. O painel externo não é mais uma tela ou entrada do menu. A apresentação foi consolidada em frontend/projetos/tela-projetos.js, sem acrescentar arquivos.

O seletor lateral troca o ID do projeto ativo, atualiza o nome e renova o conteúdo dos módulos pela navegação comum. No menu, as legendas de Tickets e Testes mostram as fontes habilitadas para o projeto atual. Funcionalidades manuais continuam disponíveis independentemente das conexões. O contexto visual do menu fica em frontend/compartilhado/navegacaoDaJanela.js; sua aparência em frontend/design-system/ds.css. Credenciais e validações de API permanecem no backend de conexões por segurança.
