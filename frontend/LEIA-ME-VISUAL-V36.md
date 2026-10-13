# Interfaces v36 — onde editar cada elemento da interface

Esta pasta reúne partes do visual aprovado de Agentes, Chat, Logs, Histórico, Métricas e Configurações.

- **Agentes:** busque `listarAgentesDisponiveis`, `abrirDetalhesAgente`, `mostrarCerebroAgente`, `mostrarAtividadesAgentes` ou `montarAssistenteFlutuante`.
- **Chat:** busque `montarPainelChat`, `enviarPerguntaChat`, `montarBolhaMensagem` ou `lerRespostaEmVozAlta`.
- **Logs:** busque `montarTelaLogs`, `filtrar`, `desenharLogsFiltrados` ou `carregarRegistrosLog`.
- **Histórico:** busque `montarTelaHistorico`, `filtrarAtividadesHistorico` ou `montarTabelaHistorico`.
- **Métricas:** busque `montarTelaMetricas`, `filtrarRegistrosMetricas` ou `pintarGrafico`.
- **Configurações:** busque `editarPreferenciasAssistente`.

Os nomes estão escritos no próprio caminho do arquivo. Cada parte começa com uma frase de responsabilidade.

## Como funciona

As partes `.parte.js` são **trechos-fonte**, não programas independentes. O script executado pela janela permanece `app/renderer/interfaces-v36.js`, gerado juntando esses trechos **na mesma ordem e com conteúdo idêntico**. Isso preserva funções que compartilham o mesmo escopo e evita mudar o visual antes dos testes.

Use `node ferramentas/frontend/gerar-telas-modulares.mjs` para regenerar; `node ferramentas/frontend/gerar-telas-modulares.mjs --check` para comparar sem alterar; e `npm.cmd run check` para validar. O comando antigo `ferramentas/frontend/gerar-telas-modulares.mjs` continua funcionando como ponte temporária.

**Aviso:** Agentes personalizados seguem como prévias locais; essas telas ainda não representam execução independente, banco multiusuário ou API web. Essas funções permanecem na Proposta.

## Onde encontrar os estilos

Os estilos antigos de `interfaces-v36.css` agora também possuem fontes nomeadas por função em pastas `visual-v36-estilos` dentro de cada tela. Exemplos: `telas/logs/visual-v36-estilos/06-terminal.parte.css`, `telas/historico/visual-v36-estilos/07-historico.parte.css`, `telas/metricas/visual-v36-estilos/08-metricas.parte.css` e `telas/agentes/visual-v36-estilos/14-atividades.parte.css`.

Os arquivos `.parte.css` são trechos que se juntam **sem alterar uma única regra**. O navegador continua carregando `interfaces-v36.css` do mesmo endereço, preservando a ordem da cascata. Não vincular as partes diretamente ao HTML.
