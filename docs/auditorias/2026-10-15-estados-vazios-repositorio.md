# Continuação — estados vazios do repositório e rastreabilidade

Data: 15/10/2026. Versão local: 2.14.1. Branch: main. Sem commit, push, deploy ou alterações em projetos externos.

## Contexto verificado
- A ponte Electron já registra os canais `repositorio:listar`, `repositorio:caso` e `repositorio:suite`, e a interface já utiliza os serviços para projetos sem Qase.
- A integração estrutural está presente, mas os resultados não comprovam uma jornada humana completa no Electron.
- A auditoria manual observou um projeto sem casos exibindo ausência de lacunas mesmo sem dados avaliáveis.

## Ajustes nesta rodada
- `frontend/testes/visao-geral-dos-testes.parte.js`: ausência de pasta local não sugere obrigatoriedade do Qase ou GitHub. A mensagem distingue catálogo de automação dos casos e suítes locais, que já podem ser cadastrados.
- `frontend/testes/fluxos-vinculos.parte.js`: mapa sem caso/ticket mostra **sem dados para avaliar lacunas**. Um mapa com recursos e sem lacuna identificada informa o limite da análise, sem declarar cobertura ou execução.
- `frontend/compartilhado/runtime/i18n-en-v41.js`: tradução das novas mensagens.
- `testes/unitario/frontend/testes/estados-vazios-repositorio.test.mjs`: testes dinâmicos isolados de rastreabilidade e validação do modo local.

## Evidências
- `node --test testes/unitario/frontend/testes/estados-vazios-repositorio.test.mjs`: **4/4 PASS**.
- `node --test testes/unitario/frontend/testes/*.test.mjs`: **35/35 PASS**.
- `npm.cmd run build`: **PASS**, com geração das telas e TypeScript aprovado.
- `git diff --check`: PASS na verificação anterior à documentação.
- A verificação completa está sujeita à política do `AGENTS.md`, que proíbe testes com bancos e projetos externos. Testes de navegador/Electron não podem ser tratados como homologados nessa condição.

## Situação e limites
- Ajustes de apresentação **verificados por testes isolados**, não por clique humano numa janela real.
- Homologação completa da interface e escrita/leitura reais de Jira/Qase **NOT_RUN** nesta continuação.
- Não acessar perfil pessoal do Prumo, nem utilizar tokens e projetos externos sem autorização e escopo isolado.

## Resultado da verificação ampliada protegida
- `npm.cmd run check` com bloqueio de SQLite e Electron: **662 testes, 547 PASS, 110 FAIL, 5 SKIP**; código de saída 1. Os 110 FAIL registraram `electron.launch: TEST_ISOLATION_BLOCKED`, uma recusa deliberada do navegador para preservar a regra de isolamento. A suíte completa NÃO foi aprovada.
- Log local: `C:\Users\DELL\AppData\Local\Temp\prumo-check-estados-20261015.log`. O bloqueio não foi removido e nenhuma janela Electron foi iniciada nesta etapa.
