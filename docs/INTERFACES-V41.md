# Interfaces v41 — Painel de atividades dos Agentes

Trabalho local na branch `prumo/interfaces-aprovadas-v36`, sobre as alterações v36–v40 ainda não confirmadas.
Referência visual: vídeo enviado pela pessoa (canvas grafite com janelas de terminal ligadas por linhas finas).

## O que mudou

Agentes › **Painel de atividades** deixou de ser um diagrama fixo com lista de cartões e virou um **canvas
infinito** atualizado ao vivo:

| Camada | Conteúdo | Origem do dado |
|---|---|---|
| Janelas (topo) | Um terminal por cliente MCP/CLI observado, o **Prumo Orchestrator**, o **Worker Prumo** e, quando houve delegação, **Claude Code**/**Codex**. Cada janela mostra as últimas linhas registradas. | histórico do núcleo, conversas do chat, fila do worker |
| Hubs (meio) | Ferramenta do núcleo, agente especialista ou rotina. | idem |
| Cartões (base) | Cada operação, conversa ou execução, com etiqueta colorida, estado e horário. Clique abre o detalhe. | idem |

Linhas: cliente → ferramenta → operação; Orchestrator → agente escolhido pelo roteamento → conversa; conversa →
IA externa (tracejada) quando a resposta veio do Claude Code ou do Codex; worker → rotina → execução.
**Toda linha corresponde a um campo gravado**; nenhuma comunicação entre agentes é inferida. Pulsos animados só
aparecem em registros dos últimos 90 s. Estados `STARTED`/`SEM_TERMINO_OBSERVADO` não comprovam processo ativo.

## Uso

- Mouse: arrastar move; Ctrl + roda (ou pinça do trackpad) aproxima; roda move na vertical, Shift + roda na horizontal.
- Toque: um dedo move, pinça aproxima.
- Teclado: foco no canvas, setas movem (Shift acelera), `+`/`-` aproximam, `0` ajusta. Tab percorre os cartões e o canvas centraliza o cartão focado.
- Barra: Ao vivo (consulta a cada 3 s, só com a aba visível), Atualizar, zoom, Ajustar à tela, Tela cheia.
- Minimapa (telas largas, quando o conteúdo não cabe): clique para navegar.
- A disposição escolhe a largura que melhor ocupa a tela e se refaz quando a proporção muda (janela lateral, tela cheia, celular em pé).
- Até 24 cartões por hub; os anteriores ficam em Histórico ou Execuções (cartão "+N anteriores").

## Limites

- O Prumo continua sendo **aplicativo desktop** (Electron). O painel é responsivo, aceita toque e usa só APIs
  padrão da web, mas não existe versão para navegador ou celular: isso exigiria servidor HTTP, o que
  [SEGURANCA.md](SEGURANCA.md) não permite hoje.
- Até 1000 operações, 200 execuções e 40 conversas por agente por consulta (limites já existentes nos canais IPC).
- Nenhum canal IPC, contrato MCP ou dado do núcleo foi alterado.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `app/renderer/painel-atividades-v41.js` | Modelo (fontes, hubs, folhas, arestas), disposição, canvas com pan/zoom, minimapa, atualização ao vivo. |
| `app/renderer/painel-atividades-v41.css` | Estética grafite/terminal, nos temas claro e escuro; movimento reduzido e alto contraste. |
| `app/renderer/i18n-en-v41.js` | Inglês das frases novas. |
| `app/renderer/interfaces-v36.js` | Aba Painel de atividades usa o módulo; diagrama antigo removido. |
| `app/renderer/index.html` | Carrega os arquivos v41. |
| `testes/desktop-interfaces-v36.test.mjs` | Janela por cliente, hubs, uma linha por operação, nada inferido sem conversa/execução, zoom por botão e teclado. |
