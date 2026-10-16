# Homologação assistida — Login e Qase

Data: 15/10/2026. Prumo QA 2.14.1 — alterações locais não publicadas.

## Solicitação da pessoa testadora

Captura do Electron mostrando conta local `ana` conectada, painel Conexões com Qase ainda sem conta conectada e erro genérico "Não foi possível acessar o Qase. Verifique sua internet e tente novamente". Queixa adicional: recuperação de senha pouco visível e apresentação técnica de erros de login. Pedido de comparar com repositório antigo **Quality Control**.

## Referência histórica e impedimento

Repositório histórico identificado como `AnaLysyk/Quality_Control`. A conexão GitHub desta sessão usa `AnaPLysyk`; a leitura de `AnaLysyk/Quality_Control` retornou 404. O código do Quality Control **não foi inspecionado nem copiado**. Solicitar acesso da conta proprietária ou clone autorizado para comparar implementações na próxima etapa.

## Achados confirmados no código do Prumo

1. Login local do Prumo é separado da conexão Qase. A captura mostra sessão local `ana` ativa, mas não uma conexão Qase concluída.
2. `frontend/login/entrarNaConta.js` já tinha "Esqueci a senha" na entrada, com recuperação por código exibido uma única vez ao criar a conta; conta Administrador também pode redefinir uma senha temporária via Administração. A recuperação não estava disponível diretamente em Minha conta.
3. O frontend mostrava texto de erro do backend via `textoErro`, incluindo códigos e mensagens arbitrárias.
4. A conexão Qase utiliza `api.qasePrever` para consultar projetos sem salvar token em caso de falha. O código `SERVICE_UNAVAILABLE` pode representar erro DNS, conexão HTTPS ou resposta do provedor (5xx); a captura **não comprova a causa específica**.

## Correções locais aplicadas

- Entrada: tratamento de erros de autenticação, cadastro, senha e recuperação por códigos conhecidos, sem exibir exceções ou dados livres. Erros desconhecidos recebem mensagem neutra.
- Entrada: apresentação dos erros com o mesmo componente visual `ds-alerta` do Design System, com ícone e `role=alert`.
- Minha conta: opção **Redefinir senha com código**. O campo login é preenchido com o usuário da sessão. Após redefinição bem-sucedida, a sessão atual é encerrada e um novo código é exibido uma única vez.
- Qase: erros apresentados dentro do formulário, com `aria-live`, sem toast genérico e sem exibir o token. Distinção entre timeout, permissão, token inválido, limite de requisições e falha de comunicação. Botão desabilitado durante a consulta e token limpo ao fim.
- Novos testes determinísticos em `testes/regressao/frontend/conexoes/mensagens-login-qase.test.mjs`. Nenhuma chamada ao Qase, GitHub ou conta real.

## Validação e limites

Teste direcionado novo **5/5 PASS**. `node --check` de ambos os arquivos JS e `git diff --check` concluídos sem erro. `npm run check:isolado` executado após alterações; anexar resultado final abaixo.

**Ainda não comprovado**: login real com senha recuperada na janela, conexão Qase bem-sucedida e comparação com o código de `AnaLysyk/Quality_Control`. A janela Electron aberta pela pessoa não foi recarregada nem reiniciada durante as alterações, para preservar a sessão e o fluxo em andamento.

Nenhum token, senha, projeto externo ou credencial foi acessado; sem commit, push ou deploy.

## Resultado final do check isolado

`npm.cmd run check:isolado`: **573/573 PASS, 0 FAIL, 0 SKIP**, **94 arquivos elegíveis**, **37 arquivos NOT_RUN**, processo terminou com **exit code 0**. Dependências, TypeScript e build concluíram no mesmo comando; `git diff --check` PASS.

Log: `C:\Users\DELL\AppData\Local\Temp\prumo-check-login-qase-20261015.log`.

As novas alterações **ainda não estão recarregadas na janela Electron aberta**; a pessoa testadora deve escolher o momento de recarregar para não perder um formulário em andamento. Recarregar não autentica o Qase e não comprova conexão real.

O check completo `npm run check` ainda não tem homologação visual E2E autorizada; os 37 arquivos não foram simulados como PASS.
