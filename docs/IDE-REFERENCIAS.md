# IDE do Prumo: o que vem do VS Code e de outras IDEs, e o que falta

Este documento guarda a análise que orienta a evolução da IDE (Testes › IDE › Código). Cada ideia diz de onde vem, se já está no Prumo e onde mexer para continuar. A regra é copiar o **comportamento que a pessoa já conhece**, não código: o editor é o Monaco (o do VS Code) e o resto é do Prumo. A análise parte da documentação oficial lida em 22/10/2026:

- VS Code: [Interface do usuário](https://code.visualstudio.com/docs/getstarted/userinterface) e [Edição evoluída](https://code.visualstudio.com/docs/editing/editingevolved)
- Zed: [Primeiros passos](https://zed.dev/docs/getting-started)
- JetBrains: [Tour pela interface](https://www.jetbrains.com/help/idea/guided-tour-around-the-user-interface.html)

## O que já está no Prumo

| Ideia | Origem | No Prumo | Onde |
| --- | --- | --- | --- |
| Barra de atividades e barra lateral com vistas (Explorador, Buscar, Git, Executar) | VS Code | Sim | `ide-workbench.parte.js` (`VISOES`, `trocarVisao`) |
| Abas com ponto de "não salvo" e menu de contexto da aba (fechar, fechar outras, fechar todas, fixar, copiar caminho) | VS Code | Sim | `desenharAbas`, `itensDaAba` |
| **Aba em pré-visualização**: um clique no explorador reaproveita a aba (itálico); duplo clique ou editar fixa | VS Code | Sim | `abrir(arquivo, linha, previa)`, `fixar` |
| Paleta de comandos e abertura rápida com prefixos `>` comandos, `:` linha, `@` símbolos | VS Code | Sim | `itensRapida`, `comandos` |
| Ir para símbolo (`Ctrl+Shift+O`), renomear (`F2`), espiar definição (`Alt+F12`), formatar, vários cursores, localizar e substituir | VS Code | Sim, pelo Monaco | `editor.js` (`ACOES`) |
| Minimapa, rolagem fixa do contexto, guias e cores nos pares de colchetes, dobrar blocos | VS Code | Sim, pelo Monaco | `editor.js` (`editor.create`) |
| Painel inferior com Problemas, Saída, Testes e Terminal | VS Code | Sim | `PAINEIS`, `desenharPainel` |
| Terminal integrado com confirmação a cada comando | VS Code | Sim, mais restrito | `backend/projetos/ideTerminal.ts`, `terminal.js` |
| **Modo foco** (`Ctrl+K Z`, `Esc` duas vezes sai) | VS Code | Sim | `alternarZen`, CSS `data-zen` |
| Barra de status com ramo, erros e avisos, posição, recuo, fim de linha e linguagem | VS Code | Sim | `status`, `atualizarStatus` |
| **Margem do Git**: barrinhas de linhas novas, alteradas e removidas | VS Code e JetBrains (gutter) | Sim | `trechosDoDiff`, `margemDoGit`, `editor.js` (`decoracoes`) |
| Folha de atalhos | VS Code | Sim (paleta ou abertura) | `mostrarAtalhos` |
| Menu de contexto da árvore com ações do projeto | JetBrains (menus de contexto) | Sim | `itensDoNo` |
| **Pedir ao Orquestrador** a partir do arquivo, da pasta ou da seleção do editor; comandos de IDE em frases curtas | Zed (painel do agente) e Cursor | Sim, com o robô flutuante do Prumo | `interpretarPedido`, `editor.addAction` |
| Configurações do editor (quebra de linha, minimapa, fonte) lembradas | VS Code e Zed (editor de configurações) | Parcial: sem tela de configurações | `guardarOpcoes` |

## O que é só do Prumo (o que nenhuma IDE tem)

- O Orquestrador age dentro da IDE (abrir, buscar, criar arquivo ou pasta com confirmação, executar no terminal com confirmação) pelas mesmas portas que a pessoa usa.
- Tudo que grava, executa ou publica passa pela confirmação nativa do sistema, com o texto exato. Nenhum agente confirma por conta própria.
- A IDE conhece os testes do projeto (catálogo de testes, casos do Qase, tickets do Jira): a aba **Testes** do painel lista os testes do arquivo aberto.

## Próximos passos, em ordem de valor

1. **Lentes de código nos testes** (JetBrains: ícones de rodar na margem; VS Code: CodeLens). Acima de cada teste do arquivo: "Ver caso do Qase", "Perguntar ao Orquestrador" e "Rodar este teste" (este último só depois de o framework do projeto ser detectado, sempre pela confirmação do terminal). Dados: `o.testesDoArquivo`; no editor, `monaco.languages.registerCodeLensProvider`.
2. **Estrutura do arquivo** (VS Code: visão Outline; JetBrains: Structure) numa vista da barra lateral, e **breadcrumbs com símbolos** acima do editor. Dados: símbolos do Monaco via `getDocumentSymbols`.
3. **Editor dividido** (`Ctrl+\`, grupos de editor): hoje há um só iframe de editor; dividir pede um segundo iframe por grupo e abas por grupo.
4. **Vários terminais em abas** e terminal por pasta (hoje é um por projeto, sempre na raiz).
5. **Tela de configurações da IDE** (Zed: Settings Editor; JetBrains: configurações sem janela modal): tema do editor, fonte, espaços, minimapa, guias, formatar ao colar.
6. **Atalhos configuráveis** e conjunto "VS Code / JetBrains" para quem vem de outra IDE.
7. **Estilo de abrir tudo** (JetBrains: Search Everywhere): uma entrada só que busca arquivos, comandos, símbolos e texto, com abas por tipo.
8. **Diferenças lado a lado** (editor de diff do Monaco) para o Controle de código-fonte, hoje em texto.
9. **Referências e problemas do projeto inteiro**: análise de tipos do TypeScript com os pacotes do projeto carregados (hoje só sintaxe, para não inventar erro "Cannot find module").
10. **Histórico local de arquivos** (JetBrains: Local History) a cada salvar.

## Como continuar sem quebrar

- O editor e o terminal são páginas isoladas (`frontend/editor-de-codigo/`), com política de segurança própria. Mexer nelas por mensagens, nunca dando a ponte do aplicativo (`api`) ao iframe.
- Tudo novo do lado da janela fica em `ide-workbench.parte.js` (uma função por responsabilidade) e ganha teste em `testes/unitario/frontend/testes/`. Lógica pura, como `trechosDoDiff`, é testada carregando o arquivo num contexto isolado.
- Texto novo da tela entra no dicionário em inglês (`i18n-en.js`).
- Para ver o resultado de verdade, use o Electron sem janela: página de teste em `dist/renderer/` e captura por `capturePage()`. O roteiro usado nesta sessão está descrito em `ide-monaco-editor-isolado` (memória do projeto).
